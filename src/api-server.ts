import { createServer, IncomingMessage, ServerResponse } from "http";
import { MiGPT } from "./index";

export interface APIServerConfig {
  port?: number;
  client: MiGPT;
}

export class APIServer {
  private server: ReturnType<typeof createServer>;
  private client: MiGPT;
  private port: number;

  constructor(config: APIServerConfig) {
    this.client = config.client;
    this.port = config.port || 3000;
    this.server = createServer(this.handleRequest.bind(this));
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    try {
      // 设置 CORS
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      await this.handleRoutes(req, res);
    } catch (error: any) {
      console.error("[API] Unhandled error:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message, stack: error.stack }));
      }
    }
  }

  private async handleRoutes(req: IncomingMessage, res: ServerResponse) {

    if (req.url === "/tts" && req.method === "POST") {
      try {
        const body = await this.parseBody(req);
        const { text, keepAlive = false } = JSON.parse(body);

        if (!text) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing text parameter" }));
          return;
        }

        console.log(`[API] 收到 TTS 请求: "${text}", keepAlive: ${keepAlive}`);
        const result = await this.client.speaker.response({ text, keepAlive });
        console.log(`[API] TTS 响应结果:`, result);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, text, result }));
      } catch (error: any) {
        console.error(`[API] TTS 错误:`, error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message, stack: error.stack }));
      }
    } else if (req.url === "/ask" && req.method === "POST") {
      try {
        const body = await this.parseBody(req);
        const { text } = JSON.parse(body);

        if (!text) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing text parameter" }));
          return;
        }

        // 模拟用户消息触发 AI 回答
        const msg = { text, timestamp: Date.now() };
        await this.client.ai.speaker.askAIForAnswer(msg);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, text }));
      } catch (error: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  }

  private handleError(error: Error) {
    console.error("[API] Server error:", error);
  }

  private parseBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => resolve(body));
      req.on("error", reject);
    });
  }

  start() {
    this.server.on("error", this.handleError.bind(this));
    this.server.listen(this.port, () => {
      console.log(`🚀 API Server running at http://localhost:${this.port}`);
      console.log(`   POST /tts  - 让小爱说话: {"text": "你好"}`);
      console.log(`   POST /ask  - 触发 AI 回答: {"text": "今天天气怎么样"}`);
    });
  }

  stop() {
    this.server.close();
  }
}
