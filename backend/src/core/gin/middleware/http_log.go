package middleware

import (
	"bytes"
	"github.com/gin-gonic/gin"
	"github.com/mumu/cryptoSwap/src/core/log"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"io"
	"io/ioutil"
	"strings"
	"time"
)

type BodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w BodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}
func (w BodyLogWriter) WriteString(s string) (int, error) {
	w.body.WriteString(s)
	return w.ResponseWriter.WriteString(s)
}

func HttpLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取原始请求路径和查询参数(避免被其他中间件修改)
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		// 读取并保存请求体
		var buf bytes.Buffer
		tee := io.TeeReader(c.Request.Body, &buf)
		requestBody, _ := ioutil.ReadAll(tee)
		c.Request.Body = ioutil.NopCloser(&buf)
		bodyLogWriter := &BodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = bodyLogWriter

		// 记录开始时间
		start := time.Now()

		// 调用下一个处理器
		c.Next()

		if strings.Contains(path, "/swagger") {
			// 过滤swagger日志
			return
		}

		// 获取响应体
		responseBody := bodyLogWriter.body.Bytes()
		if len(c.Errors) > 0 {
			// 如果有错误,记录错误信息
			for _, e := range c.Errors.Errors() {
				log.Logger.Error(e)
			}
		} else {
			// 计算处理时间
			latency := float64(time.Now().Sub(start).Nanoseconds() / 1000000.0)
			// 记录请求和响应的详细信息
			fields := []zapcore.Field{
				zap.Int("status", c.Writer.Status()),
				zap.String("method", c.Request.Method),
				zap.String("function", c.HandlerName()),
				zap.String("path", path),
				zap.String("query", query),
				zap.String("ip", c.ClientIP()),
				zap.String("user-agent", c.Request.UserAgent()),
				zap.String("token", c.Request.Header.Get("session_id")),
				zap.String("content-type", c.Request.Header.Get("Content-Type")),
				zap.Float64("latency", latency),
				zap.String("request", string(requestBody)),
				zap.String("response", string(responseBody)),
			}
			log.Logger.Info("Go-End", fields...)
		}
	}
}
