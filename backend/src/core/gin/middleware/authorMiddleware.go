package middleware

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/mumu/cryptoSwap/src/core/config"
	"github.com/mumu/cryptoSwap/src/core/result"
)

var JwtSecret = []byte(config.Conf.App.JwtSecret)

// AuthorMiddleware
//
//	@Description: 用于身份验证的中间件，在需要使用的接口上使用
//	@return gin.HandlerFunc
func AuthorMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取请求头中的 Authorization 字段
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			result.Error(c, result.InvalidParameter)
			//c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing Authorization header"})
			c.Abort()
			return
		}
		// 格式应为 "Bearer <token>"
		tokenString := authHeader[len("Bearer "):]
		if tokenString == "" {
			result.Error(c, result.InvalidParameter)
			//c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的令牌格式"})
			c.Abort()
			return
		}
		//需要解析令牌
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("无效的签名方法")
			}
			return JwtSecret, nil
		})
		if err != nil {
			result.Error(c, result.InvalidParameter)
			//c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的令牌"})
			//退出
			c.Abort()
			return
		}
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			//验证成功，将用户ID添加到上下文中
			//将用户id转为int类型再存储
			c.Set("userId", claims["userId"])
			c.Next()
		} else {
			result.Error(c, result.InvalidParameter)
			//c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的令牌"})
			c.Abort()
			return
		}
	}
}
