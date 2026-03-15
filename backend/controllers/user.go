package controllers

import (
	"net/http"
	"zhix-backend/config"
	"zhix-backend/models"

	"github.com/gin-gonic/gin"
)

func UpdateAvatar(c *gin.Context) {
	var input struct {
		Avatar string `json:"avatar" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("userId")
	
	if err := config.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar", input.Avatar).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新头像失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "头像更新成功"})
}
