package models

type HomepageConfig struct {
	ID        uint   `gorm:"primarykey" json:"id"`
	ArticleID uint   `gorm:"not null" json:"articleId"`
	Position  int    `gorm:"not null" json:"position"`
}
