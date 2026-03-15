package controllers

import (
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

var baseURL string = "https://cdn.jsdelivr.net/gh/168WenFangjun/zhix-articles@main" 

var coverImages = []string{
	baseURL + "/images/1.png",
	baseURL + "/images/2.webp",
	baseURL + "/images/3.png",
	baseURL + "/images/4.webp",
	baseURL + "/images/5.png",
}

var coverCartoons = []string{
	baseURL + "/cartoons/cat.webp",
	baseURL + "/cartoons/cold.webp",
}

var coverVideos = []string{
	baseURL + "/videos/cat.mp4",
	baseURL + "/videos/cold.mp4",
	baseURL + "/videos/flower.webm",
	baseURL + "/videos/flower.mp4",
}

func init() {
	rand.Seed(time.Now().UnixNano())
}

func GetCoverImage(c *gin.Context) {
	randomIndex := rand.Intn(len(coverImages))
	c.JSON(http.StatusOK, gin.H{
		"coverImage": coverImages[randomIndex],
	})
}

func GetCoverCartoon(c *gin.Context) {
	randomIndex := rand.Intn(len(coverCartoons))
	c.JSON(http.StatusOK, gin.H{
		"coverImage": coverCartoons[randomIndex],
	})
}

func GetCoverVideo(c *gin.Context) {
	randomIndex := rand.Intn(len(coverVideos))
	c.JSON(http.StatusOK, gin.H{
		"coverVideo": coverVideos[randomIndex],
	})
}
