package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/mumu/cryptoSwap/src/core/result"
)

func LanguageMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从请求头/URL参数/cookie等获取语言标识
		lang := c.GetHeader("Accept-Language")
		if lang == "" {
			lang = c.Query("lang")
		}

		langCode := result.LANG_EN
		// 标准化语言代码 (如 en -> 0, zh -> 1)
		if lang == "zh-cn" {
			langCode = result.LANG_ZH
		}

		// 设置到上下文
		c.Set("lang", langCode)
		c.Next()
	}
}
