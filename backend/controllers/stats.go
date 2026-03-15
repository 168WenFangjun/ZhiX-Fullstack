package controllers

import (
	"net/http"
	"zhix-backend/config"
	"zhix-backend/models"

	"github.com/gin-gonic/gin"
)

func GetUserStats(c *gin.Context) {
	userID := c.GetUint("userId")
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	level, levelNum := user.GetLevel()
	c.JSON(http.StatusOK, gin.H{
		"user":     user,
		"level":    level,
		"levelNum": levelNum,
	})
}

func IncrementLogin(c *gin.Context) {
	userID := c.GetUint("userId")
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return
	}

	if user.Role == "admin" {
		config.DB.Model(&user).Update("admin_login_count", user.AdminLoginCount+1)
	} else {
		config.DB.Model(&user).Update("login_count", user.LoginCount+1)
	}
}

func IncrementArticleView(c *gin.Context) {
	userID := c.GetUint("userId")
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return
	}

	if user.Role == "admin" {
		config.DB.Model(&user).Update("admin_view_count", user.AdminViewCount+1)
	} else {
		config.DB.Model(&user).Update("article_view_count", user.ArticleViewCount+1)
	}
	c.JSON(http.StatusOK, gin.H{"message": "View counted"})
}

func IncrementArticleLike(c *gin.Context) {
	userID := c.GetUint("userId")
	config.DB.Model(&models.User{}).Where("id = ?", userID).Update("article_like_count", config.DB.Raw("article_like_count + 1"))
	c.JSON(http.StatusOK, gin.H{"message": "Like counted"})
}

func IncrementFavorite(c *gin.Context) {
	userID := c.GetUint("userId")
	config.DB.Model(&models.User{}).Where("id = ?", userID).Update("favorite_count", config.DB.Raw("favorite_count + 1"))
	c.JSON(http.StatusOK, gin.H{"message": "Favorite counted"})
}
