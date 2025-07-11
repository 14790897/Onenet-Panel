# OneNET IoT Hub

基于Next.js构建的OneNET物联网数据收集和管理平台，支持完整的OneNET推送服务功能。

## ✨ 功能特性

- 🌐 **完整的OneNET推送服务支持**
  - URL验证 (GET请求)
  - 数据推送接收 (POST请求)
  - 签名验证和安全校验
  - AES加密消息解密

- 🔐 **安全功能**
  - MD5+Base64签名验证
  - AES-128-CBC解密支持
  - Token身份验证
  - 重复消息过滤

- 📊 **数据处理**
  - 自动数据库存储
  - 多种消息类型处理
  - 错误处理和重试机制
  - 实时日志记录

- 🧪 **测试工具**
  - URL验证测试
  - OneNET推送格式测试
  - 兼容性测试
  - 可视化测试界面

## 🚀 快速开始

### 1. 克隆项目

\`\`\`bash
git clone <repository-url>
cd onenet-web
\`\`\`

### 2. 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 3. 环境配置

复制环境变量示例文件：

\`\`\`bash
cp .env.example .env.local
\`\`\`

编辑 `.env.local` 文件：

\`\`\`env
# OneNET推送服务配置
ONENET_TOKEN=your_onenet_token_here
ONENET_AES_KEY=your_16_char_key

# 数据库配置
DATABASE_URL=your_database_url_here
\`\`\`

### 4. 启动开发服务器

\`\`\`bash
pnpm dev
\`\`\`

访问 http://localhost:3000 查看应用。

## 📖 OneNET推送服务配置

### 1. 在OneNET平台配置HTTP推送

1. 登录OneNET管理控制台
2. 进入「数据流转」→「数据推送」
3. 配置HTTP推送参数：
   - **推送地址**: `https://your-domain.com/api/onenet/webhook`
   - **Token**: 设置一个安全的token值
   - **消息加密方式**: 选择明文或安全模式

### 2. URL验证

OneNET会自动发送GET请求验证URL：

\`\`\`
GET /api/onenet/webhook?msg=xxx&nonce=xxx&signature=xxx
\`\`\`

我们的服务会：
- 验证签名（可选）
- 原样返回msg参数
- 通过OneNET验证

### 3. 数据推送

OneNET发送POST请求推送数据：

\`\`\`json
{
    "msg": "消息内容",
    "signature": "加密签名", 
    "nonce": "随机字符串",
    "time": 1725962719211,
    "id": "消息ID"
}
\`\`\`

我们的服务会：
- 验证签名
- 解密消息（如果启用）
- 过滤重复消息
- 存储到数据库
- 快速返回HTTP 200

## 🔧 API端点

### URL验证 (GET)

\`\`\`
GET /api/onenet/webhook?msg=xxx&nonce=xxx&signature=xxx
\`\`\`

**功能**: OneNET平台URL验证  
**返回**: 原样返回msg参数值

### 数据推送 (POST)

\`\`\`
POST /api/onenet/webhook
Content-Type: application/json

{
    "msg": "消息内容",
    "signature": "签名",
    "nonce": "随机串",
    "time": 时间戳,
    "id": "消息ID"
}
\`\`\`

**功能**: 接收OneNET推送的数据  
**返回**: HTTP 200 OK

## 🧪 测试功能

访问 `/test-webhook` 页面进行测试：

### 1. URL验证测试
模拟OneNET的URL验证请求，测试GET端点功能。

### 2. OneNET推送测试
使用标准OneNET推送格式测试POST端点功能。

### 3. 兼容性测试
测试对旧版本数据格式的兼容性。

## 🔐 安全配置

### 签名验证

OneNET使用以下方法生成签名：

1. 拼接字符串: `token + nonce + msg`
2. MD5加密
3. Base64编码

我们的服务会验证此签名确保数据来源合法。

### AES加密解密

如果启用安全模式，OneNET会使用AES-128-CBC加密消息：

- **算法**: AES-128-CBC
- **填充**: PKCS7
- **密钥长度**: 16字节
- **IV**: 使用密钥作为初始向量

## 📊 数据库架构

\`\`\`sql
CREATE TABLE onenet_data (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    datastream_id VARCHAR(255) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## 🔄 重试机制

我们的服务设计为快速响应OneNET请求：

- 立即返回HTTP 200状态码
- 异步处理数据解析和存储
- 避免OneNET重试机制触发
- 记录详细日志便于调试

## 📝 日志记录

系统会记录以下信息：

- URL验证请求和响应
- 数据推送接收情况
- 签名验证结果
- 消息解析状态
- 数据库操作结果
- 错误和异常信息

## 🚦 监控建议

建议监控以下指标：

- 请求成功率
- 响应时间
- 数据库写入速度
- 错误率
- 重复消息数量

## 🔧 故障排除

### 常见问题

1. **URL验证失败**
   - 检查服务器是否正常运行
   - 确认URL可以公网访问
   - 查看服务器日志

2. **签名验证失败**
   - 检查ONENET_TOKEN配置
   - 确认token与OneNET平台一致
   - 查看签名计算日志

3. **数据接收异常**
   - 检查数据库连接
   - 确认数据格式正确
   - 查看错误日志

## 📞 支持

如有问题请查看：

- 项目文档
- OneNET官方文档
- 系统日志文件
- GitHub Issues

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 LICENSE 文件。
