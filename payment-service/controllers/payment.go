package controllers

import (
	"bytes"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"payment-service/config"
	"payment-service/models"
	"time"

	"github.com/gin-gonic/gin"
)

func ProcessApplePay(c *gin.Context) {
	var input struct {
		PaymentToken string  `json:"paymentToken" binding:"required"`
		Amount       float64 `json:"amount" binding:"required"`
		Currency     string  `json:"currency"`
		Description  string  `json:"description"`
		ArticleID    int     `json:"articleId"`
		UserID       int     `json:"userId"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment data"})
		return
	}

	if input.Currency == "" {
		input.Currency = "CNY"
	}

	orderId := generatePaymentID()

	if len(input.PaymentToken) < 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment token"})
		return
	}

	paymentGateway := os.Getenv("PAYMENT_GATEWAY")
	var success bool
	var transactionId string

	switch paymentGateway {
	case "stripe":
		success, transactionId = processStripePayment(input.PaymentToken, input.Amount, input.Currency)
	case "adyen":
		success, transactionId = processAdyenPayment(input.PaymentToken, input.Amount, input.Currency)
	default:
		success, transactionId = processStripePayment(input.PaymentToken, input.Amount, input.Currency)
	}

	if !success {
		c.JSON(http.StatusPaymentRequired, gin.H{
			"error":   "Payment processing failed",
			"orderId": orderId,
		})
		return
	}

	order := models.Order{
		OrderID:       orderId,
		TransactionID: transactionId,
		UserID:        input.UserID,
		ArticleID:     input.ArticleID,
		Amount:        input.Amount,
		Currency:      input.Currency,
		Status:        "completed",
		PaymentMethod: "apple_pay",
		Description:   input.Description,
	}

	if err := config.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"orderId":       orderId,
		"transactionId": transactionId,
		"amount":        input.Amount,
		"currency":      input.Currency,
		"status":        "completed",
		"timestamp":     time.Now().Unix(),
		"message":       "Payment processed successfully",
	})
}

func VerifyApplePayMerchant(c *gin.Context) {
	var input struct {
		ValidationURL string `json:"validationURL" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid validation URL"})
		return
	}

	certFile := os.Getenv("APPLE_PAY_CERT_FILE")
	keyFile := os.Getenv("APPLE_PAY_KEY_FILE")

	if certFile == "" || keyFile == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Apple Pay certificates not configured"})
		return
	}

	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load certificates"})
		return
	}

	merchantIdentifier := os.Getenv("APPLE_PAY_MERCHANT_ID")
	displayName := os.Getenv("APPLE_PAY_DISPLAY_NAME")
	domainName := os.Getenv("APPLE_PAY_DOMAIN")

	requestBody := map[string]string{
		"merchantIdentifier": merchantIdentifier,
		"displayName":        displayName,
		"initiative":         "web",
		"initiativeContext":  domainName,
	}

	jsonData, _ := json.Marshal(requestBody)

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				Certificates: []tls.Certificate{cert},
				RootCAs:      loadAppleRootCA(),
			},
		},
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("POST", input.ValidationURL, bytes.NewBuffer(jsonData))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate merchant"})
		return
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Merchant validation failed"})
		return
	}

	var merchantSession map[string]interface{}
	json.Unmarshal(body, &merchantSession)

	c.JSON(http.StatusOK, merchantSession)
}

func GetOrderStatus(c *gin.Context) {
	orderId := c.Param("orderId")

	var order models.Order
	if err := config.DB.Where("order_id = ?", orderId).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orderId":       order.OrderID,
		"transactionId": order.TransactionID,
		"amount":        order.Amount,
		"currency":      order.Currency,
		"status":        order.Status,
		"createdAt":     order.CreatedAt,
	})
}

func generatePaymentID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return "pay_" + hex.EncodeToString(b)
}

func processStripePayment(token string, amount float64, currency string) (bool, string) {
	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	if stripeKey == "" {
		return false, ""
	}

	client := &http.Client{Timeout: 30 * time.Second}
	data := map[string]interface{}{
		"amount":   int(amount * 100),
		"currency": currency,
		"source":   token,
	}

	jsonData, _ := json.Marshal(data)
	req, _ := http.NewRequest("POST", "https://api.stripe.com/v1/charges", bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer "+stripeKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return false, ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, ""
	}

	var result map[string]interface{}
	body, _ := ioutil.ReadAll(resp.Body)
	json.Unmarshal(body, &result)

	if id, ok := result["id"].(string); ok {
		return true, id
	}

	return false, ""
}

func processAdyenPayment(token string, amount float64, currency string) (bool, string) {
	adyenKey := os.Getenv("ADYEN_API_KEY")
	adyenMerchant := os.Getenv("ADYEN_MERCHANT_ACCOUNT")
	if adyenKey == "" || adyenMerchant == "" {
		return false, ""
	}

	client := &http.Client{Timeout: 30 * time.Second}
	data := map[string]interface{}{
		"amount": map[string]interface{}{
			"value":    int(amount * 100),
			"currency": currency,
		},
		"merchantAccount": adyenMerchant,
		"paymentMethod": map[string]interface{}{
			"type":         "applepay",
			"applePayToken": token,
		},
		"reference": generatePaymentID(),
	}

	jsonData, _ := json.Marshal(data)
	req, _ := http.NewRequest("POST", "https://checkout-test.adyen.com/v68/payments", bytes.NewBuffer(jsonData))
	req.Header.Set("X-API-Key", adyenKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return false, ""
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	body, _ := ioutil.ReadAll(resp.Body)
	json.Unmarshal(body, &result)

	if pspRef, ok := result["pspReference"].(string); ok {
		if resultCode, ok := result["resultCode"].(string); ok && resultCode == "Authorised" {
			return true, pspRef
		}
	}

	return false, ""
}

func loadAppleRootCA() *x509.CertPool {
	rootCAs, _ := x509.SystemCertPool()
	if rootCAs == nil {
		rootCAs = x509.NewCertPool()
	}

	certFile := os.Getenv("APPLE_ROOT_CA_FILE")
	if certFile != "" {
		if certs, err := ioutil.ReadFile(certFile); err == nil {
			rootCAs.AppendCertsFromPEM(certs)
		}
	}

	return rootCAs
}
