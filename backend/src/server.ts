import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (fotos e manuais PDF)
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../../uploads"))
);

// Registrar rotas da API
app.use("/api", router);

// Rota principal
app.get("/", (req, res) => {
  res.json({
    mensagem: "API Loc Insight funcionando!",
  });
});

// Rota de saúde
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "LocInsight API",
  });
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log("====================================");
  console.log(`Servidor Loc Insight rodando na porta ${PORT}`);
  console.log(`Pasta de uploads disponível em /uploads`);
  console.log("====================================");
});