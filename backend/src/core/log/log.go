package log

import (
	"github.com/mumu/cryptoSwap/src/common"
	"github.com/mumu/cryptoSwap/src/core/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

var Logger *zap.Logger

func InitLog() *zap.Logger {

	//zap 不支持文件归档，如果要支持文件按大小或者时间归档，需要使用lumberjack，lumberjack也是zap官方推荐的。
	// https://github.com/uber-go/zap/blob/master/FAQ.md
	hook := lumberjack.Logger{
		Filename:   common.GetCurrentAbPath() + "/logs/" + config.Conf.App.Name + ".log", // 日志文件路径
		MaxSize:    50,                                                                   // 每个日志文件保存的最大尺寸 单位：M
		MaxBackups: 20,                                                                   // 日志文件最多保存多少个备份
		MaxAge:     7,                                                                    // 文件最多保存多少天
		Compress:   true,                                                                 // 是否压缩
	}

	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "line",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,  // 小写编码器
		EncodeTime:     customTimeEncoder,              // ISO8601 UTC 时间格式
		EncodeDuration: zapcore.SecondsDurationEncoder, //
		EncodeCaller:   shortCallerEncoder,             // 相对路径编码器
		EncodeName:     zapcore.FullNameEncoder,
	}

	// 设置日志级别
	atomicLevel := zap.NewAtomicLevel()
	atomicLevel.SetLevel(zap.InfoLevel)

	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),                                           // 编码器配置
		zapcore.NewMultiWriteSyncer(zapcore.AddSync(os.Stdout), zapcore.AddSync(&hook)), // 打印到控制台和文件
		atomicLevel, // 日志级别
	)

	// 开启开发模式，堆栈跟踪
	caller := zap.AddCaller()
	// 开启文件及行号
	development := zap.Development()
	// 设置初始化字段
	filed := zap.Fields(zap.String("service", config.Conf.App.Name))
	// 构造日志
	Logger = zap.New(core, caller, development, filed)

	return Logger
}

// 自定义时间格式
func customTimeEncoder(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
	enc.AppendString(t.Format("2006-01-02 15:04:05.000"))
}

// 精简line路径
func shortCallerEncoder(caller zapcore.EntryCaller, enc zapcore.PrimitiveArrayEncoder) {
	root := common.GetCurrentAbPath() // 获取项目根目录
	path := caller.File
	if rel, err := filepath.Rel(root, path); err == nil {
		enc.AppendString(rel + ":" + strconv.Itoa(caller.Line))
	} else {
		enc.AppendString(path + ":" + strconv.Itoa(caller.Line))
	}
}
