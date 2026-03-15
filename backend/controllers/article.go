package controllers

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"
	"zhix-backend/config"
	"zhix-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func GetArticles(c *gin.Context) {
	search := c.Query("search")
	manageMode := c.Query("manage") == "true"
	var articles []models.Article

	query := config.DB
	
	if manageMode {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				return []byte("zhix-secret-key-2024"), nil
			})
			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					userID := uint(claims["userId"].(float64))
					query = query.Where("author_id = ?", userID)
				}
			}
		}
	}
	
	if search != "" {
		keywords := strings.Fields(search)
		if len(keywords) > 0 {
			var conditions []string
			var args []interface{}
			for _, keyword := range keywords {
				conditions = append(conditions, "(title ILIKE ? OR tags ILIKE ? OR author ILIKE ?)")
				args = append(args, "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
			}
			query = query.Where(strings.Join(conditions, " OR "), args...)
		}
	}

	if err := query.Order("created_at DESC").Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result := make([]map[string]interface{}, len(articles))
	for i, article := range articles {
		var tags []string
		if article.Tags != "" {
			json.Unmarshal([]byte(article.Tags), &tags)
		}
		result[i] = map[string]interface{}{
			"id":          article.ID,
			"title":       article.Title,
			"author":      article.Author,
			"coverImage":  article.CoverImage,
			"contentLink": article.ContentLink,
			"excerpt":     article.Excerpt,
			"tags":        tags,
			"isPaid":      article.IsPaid,
			"likes":       article.Likes,
			"views":       article.Views,
			"createdAt":   article.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, result)
}

func GetArticle(c *gin.Context) {
	id := c.Param("id")
	var article models.Article

	if err := config.DB.First(&article, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}

	var tags []string
	if article.Tags != "" {
		json.Unmarshal([]byte(article.Tags), &tags)
	}

	result := map[string]interface{}{
		"id":          article.ID,
		"title":       article.Title,
		"author":      article.Author,
		"coverImage":  article.CoverImage,
		"content":     article.Content,
		"contentLink": article.ContentLink,
		"excerpt":     article.Excerpt,
		"tags":        tags,
		"isPaid":      article.IsPaid,
		"likes":       article.Likes,
		"views":       article.Views,
		"createdAt":   article.CreatedAt,
	}

	c.JSON(http.StatusOK, result)
}

func CreateArticle(c *gin.Context) {
	var input struct {
		Title       string   `json:"title" binding:"required"`
		Author      string   `json:"author" binding:"required"`
		CoverImage  string   `json:"coverImage"`
		Content     string   `json:"content"`
		ContentLink string   `json:"contentLink"`
		Excerpt     string   `json:"excerpt"`
		Tags        []string `json:"tags"`
		IsPaid      bool     `json:"isPaid"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userId")
	tagsJSON, _ := json.Marshal(input.Tags)
	article := models.Article{
		Title:       input.Title,
		Author:      input.Author,
		AuthorID:    userID.(uint),
		CoverImage:  input.CoverImage,
		Content:     input.Content,
		ContentLink: input.ContentLink,
		Excerpt:     input.Excerpt,
		Tags:        string(tagsJSON),
		IsPaid:      input.IsPaid,
	}

	if err := config.DB.Create(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	config.DB.Model(&models.User{}).Where("id = ?", userID).Update("published_count", config.DB.Raw("published_count + 1"))

	config.RedisClient.Del(config.Ctx, "articles:list")
	c.JSON(http.StatusCreated, article)
}

func UpdateArticle(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userId")
	
	var article models.Article
	if err := config.DB.First(&article, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}
	
	if article.AuthorID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own articles"})
		return
	}

	var input struct {
		Title       string   `json:"title"`
		Author      string   `json:"author"`
		CoverImage  string   `json:"coverImage"`
		Content     string   `json:"content"`
		ContentLink string   `json:"contentLink"`
		Excerpt     string   `json:"excerpt"`
		Tags        []string `json:"tags"`
		IsPaid      bool     `json:"isPaid"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tagsJSON, _ := json.Marshal(input.Tags)
	updates := map[string]interface{}{
		"title":        input.Title,
		"author":       input.Author,
		"cover_image":  input.CoverImage,
		"content":      input.Content,
		"content_link": input.ContentLink,
		"excerpt":      input.Excerpt,
		"tags":         string(tagsJSON),
		"is_paid":      input.IsPaid,
		"updated_at":   time.Now(),
	}

	config.DB.Model(&article).Updates(updates)
	config.RedisClient.Del(config.Ctx, "articles:list", "article:"+id)
	c.JSON(http.StatusOK, article)
}

func DeleteArticle(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userId")
	
	var article models.Article
	if err := config.DB.First(&article, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}
	
	if article.AuthorID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own articles"})
		return
	}
	
	if err := config.DB.Delete(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	config.RedisClient.Del(config.Ctx, "articles:list", "article:"+id)
	c.JSON(http.StatusOK, gin.H{"message": "Article deleted"})
}

func LikeArticle(c *gin.Context) {
	id := c.Param("id")
	var article models.Article

	if err := config.DB.First(&article, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}

	if err := config.DB.Model(&article).Update("likes", article.Likes+1).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update likes"})
		return
	}

	config.DB.Model(&models.User{}).Where("id = ?", article.AuthorID).Update("total_liked", config.DB.Raw("total_liked + 1"))

	config.DB.First(&article, id)
	c.JSON(http.StatusOK, gin.H{"likes": article.Likes})
}

func ViewArticle(c *gin.Context) {
	id := c.Param("id")
	var article models.Article

	if err := config.DB.First(&article, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}

	if err := config.DB.Model(&article).Update("views", article.Views+1).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update views"})
		return
	}

	config.DB.Model(&models.User{}).Where("id = ?", article.AuthorID).Update("total_viewed", config.DB.Raw("total_viewed + 1"))

	config.DB.First(&article, id)
	c.JSON(http.StatusOK, gin.H{"views": article.Views})
}

