package models

import (
	"time"

	"gorm.io/gorm"
)

type Order struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	OrderID       string         `gorm:"uniqueIndex;not null" json:"orderId"`
	TransactionID string         `gorm:"index" json:"transactionId"`
	UserID        int            `gorm:"index" json:"userId"`
	ArticleID     int            `gorm:"index" json:"articleId"`
	Amount        float64        `gorm:"not null" json:"amount"`
	Currency      string         `gorm:"default:'CNY'" json:"currency"`
	Status        string         `gorm:"index;default:'pending'" json:"status"`
	PaymentMethod string         `gorm:"default:'apple_pay'" json:"paymentMethod"`
	Description   string         `json:"description"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}
