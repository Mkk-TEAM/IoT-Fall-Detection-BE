import express from "express";
import cors from "cors";
import morgan from "morgan";
import { handleSuccessResponse } from "./helpers/handleResponse.js";

const app = express();

const allowedOrigin = process.env.CORS_ORIGIN || "*";

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors({
  origin: allowedOrigin === "*" ? true : allowedOrigin.split(",").map((origin) => origin.trim()),
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => res
  .status(200)
  .json(handleSuccessResponse(200, "System OK", {
    service: "iot-fall-detection-backend",
    timestamp: new Date().toISOString(),
  })));

export default app;
