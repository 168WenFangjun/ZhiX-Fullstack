package main

import (
	"log"
	"net/http"
	"os"
	"time"
	"zhix-backend/config"
	"zhix-backend/routes"

	"github.com/gin-gonic/gin"
)

var Version = "dev"

func main() {
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	config.InitDB()
	config.InitRedis()

	r := gin.Default()
	r.Use(corsMiddleware())
	
	r.GET("/health", healthCheck)
	r.GET("/ready", readinessCheck)

	routes.SetupRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s (version: %s)", port, Version)
	r.Run(":" + port)
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"version": Version,
		"time":    time.Now().Unix(),
	})
}

func readinessCheck(c *gin.Context) {
	sqlDB, err := config.DB.DB()
	if err != nil || sqlDB.Ping() != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not ready", "reason": "database"})
		return
	}

	if _, err := config.RedisClient.Ping(config.Ctx).Result(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not ready", "reason": "redis"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ready"})
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowedOrigins := []string{"http://localhost:3000", "https://zhix.club", "https://www.zhix.club"}
		
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}
		
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
