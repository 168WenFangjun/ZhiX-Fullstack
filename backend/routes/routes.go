package routes

import (
	"zhix-backend/controllers"
	"zhix-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", controllers.Register)
			auth.POST("/login", controllers.Login)
		}

		avatar := api.Group("/avatar")
		{
			avatar.GET("/random", controllers.GetRandomAvatar)
		}

		cover := api.Group("/cover")
		{
			cover.GET("/random", controllers.GetCoverImage)
			cover.GET("/cartoon", controllers.GetCoverCartoon)
			cover.GET("/video", controllers.GetCoverVideo)
		}

		user := api.Group("/user")
		user.Use(middleware.AuthMiddleware())
		{
			user.PUT("/avatar", controllers.UpdateAvatar)
		}

		articles := api.Group("/articles")
		{
			articles.GET("", controllers.GetArticles)
			articles.GET("/homepage", controllers.GetHomepageArticles)
			articles.GET("/GetArticle/:level1/:level2/:level3", controllers.GetArticleContent)
			articles.GET("/:id", controllers.GetArticle)
			articles.POST("/:id/like", middleware.AuthMiddleware(), controllers.LikeArticle)
			articles.POST("/:id/view", controllers.ViewArticle)
			articles.POST("/:id/favorite", middleware.AuthMiddleware(), controllers.AddFavorite)
			articles.DELETE("/:id/favorite", middleware.AuthMiddleware(), controllers.RemoveFavorite)
			articles.GET("/:id/favorite/check", middleware.AuthMiddleware(), controllers.CheckFavorite)

			protected := articles.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
			{
				protected.POST("", controllers.CreateArticle)
				protected.PUT("/:id", controllers.UpdateArticle)
				protected.DELETE("/:id", controllers.DeleteArticle)
			}
		}

		favorites := api.Group("/favorites")
		favorites.Use(middleware.AuthMiddleware())
		{
			favorites.GET("", controllers.GetFavorites)
		}

		stats := api.Group("/stats")
		stats.Use(middleware.AuthMiddleware())
		{
			stats.GET("/me", controllers.GetUserStats)
			stats.POST("/view", controllers.IncrementArticleView)
			stats.POST("/like", controllers.IncrementArticleLike)
			stats.POST("/favorite", controllers.IncrementFavorite)
		}
	}
}
