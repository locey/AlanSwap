# AlanSwap Backend

基于Go语言的区块链DeFi项目后端服务，提供用户认证、空投奖励计算和区块链事件监听功能。

## 项目架构

### 技术栈
- **语言**: Go 1.23.10
- **Web框架**: Gin
- **数据库**: PostgreSQL + Redis
- **区块链**: 以太坊客户端 (go-ethereum)
- **认证**: JWT + 钱包签名验证
- **日志**: Zap
- **配置**: TOML
- **文档**: Swagger

### 项目结构
```
├── config/                 # 配置文件
│   └── config.toml        # 主配置文件
├── src/
│   ├── cmd/               # 启动入口
│   │   ├── api-service/   # API服务启动
│   │   └── indexer/       # 索引服务启动
│   ├── core/              # 核心组件
│   │   ├── config/        # 配置管理
│   │   ├── db/           # 数据库连接
│   │   ├── gin/          # Web框架配置
│   │   ├── log/          # 日志系统
│   │   ├── ctx/          # 上下文管理
│   │   └── chainclient/  # 区块链客户端
│   ├── app/              # 应用层
│   │   ├── api/          # API接口
│   │   ├── service/      # 业务服务
│   │   ├── model/        # 数据模型
│   │   └── sync/         # 同步服务
│   └── common/           # 公共工具
├── go.mod                # Go模块文件
└── README.md            # 项目说明
```

## 功能特性

### 1. 双服务架构
- **API服务** (端口8100): 提供RESTful API接口
- **索引服务** (端口8000): 监听区块链事件并同步数据

### 2. 核心功能
- 🔐 **钱包认证**: 支持以太坊钱包签名登录
- 📊 **空投计算**: 基于用户质押行为计算积分奖励
- 🔗 **区块链监听**: 实时监听Staked/Withdrawn事件
- 📈 **数据同步**: 自动同步用户操作记录到数据库

### 3. 支持的区块链
- Ethereum Mainnet
- Sepolia Testnet
- 可扩展支持更多链

## 快速开始

### 环境要求
- Go 1.23.10+
- PostgreSQL 12+
- Redis 6+
- 以太坊节点访问权限

### 1. 克隆项目
```bash
git clone <repository-url>
cd backend
```

### 2. 安装依赖
```bash
go mod download
```

### 3. 配置数据库
创建PostgreSQL数据库：
```sql
CREATE DATABASE crypto_swap;
```

### 4. 配置Redis
确保Redis服务运行在默认端口6379

### 5. 修改配置文件
编辑 `config/config.toml`：
```toml
[app]
name = "alanswap"
port = "8000"
apiPort = "8100"
version = "v1"
jwtSecret = "your-jwt-secret"
jwtTtl = 12

[pgsql]
host = "127.0.0.1"
port = "5432"
database = "crypto_swap"
username = "postgres"
password = "your-password"

[redis]
host = "localhost"
port = "6379"
db = 1
password = ""
max_idle = 10
max_active = 0
idle_timeout = 180
poolSize = 200

[[chains]]
name = "sepolia"
chain_id = 11155111
endpoint = "https://sepolia.infura.io/v3/your-api-key"

[[chains]]
name = "mainnet"
chain_id = 1
endpoint = "https://mainnet.infura.io/v3/your-api-key"
```

### 6. 启动服务

#### 启动API服务
```bash
go run src/cmd/api-service/main.go
```
服务将在端口8100启动，提供API接口

#### 启动索引服务
```bash
go run src/cmd/indexer/main.go
```
服务将在端口8000启动，开始监听区块链事件

### 7. 访问API文档
启动API服务后，访问：
```
http://localhost:8100/swagger/index.html
```

## API接口

### 认证接口
- `GET /api/v1/auth/nonce` - 获取随机数
- `POST /api/v1/auth/verify` - 验证钱包签名
- `POST /api/v1/auth/logout` - 用户登出

### 空投接口（需要认证）
- `GET /api/v1/airdrop/overview` - 获取空投奖励预览

## 开发指南

### 添加新的API接口

1. **创建API处理器** (`src/app/api/your_api.go`)
```go
package api

import (
    "github.com/gin-gonic/gin"
    "github.com/mumu/cryptoSwap/src/app/service"
)

type YourApi struct {
    svc *service.YourService
}

func NewYourApi() *YourApi {
    return &YourApi{
        svc: service.NewYourService(),
    }
}

func (y *YourApi) YourMethod(c *gin.Context) {
    // 实现业务逻辑
}
```

2. **创建业务服务** (`src/app/service/your_service.go`)
```go
package service

type YourService struct {
    // 依赖注入
}

func NewYourService() *YourService {
    return &YourService{}
}
```

3. **注册路由** (`src/core/gin/router/router.go`)
```go
// 在ApiBind函数中添加
yourApi := api.NewYourApi()
v.GET("/your/endpoint", yourApi.YourMethod)
```

### 数据库模型
项目使用GORM作为ORM，模型定义在 `src/app/model/` 目录下。

### 区块链事件监听
索引服务会自动监听以下事件：
- `Staked(address,uint256,address,uint256,uint256,uint256)` - 质押事件
- `Withdrawn(address,uint256,address,uint256,uint256)` - 提现事件

## 监控和调试

### 性能监控
项目集成了pprof性能监控，默认端口6060：
```
http://localhost:6060/debug/pprof/
```

### 日志系统
使用Zap结构化日志，支持不同级别：
- Info: 一般信息
- Error: 错误信息
- Debug: 调试信息

## 部署说明

### Docker部署（推荐）
```bash
# 构建镜像
docker build -t alanswap-backend .

# 运行API服务
docker run -d --name alanswap-api -p 8100:8100 alanswap-backend

# 运行索引服务
docker run -d --name alanswap-indexer -p 8000:8000 alanswap-backend
```

### 生产环境配置
1. 修改数据库连接配置
2. 配置Redis集群（如需要）
3. 设置JWT密钥
4. 配置区块链节点访问
5. 启用HTTPS（推荐）

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查PostgreSQL服务是否运行
   - 验证数据库连接配置

2. **Redis连接失败**
   - 检查Redis服务状态
   - 验证Redis配置

3. **区块链连接失败**
   - 检查网络连接
   - 验证Infura API密钥
   - 确认节点端点可访问

4. **JWT认证失败**
   - 检查JWT密钥配置
   - 验证token格式

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交Issue
- 发送邮件至项目维护者

---

**注意**: 请确保在生产环境中使用强密码和安全的JWT密钥，并定期更新依赖包以获取安全补丁。