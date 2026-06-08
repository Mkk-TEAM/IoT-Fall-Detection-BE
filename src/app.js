import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { handleSuccessResponse } from "./helpers/handleResponse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

if (env.trustProxy) app.set("trust proxy", 1);

app.use(morgan(env.isProduction ? "combined" : "dev"));
app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/media", express.static(path.join(__dirname, "..", "media")));

app.get("/health", (req, res) => {
  res.status(200).json(handleSuccessResponse({ uptime: process.uptime(), timestamp: new Date().toISOString() }, "System OK"));
});

export default app;
