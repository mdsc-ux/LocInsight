import { Router } from "express";

const router = Router();

router.get("/teste", (req, res) => {
  res.json({
    mensagem: "Rotas do Loc Insight funcionando!"
  });
});

export default router;