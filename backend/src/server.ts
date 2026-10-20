import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { criarRotas } from "./routes";
import { prisma } from "./lib/prisma";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const uploadsDir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const uploadsDir = path.resolve(
  process.env.UPLOAD_DIR ||
    path.join(process.cwd(), "uploads")
);

app.use(
  "/uploads",
  express.static(uploadsDir)
);

app.use("/api", criarRotas(prisma));
app.get("/", (_req, res) => res.json({ mensagem: "API Loc Insight funcionando!" }));
app.get("/health", (_req, res) => res.json({ status: "ok", service: "LocInsight API" }));
app.listen(PORT, () => console.log(`Loc Insight API na porta ${PORT}`));
