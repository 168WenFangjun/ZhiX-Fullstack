package routes

import (
	"payment-service/controllers"
	"payment-service/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		payment := api.Group("/payment")
		{
			payment.POST("/apple-pay/verify-merchant", controllers.VerifyApplePayMerchant)

			authenticated := payment.Group("")
			authenticated.Use(middleware.AuthMiddleware())
			{
				authenticated.POST("/apple-pay", controllers.ProcessApplePay)
				authenticated.GET("/orders/:orderId", controllers.GetOrderStatus)
			}
		}
	}
}
