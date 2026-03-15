package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"not null" json:"-"`
	Phone     string         `json:"phone"`
	Nickname  string         `gorm:"default:'极客的志向'" json:"nickname"`
	Avatar    string         `json:"avatar"`
	Role      string         `gorm:"default:user" json:"role"`
	IsPremium bool           `gorm:"default:false" json:"isPremium"`
	
	ArticleViewCount    int `gorm:"default:0" json:"articleViewCount"`
	ArticleLikeCount    int `gorm:"default:0" json:"articleLikeCount"`
	LoginCount          int `gorm:"default:0" json:"loginCount"`
	FavoriteCount       int `gorm:"default:0" json:"favoriteCount"`
	
	PublishedCount      int `gorm:"default:0" json:"publishedCount"`
	AdminViewCount      int `gorm:"default:0" json:"adminViewCount"`
	AdminLoginCount     int `gorm:"default:0" json:"adminLoginCount"`
	TotalFavorited      int `gorm:"default:0" json:"totalFavorited"`
	TotalViewed         int `gorm:"default:0" json:"totalViewed"`
	TotalLiked          int `gorm:"default:0" json:"totalLiked"`
	
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *User) GetLevel() (string, int) {
	if u.Role == "admin" {
		score := u.PublishedCount*10 + u.AdminViewCount + u.AdminLoginCount*2 + u.TotalFavorited*5 + u.TotalViewed + u.TotalLiked*3
		if score >= 1000 { return "首席编辑", 5 }
		if score >= 500 { return "高级编辑", 4 }
		if score >= 200 { return "资深编辑", 3 }
		if score >= 50 { return "编辑", 2 }
		return "实习编辑", 1
	}
	score := u.ArticleViewCount + u.ArticleLikeCount*3 + u.LoginCount*2 + u.FavoriteCount*5
	if score >= 500 { return "传奇用户", 5 }
	if score >= 200 { return "资深用户", 4 }
	if score >= 80 { return "活跃用户", 3 }
	if score >= 20 { return "普通用户", 2 }
	return "新手用户", 1
}
