package result

import (
	"context"
	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/trace"
	"net/http"
)

const (
	// CodeOk 请求成功业务状态码
	CodeOk = 0
	// MsgOk 请求成功消息
	MsgOk = "OK"

	LANG_ZH = 1
	LANG_EN = 2

	// ErrorCode 默认业务状态码 1开头
	ErrorCode = 100000
	// InvalidParameter 参数错误状态码 1001xx
	InvalidParameter = 100100

	// SystemError 系统级别错误状态码 2开头
	SystemError = 200000
	// DBError 数据库层面报错 2001xx
	DBError        = 200100
	DBCreateFailed = 200101
	DBUpdateFailed = 200102
	DBDeleteFailed = 200103
	DBQueryFailed  = 200104
	DBNotExist     = 200105
	// RedisError 数据库层面报错 2002xx
	RedisError = 200200
	// MQError 消息队列报错 2003xx
	MQError = 200300
	// EthereumError 以太坊客户端报错 2004xx
	EthereumError = 200400
)

// ErrMsgMap 业务错误
var ErrMsgMap = map[int]map[int]string{
	ErrorCode: {
		LANG_ZH: "服务器繁忙，请稍后重试",
		LANG_EN: "Network error, please try again later",
	},
	InvalidParameter: {
		LANG_ZH: "参数错误，请检查",
		LANG_EN: "Invalid parameters",
	},
	SystemError: {
		LANG_ZH: "服务器内部错误，请稍后重试",
		LANG_EN: "Internal server error, please try again later",
	},
	DBError: {
		LANG_ZH: "数据库错误",
		LANG_EN: "Database error",
	},
	DBCreateFailed: {
		LANG_ZH: "创建失败",
		LANG_EN: "Create failed",
	},
	DBUpdateFailed: {
		LANG_ZH: "更新失败",
		LANG_EN: "UpdateById failed",
	},
	DBQueryFailed: {
		LANG_ZH: "查询失败",
		LANG_EN: "Query failed",
	},
	DBDeleteFailed: {
		LANG_ZH: "删除失败",
		LANG_EN: "DeleteById failed",
	},
	DBNotExist: {
		LANG_ZH: "数据不存在",
		LANG_EN: "Not exist",
	},
	EthereumError: {
		LANG_ZH: "ETH客户端错误",
		LANG_EN: "ETH client error",
	},
}

type Response struct {
	TraceId string      `json:"trace_id" example:"a1b2c3d4e5f6g7h8"`       // 链路追踪id
	Code    int         `json:"code" example:"0" extensions:"x-order=001"` // 状态码
	Msg     string      `json:"msg" example:"OK" extensions:"x-order=002"` // 消息
	Data    interface{} `json:"data" extensions:"x-order=003"`             // 数据
}

func OK(c *gin.Context, v interface{}) {
	c.JSON(http.StatusOK, &Response{
		TraceId: GetTraceId(c.Request.Context()),
		Code:    CodeOk,
		Msg:     MsgOk,
		Data:    v,
	})
}

func Error(c *gin.Context, errorCode int) {
	msg := getErrorMsg(errorCode, GetLang(c))
	c.JSON(http.StatusOK, &Response{
		TraceId: GetTraceId(c.Request.Context()),
		Code:    errorCode,
		Msg:     msg,
		Data:    nil,
	})
}

func SysError(c *gin.Context, message string) {
	msg := message
	if message == "" {
		msg = ErrMsgMap[SystemError][GetLang(c)]
	}
	c.JSON(http.StatusOK, &Response{
		TraceId: GetTraceId(c.Request.Context()),
		Code:    SystemError,
		Msg:     msg,
		Data:    nil,
	})
}

func ErrorData(c *gin.Context, errorCode int, data interface{}) {
	msg := getErrorMsg(errorCode, GetLang(c))
	c.JSON(http.StatusOK, &Response{
		TraceId: GetTraceId(c.Request.Context()),
		Code:    errorCode,
		Msg:     msg,
		Data:    data,
	})
}

// GetTraceId 获取链路追踪id 预留，暂未启用
func GetTraceId(ctx context.Context) string {
	spanCtx := trace.SpanContextFromContext(ctx)
	if spanCtx.HasTraceID() {
		return spanCtx.TraceID().String()
	}

	return ""
}

func GetLang(c *gin.Context) int {
	var lang = LANG_EN
	if value, exists := c.Get("lang"); exists {
		lang = value.(int)
	}
	return lang
}

func getErrorMsg(errorCode int, lang int) string {
	if msgMap, ok := ErrMsgMap[errorCode]; ok {
		if msg, exists := msgMap[lang]; exists {
			return msg
		}
	}
	return ErrMsgMap[ErrorCode][LANG_ZH]
}
