package controllers

import (
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

func GetRandomAvatar(c *gin.Context) {
	avatarNum := rand.Intn(60) + 1
	avatarURL := fmt.Sprintf("https://cdn.jsdelivr.net/gh/168WenFangjun/zhix-articles@main/avatars/avatar-%d.png", avatarNum)
	
	c.JSON(http.StatusOK, gin.H{
		"avatar": avatarURL,
	})
}
