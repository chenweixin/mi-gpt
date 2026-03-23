import config from "./.migpt.js";
import { MiGPT, APIServer } from "./dist/index.cjs";

async function main() {
  const client = MiGPT.create(config);

  // 先启动 HTTP API 服务器（在 client.start() 之前）
  const apiServer = new APIServer({
    port: process.env.API_PORT || 3000,
    client,
  });
  apiServer.start();

  // 最后启动 MiGPT（这会阻塞在消息监听循环中）
  await client.start();
}

main();
