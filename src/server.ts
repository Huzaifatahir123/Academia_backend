import "dotenv/config";
import { app } from "./app";
import { prisma } from "../src/db/prisma.ts";

async function testDatabase() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  }
}

testDatabase();
const PORT = Number(process.env.PORT) || 3000;

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API v1 Base URL: http://localhost:${PORT}/api/v1`);
  });

  // Graceful Shutdown Handler
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Closing HTTP server...`);
    server.close(() => {
      console.log("HTTP server closed cleanly.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer();