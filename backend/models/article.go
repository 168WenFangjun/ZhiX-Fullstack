package models

import (
	"time"

	"gorm.io/gorm"
)

type Article struct {
	ID         uint           `gorm:"primarykey" json:"id"`
	Title      string         `gorm:"not null" json:"title"`
	Author     string         `json:"author"`
	AuthorID   uint           `gorm:"index" json:"authorId"`
	CoverImage  string         `json:"coverImage"`
	Content     string         `gorm:"type:text" json:"content"`
	ContentLink string         `json:"contentLink"`
	Excerpt     string         `json:"excerpt"`
	Tags       string         `json:"tags"`
	IsPaid     bool           `gorm:"default:false" json:"isPaid"`
	Likes      int            `gorm:"default:0" json:"likes"`
	Views      int            `gorm:"default:0" json:"views"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}