func GetHomepageArticles(c *gin.Context) {
	var configs []models.HomepageConfig
	if err := config.DB.Order("position ASC").Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(configs) == 0 {
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}

	var articleIDs []uint
	for _, cfg := range configs {
		articleIDs = append(articleIDs, cfg.ArticleID)
	}

	var articles []models.Article
	if err := config.DB.Where("id IN ?", articleIDs).Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	articleMap := make(map[uint]models.Article)
	for _, article := range articles {
		articleMap[article.ID] = article
	}

	result := make([]map[string]interface{}, 0)
	for _, cfg := range configs {
		if article, ok := articleMap[cfg.ArticleID]; ok {
			var tags []string
			if article.Tags != "" {
				json.Unmarshal([]byte(article.Tags), &tags)
			}
			result = append(result, map[string]interface{}{
				"id":          article.ID,
				"title":       article.Title,
				"author":      article.Author,
				"coverImage":  article.CoverImage,
				"contentLink": article.ContentLink,
				"excerpt":     article.Excerpt,
				"tags":        tags,
				"isPaid":      article.IsPaid,
				"likes":       article.Likes,
				"views":       article.Views,
				"createdAt":   article.CreatedAt,
			})
		}
	}

	c.JSON(http.StatusOK, result)
}

func GetArticleContent(c *gin.Context) {
	level1 := c.Param("level1")
	level2 := c.Param("level2")
	level3 := c.Param("level3")

	resp, err := http.Get("https://cdn.jsdelivr.net/gh/168WenFangjun/zhix-articles@main/articles/articles.json")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch articles.json"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var articles map[string]interface{}
	if err := json.Unmarshal(body, &articles); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse articles.json"})
		return
	}

	if l1, ok := articles[level1].(map[string]interface{}); ok {
		if l2, ok := l1[level2].(map[string]interface{}); ok {
			if path, ok := l2[level3].(string); ok {
				fullURL := "https://cdn.jsdelivr.net/gh/168WenFangjun/zhix-articles@main/articles" + path
				c.JSON(http.StatusOK, gin.H{"contentLink": fullURL})
				return
			}
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
}
