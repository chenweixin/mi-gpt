# MiGPT API 测试文档

## 概述

MiGPT 现在提供 HTTP API 接口，可以通过编程方式触发小爱音箱说话或调用 AI 回答，无需语音交互。

## 启动服务

### 开发模式（本地调试）

```bash
# 终端 1：监听源码变化自动编译
npx tsup --watch

# 终端 2：运行项目
pnpm dev
```

### 生产环境（服务器部署）

**推荐使用 PM2 管理进程：**

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start app.js --name mi-gpt --interpreter node --interpreter-args="--env-file=.env"

# 查看状态
pm2 status

# 查看日志
pm2 logs mi-gpt

# 设置开机自启
pm2 startup
pm2 save

# 其他常用命令
pm2 stop mi-gpt      # 停止服务
pm2 restart mi-gpt   # 重启服务
pm2 delete mi-gpt    # 删除服务
```

服务启动后，API 服务器默认运行在 `http://localhost:3000`

## API 端点

### 1. `/tts` - 直接让小爱音箱说话

让小爱音箱直接播报指定文本，不经过 AI 处理。

**请求方式：** `POST`

**请求参数：**
```json
{
  "text": "要播报的文本内容",
  "keepAlive": false  // 可选，是否保持唤醒状态
}
```

**响应示例：**
```json
{
  "success": true,
  "text": "你好，主人"
}
```

**测试命令：**
```bash
# 基础测试（如果系统配置了代理，需要清除代理环境变量）
http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/tts -H "Content-Type: application/json" -d '{"text": "你好，主人"}'

# 保持唤醒状态
http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/tts -H "Content-Type: application/json" -d '{"text": "我在听", "keepAlive": true}'
```

---

### 2. `/ask` - 触发 AI 回答

模拟用户向小爱音箱提问，触发 AI 生成回答并播报。

**请求方式：** `POST`

**请求参数：**
```json
{
  "text": "用户的问题"
}
```

**响应示例：**
```json
{
  "success": true,
  "text": "今天天气怎么样"
}
```

**测试命令：**
```bash
# 询问天气
http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/ask -H "Content-Type: application/json" -d '{"text": "今天天气怎么样"}'

# 闲聊对话
http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/ask -H "Content-Type: application/json" -d '{"text": "你好呀"}'

# 知识问答
http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/ask -H "Content-Type: application/json" -d '{"text": "什么是人工智能"}'
```

---

## 测试用例

### 场景 1：简单播报
```bash
http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "主人，该吃饭了"}'
```

### 场景 2：定时提醒
```bash
# 可以结合 cron 或其他定时任务工具
http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "现在是下午3点，该休息一下了"}'
```

### 场景 3：智能问答
```bash
http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"text": "帮我讲个笑话"}'
```

### 场景 4：家居控制反馈
```bash
# 配合智能家居系统，执行操作后播报结果
http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "客厅灯已关闭"}'
```

---

## 配置

### 自定义 API 端口

在 `.env` 文件中添加：
```bash
API_PORT=3000
```

---

## 错误处理

### 400 Bad Request
```json
{
  "error": "Missing text parameter"
}
```
**原因：** 请求缺少必需的 `text` 参数

### 404 Not Found
```json
{
  "error": "Not found"
}
```
**原因：** 请求的端点不存在

### 500 Internal Server Error
```json
{
  "error": "错误详细信息"
}
```
**原因：** 服务器内部错误，检查小爱音箱连接状态和配置

---

## 集成示例

### Node.js
```javascript
const axios = require('axios');

async function speakText(text) {
  try {
    const response = await axios.post('http://localhost:3000/tts', {
      text: text
    });
    console.log('播报成功:', response.data);
  } catch (error) {
    console.error('播报失败:', error.message);
  }
}

speakText('你好，主人');
```

### Python
```python
import requests

def speak_text(text):
    try:
        response = requests.post(
            'http://localhost:3000/tts',
            json={'text': text}
        )
        print('播报成功:', response.json())
    except Exception as e:
        print('播报失败:', str(e))

speak_text('你好，主人')
```

### Shell 脚本
```bash
#!/bin/bash

speak() {
  http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/tts \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"$1\"}"
}

# 使用
speak "你好，主人"
```

---

## 注意事项

1. 确保 MiGPT 服务已启动且小爱音箱已正确配置
2. API 服务器默认无认证，建议仅在本地网络使用
3. `/ask` 端点会消耗 AI API 配额，请合理使用
4. 如需远程访问，建议配置反向代理和认证机制

---

## 常见问题

**Q: curl 命令报错 "URL rejected: Malformed input"**

A: 使用单行命令，避免换行符问题：
```bash
http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/tts -H "Content-Type: application/json" -d '{"text": "你好"}'
```

**Q: curl 返回 "Empty reply from server" 或 502 Bad Gateway**

A: 系统配置了 HTTP 代理，导致 localhost 请求被代理拦截。解决方案：

方案 1 - 每次请求时清除代理（推荐）：
```bash
http_proxy="" https_proxy="" all_proxy="" curl -X POST http://localhost:3000/tts -H "Content-Type: application/json" -d '{"text": "你好"}'
```

方案 2 - 配置不代理 localhost（永久生效）：
```bash
# 在 ~/.zshrc 中添加
export no_proxy="localhost,127.0.0.1"

# 重新加载配置
source ~/.zshrc
```

**Q: 如何验证 API 服务器是否启动？**

A: 查看终端输出，应该看到：
```
🚀 API Server running at http://localhost:3000
   POST /tts  - 让小爱说话: {"text": "你好"}
   POST /ask  - 触发 AI 回答: {"text": "今天天气怎么样"}
```

**Q: 小爱音箱没有反应？**

A: 检查以下几点：
1. `.migpt.js` 配置是否正确（userId, password, did）
2. 小爱音箱是否在线
3. 查看终端日志是否有错误信息
