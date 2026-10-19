import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import router from "./routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS
app.use(
  cors({
    origin: "*", // Em produção restringir para a origem do frontend
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend construído
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Servir arquivos estáticos (fotos de equipamentos e manuais PDF)
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

// Registrar rotas da API
app.use("/api", router);

// Rota de saúde básica
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "LocInsight API" });
});

// Rota fallback para SPA (carrega o frontend construído)
app.get("*all", (req, res, next) => {
  // Ignora chamadas para /api, /uploads ou /health que derem 404
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/health")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Servidor Loc Insight rodando em http://localhost:${PORT}`);
  console.log(`📂 Pasta de uploads exposta em http://localhost:${PORT}/uploads`);
  console.log(`====================================================`);
});

