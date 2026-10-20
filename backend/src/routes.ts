
import { Router } from "express";
import type { PrismaClient } from "@prisma/client";

export function criarRotas(prisma: PrismaClient) {
  const router = Router();

  router.get("/teste", (req, res) => {
    res.json({
      success: true,
      data: { mensagem: "API Loc Insight funcionando!" }
    });
  });

  router.get("/categories", async (req, res) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" }
      });

      res.json({ success: true, data: categories });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { message: "Erro ao buscar categorias" }
      });
    }
  });

  
router.post("/categories", async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "Informe o nome da categoria" }
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim()
      }
    });

    return res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: { message: "Erro ao cadastrar categoria" }
    });
  }
});


  router.get("/equipments", async (req, res) => {
    try {
      const { search, categoryId, status } = req.query;

      const equipments = await prisma.equipment.findMany({
        where: {
          ...(typeof search === "string" && search
            ? { name: { contains: search, mode: "insensitive" as const } }
            : {}),
          ...(typeof categoryId === "string" && categoryId
            ? { categoryId }
            : {}),
          ...(status === "DISPONIVEL" ||
               status === "ALUGADO" ||
               status === "MANUTENCAO"
            ? { status }
            : {})
        },
        include: { category: true },
        orderBy: { createdAt: "desc" }
      });

      res.json({ success: true, data: equipments });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { message: "Erro ao buscar equipamentos" }
      });
    }
  });

  router.get("/equipments/:id", async (req, res) => {
    try {
      const equipment = await prisma.equipment.findUnique({
        where: { id: String(req.params.id) },
        include: { category: true }
      });

      if (!equipment) {
        return res.status(404).json({
          success: false,
          error: { message: "Equipamento não encontrado" }
        });
      }

      return res.json({ success: true, data: equipment });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        error: { message: "Erro ao buscar equipamento" }
      });
    }
  });

  return router;
}
