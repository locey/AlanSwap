# 第一阶段：构建阶段
FROM golang:1.23-alpine AS builder

WORKDIR /app

# 配置国内 Go 代理和校验和数据库
ENV GOPROXY=https://goproxy.cn,direct
ENV GOSUMDB=sum.golang.google.cn

# 复制依赖文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建API服务，使用优化参数
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o api-service ./src/cmd/api-service

# 第二阶段：运行阶段
FROM alpine:3.18

# 安装必要的运行时依赖
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# 从构建阶段复制二进制文件
COPY --from=builder /app/api-service .

# 暴露端口
EXPOSE 8100

# 运行API服务
CMD ["./api-service"]