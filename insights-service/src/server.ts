import app from "./app";
import { env } from "./config/env";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  // Keep log lines explicit for container logs
  console.log(`[insights-service] listening on :${env.PORT}`);
});

server.on("error", (error: Error) => {
  console.error("[insights-service] server error", error);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("[insights-service] SIGTERM received, shutting down...");
  server.close(() => {
    console.log("[insights-service] closed");
    process.exit(0);
  });
});
