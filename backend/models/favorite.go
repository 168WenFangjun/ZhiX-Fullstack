package models

import (
	"time"

	"gorm.io/gorm"
)

type Favorite struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	UserID    uint           `gorm:"index:idx_user_article,unique" json:"userId"`
	ArticleID uint           `gorm:"index:idx_user_article,unique" json:"articleId"`
	CreatedAt time.Time      `json:"createdAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
