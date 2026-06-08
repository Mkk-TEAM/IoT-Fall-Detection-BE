import "dotenv/config";
import app from "./src/app.js";
import loaders from "./src/loaders/index.js";
import { env } from "./src/config/env.js";
import { disconnectDB } from "./src/loaders/dbLoader.js";

async function startServer() {
  try {
    await loaders(app);

    const server = app.listen(env.port, () => {
      console.log(`🛡️  Server running at http://localhost:${env.port}`);
      console.log(`📚 Swagger UI: http://localhost:${env.port}/swagger/api`);
      console.log(`🔗 API base: http://localhost:${env.port}${env.apiPrefix}`);
    });

    async function shutdown(signal) {
      console.log(`\n${signal} received. Shutting down...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    }

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Cannot start server:", error);
    process.exit(1);
  }
}

startServer();
