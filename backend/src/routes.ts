
import { Router, Request, Response } from "express";
import type { PrismaClient, EquipmentStatus } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads")
);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(
      null,
      `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`
    )
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf";

    if (!ok) {
      return cb(new Error("Somente imagens e PDF são permitidos"));
    }

    cb(null, true);
  }
});

const fileFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "manual", maxCount: 1 },
  { name: "imageFile", maxCount: 1 },
  { name: "manualFile", maxCount: 1 }
]);

const success = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

const fail = (res: Response, message: string, status = 400) =>
  res.status(status).json({
    success: false,
    error: { message }
  });

const str = (v: unknown) =>
  typeof v === "string" ? v.trim() : "";

const validStatus = (v: unknown): v is EquipmentStatus =>
  v === "DISPONIVEL" ||
  v === "ALUGADO" ||
  v === "MANUTENCAO";

const numberValue = (v: unknown) =>
  v === undefined || v === null || v === ""
    ? undefined
    : Number(v);

const validDate = (v: unknown) => {
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
};

const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

const checkPassword = (password: string, stored: string) => {
  if (!stored.startsWith("scrypt:")) return false;

  const [, salt, hash] = stored.split(":");

  if (!salt || !hash || hash.length !== 128) return false;

  const actual = crypto.scryptSync(password, salt, 64);

  return crypto.timingSafeEqual(
    actual,
    Buffer.from(hash, "hex")
  );
};

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  points: true,
  createdAt: true
} as const;

const wrap =
  (handler: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (e: any) {
      console.error(e);

      if (e?.code === "P2002")
        return fail(
          res,
          "Registro duplicado (nome, email ou número de série)",
          409
        );

      if (e?.code === "P2003")
        return fail(
          res,
          "Registro relacionado não encontrado",
          400
        );

      if (e?.code === "P2025")
        return fail(res, "Registro não encontrado", 404);

      return fail(res, "Erro interno do servidor", 500);
    }
  };

export function criarRotas(prisma: PrismaClient) {
  const router = Router();

  router.get("/teste", (_req, res) =>
    success(res, {
      mensagem: "API Loc Insight funcionando!"
    })
  );

  // LOGIN

  router.post(
    "/auth/login",
    wrap(async (req, res) => {
      const email = str(req.body?.email).toLowerCase();
      const password = str(req.body?.password);

      if (!email || !password)
        return fail(res, "Email e senha são obrigatórios");

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !checkPassword(password, user.password))
        return fail(res, "Email ou senha inválidos", 401);

      const { password: _hidden, ...safe } = user;

      return success(res, safe);
    })
  );

  // DADOS DE DEMONSTRAÇÃO

  router.post(
    "/seed",
    wrap(async (_req, res) => {
      if (process.env.ENABLE_DEMO_SEED !== "true")
        return fail(res, "Seed desabilitado", 403);

      const names = [
        "Ferramentas",
        "Construção",
        "Jardinagem",
        "Limpeza"
      ];

      for (const name of names) {
        await prisma.category.upsert({
          where: { name },
          create: { name },
          update: {}
        });
      }

      const email = str(process.env.ADMIN_EMAIL).toLowerCase();
      const password = str(process.env.ADMIN_PASSWORD);

      if (email && password) {
        if (password.length < 8)
          return fail(
            res,
            "ADMIN_PASSWORD precisa ter ao menos 8 caracteres"
          );

        await prisma.user.upsert({
          where: { email },
          create: {
            name: "Administrador",
            email,
            password: hashPassword(password),
            role: "ADMIN"
          },
          update: {
            role: "ADMIN",
            password: hashPassword(password)
          }
        });
      }

      return success(res, {
        message: "Dados de demonstração criados",
        adminCreated: Boolean(email && password)
      });
    })
  );

  // CATEGORIAS

  router.get(
    "/categories",
    wrap(async (_req, res) =>
      success(
        res,
        await prisma.category.findMany({
          orderBy: { name: "asc" }
        })
      )
    )
  );

  router.post(
    "/categories",
    wrap(async (req, res) => {
      const name = str(req.body?.name);

      if (!name)
        return fail(res, "Informe o nome da categoria");

      return success(
        res,
        await prisma.category.create({
          data: { name }
        }),
        201
      );
    })
  );

  // EQUIPAMENTOS

  router.get(
    "/equipments",
    wrap(async (req, res) => {
      const {
        search,
        categoryId,
        status,
        public: publicOnly
      } = req.query;

      const items = await prisma.equipment.findMany({
        where: {
          ...(str(search)
            ? {
                OR: [
                  {
                    name: {
                      contains: str(search),
                      mode: "insensitive" as const
                    }
                  },
                  {
                    serialNumber: {
                      contains: str(search),
                      mode: "insensitive" as const
                    }
                  }
                ]
              }
            : {}),

          ...(str(categoryId)
            ? { categoryId: str(categoryId) }
            : {}),

          ...(validStatus(status) ? { status } : {}),

          ...(publicOnly === "true" && !validStatus(status)
            ? { status: "DISPONIVEL" as EquipmentStatus }
            : {})
        },
        include: { category: true },
        orderBy: { createdAt: "desc" }
      });

      return success(res, items);
    })
  );

  router.get(
    "/equipments/:id",
    wrap(async (req, res) => {
      const item = await prisma.equipment.findUnique({
        where: { id: String(req.params.id) },
        include: { category: true }
      });

      return item
        ? success(res, item)
        : fail(res, "Equipamento não encontrado", 404);
    })
  );

  const saveEquipment = (update: boolean) =>
    wrap(async (req, res) => {
      const b = req.body || {};

      const files = (req.files || {}) as Record<
        string,
        Express.Multer.File[]
      >;

      const image =
        files.image?.[0] || files.imageFile?.[0];

      const manual =
        files.manual?.[0] || files.manualFile?.[0];

      if (image && !image.mimetype.startsWith("image/"))
        return fail(res, "Imagem inválida");

      if (manual && manual.mimetype !== "application/pdf")
        return fail(res, "Manual deve ser PDF");

      const quantity = numberValue(b.quantity);

      if (
        quantity !== undefined &&
        (!Number.isInteger(quantity) || quantity < 1)
      )
        return fail(
          res,
          "Quantidade deve ser um inteiro positivo"
        );

      if (b.status !== undefined && !validStatus(b.status))
        return fail(res, "Status inválido");

      const data = {
        ...(b.name !== undefined
          ? { name: str(b.name) }
          : {}),

        ...(b.description !== undefined
          ? { description: str(b.description) || null }
          : {}),

        ...(b.categoryId !== undefined
          ? { categoryId: str(b.categoryId) }
          : {}),

        ...(b.serialNumber !== undefined
          ? { serialNumber: str(b.serialNumber) }
          : {}),

        ...(quantity !== undefined ? { quantity } : {}),

        ...(b.status !== undefined
          ? { status: b.status as EquipmentStatus }
          : {}),

        ...(b.imageUrl !== undefined
          ? { imageUrl: str(b.imageUrl) || null }
          : {}),

        ...(b.manualUrl !== undefined
          ? { manualUrl: str(b.manualUrl) || null }
          : {}),

        ...(image
          ? { imageUrl: `/uploads/${image.filename}` }
          : {}),

        ...(manual
          ? { manualUrl: `/uploads/${manual.filename}` }
          : {})
      };

      if (
        !update &&
        (!data.name || !data.categoryId || !data.serialNumber)
      )
        return fail(
          res,
          "Nome, categoria e número de série são obrigatórios"
        );

      if (update) {
        const item = await prisma.equipment.update({
          where: { id: String(req.params.id) },
          data,
          include: { category: true }
        });

        return success(res, item);
      }

      const item = await prisma.equipment.create({
        data: data as any,
        include: { category: true }
      });

      return success(res, item, 201);
    });

  router.post(
    "/equipments",
    fileFields,
    saveEquipment(false)
  );

  router.put(
    "/equipments/:id",
    fileFields,
    saveEquipment(true)
  );

  router.delete(
    "/equipments/:id",
    wrap(async (req, res) => {
      const id = String(req.params.id);

      const [rentals, maintenances] = await Promise.all([
        prisma.rental.count({
          where: { equipmentId: id }
        }),
        prisma.maintenance.count({
          where: { equipmentId: id }
        })
      ]);

      if (rentals || maintenances)
        return fail(
          res,
          "Equipamento possui histórico e não pode ser excluído",
          409
        );

      await prisma.equipment.delete({
        where: { id }
      });

      return success(res, {
        message: "Equipamento excluído"
      });
    })
  );

  // USUÁRIOS

  router.get(
    "/users",
    wrap(async (_req, res) =>
      success(
        res,
        await prisma.user.findMany({
          select: publicUser,
          orderBy: { createdAt: "desc" }
        })
      )
    )
  );

  router.post(
    "/users",
    wrap(async (req, res) => {
      const name = str(req.body?.name);
      const email = str(req.body?.email).toLowerCase();
      const password = str(req.body?.password);

      if (
        !name ||
        !email ||
        !password ||
        password.length < 8
      )
        return fail(
          res,
          "Nome, email e senha (mínimo 8 caracteres) são obrigatórios"
        );

      const role =
        req.body?.role === "ADMIN" ? "ADMIN" : "CLIENT";

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashPassword(password),
          role
        },
        select: publicUser
      });

      return success(res, user, 201);
    })
  );

  // CLIENTES

  router.get(
    "/clients",
    wrap(async (_req, res) =>
      success(
        res,
        await prisma.user.findMany({
          where: { role: "CLIENT" },
          select: {
            ...publicUser,
            rentals: {
              include: { equipment: true },
              orderBy: { startDate: "desc" }
            }
          },
          orderBy: { name: "asc" }
        })
      )
    )
  );

  router.get(
    "/clients/:id",
    wrap(async (req, res) => {
      const user = await prisma.user.findUnique({
        where: { id: String(req.params.id) },
        select: {
          ...publicUser,
          rentals: {
            include: { equipment: true },
            orderBy: { startDate: "desc" }
          }
        }
      });

      return user
        ? success(res, user)
        : fail(res, "Cliente não encontrado", 404);
    })
  );

  router.post(
    "/clients/:id/redeem",
    wrap(async (req, res) => {
      const points = numberValue(req.body?.points) ?? 10;

      if (!Number.isInteger(points) || points <= 0)
        return fail(res, "Pontos inválidos");

      const result = await prisma.user.updateMany({
        where: {
          id: String(req.params.id),
          role: "CLIENT",
          points: { gte: points }
        },
        data: {
          points: { decrement: points }
        }
      });

      if (!result.count)
        return fail(
          res,
          "Cliente inexistente ou saldo insuficiente",
          400
        );

      return success(
        res,
        await prisma.user.findUnique({
          where: { id: String(req.params.id) },
          select: publicUser
        })
      );
    })
  );

  // ALUGUÉIS

  router.get(
    "/rentals",
    wrap(async (_req, res) =>
      success(
        res,
        await prisma.rental.findMany({
          include: {
            user: { select: publicUser },
            equipment: {
              include: { category: true }
            }
          },
          orderBy: { startDate: "desc" }
        })
      )
    )
  );

  router.post(
    "/rentals",
    wrap(async (req, res) => {
      const equipmentId = str(req.body?.equipmentId);
      const clientName = str(req.body?.clientName);
      const clientEmail = str(
        req.body?.clientEmail
      ).toLowerCase();

      const expectedReturn = validDate(
        req.body?.expectedReturn
      );

      if (
        !equipmentId ||
        !clientName ||
        !clientEmail ||
        !expectedReturn ||
        expectedReturn <= new Date()
      )
        return fail(
          res,
          "Informe equipamento, cliente e data futura de devolução"
        );

      const rental = await prisma
        .$transaction(async (tx) => {
          const changed = await tx.equipment.updateMany({
            where: {
              id: equipmentId,
              status: "DISPONIVEL"
            },
            data: { status: "ALUGADO" }
          });

          if (!changed.count)
            throw new Error("EQUIPMENT_UNAVAILABLE");

          let user = await tx.user.findUnique({
            where: { email: clientEmail }
          });

          if (!user) {
            user = await tx.user.create({
              data: {
                name: clientName,
                email: clientEmail,
                password: hashPassword(
                  crypto.randomBytes(24).toString("hex")
                ),
                role: "CLIENT"
              }
            });
          }

          return tx.rental.create({
            data: {
              equipmentId,
              userId: user.id,
              expectedReturn
            },
            include: {
              user: { select: publicUser },
              equipment: true
            }
          });
        })
        .catch((e) => {
          if (e.message === "EQUIPMENT_UNAVAILABLE")
            return null;

          throw e;
        });

      return rental
        ? success(res, rental, 201)
        : fail(
            res,
            "Equipamento indisponível ou inexistente",
            409
          );
    })
  );

  router.post(
    "/rentals/:id/return",
    wrap(async (req, res) => {
      const condition = str(
        req.body?.conditionOnReturn
      );

      if (
        condition !== "BOM" &&
        condition !== "DANIFICADO"
      )
        return fail(
          res,
          "Condição deve ser BOM ou DANIFICADO"
        );

      const rental = await prisma.$transaction(
        async (tx) => {
          const changed = await tx.rental.updateMany({
            where: {
              id: String(req.params.id),
              status: "ACTIVE"
            },
            data: {
              status: "FINISHED",
              actualReturn: new Date(),
              conditionOnReturn: condition,
              pointsEarned:
                condition === "BOM" ? 10 : 0
            }
          });

          if (!changed.count) return null;

          const r = await tx.rental.findUniqueOrThrow({
            where: {
              id: String(req.params.id)
            }
          });

          await tx.equipment.update({
            where: { id: r.equipmentId },
            data: {
              status:
                condition === "BOM"
                  ? "DISPONIVEL"
                  : "MANUTENCAO"
            }
          });

          if (condition === "BOM") {
            await tx.user.update({
              where: { id: r.userId },
              data: {
                points: { increment: 10 }
              }
            });
          }

          return tx.rental.findUnique({
            where: { id: r.id },
            include: {
              user: { select: publicUser },
              equipment: true
            }
          });
        }
      );

      return rental
        ? success(res, rental)
        : fail(
            res,
            "Aluguel não encontrado ou já finalizado",
            409
          );
    })
  );

  // MANUTENÇÕES

  router.get(
    "/maintenances",
    wrap(async (_req, res) =>
      success(
        res,
        await prisma.maintenance.findMany({
          include: { equipment: true },
          orderBy: { createdAt: "desc" }
        })
      )
    )
  );

  router.post(
    "/maintenances",
    wrap(async (req, res) => {
      const equipmentId = str(
        req.body?.equipmentId
      );

      const type = str(req.body?.type);
      const description = str(
        req.body?.description
      );

      const cost =
        numberValue(req.body?.cost) ?? 0;

      if (
        !equipmentId ||
        !type ||
        !description ||
        !Number.isFinite(cost) ||
        cost < 0
      )
        return fail(
          res,
          "Dados da manutenção inválidos"
        );

      const startDate = req.body?.startDate
        ? validDate(req.body.startDate)
        : new Date();

      if (!startDate)
        return fail(res, "Data de início inválida");

      const item = await prisma.$transaction(
        async (tx) => {
          const changed =
            await tx.equipment.updateMany({
              where: {
                id: equipmentId,
                status: { not: "ALUGADO" }
              },
              data: {
                status: "MANUTENCAO"
              }
            });

          if (!changed.count) return null;

          return tx.maintenance.create({
            data: {
              equipmentId,
              type,
              description,
              cost,
              startDate,
              partsReplaced:
                str(req.body?.partsReplaced) || null
            },
            include: { equipment: true }
          });
        }
      );

      return item
        ? success(res, item, 201)
        : fail(
            res,
            "Equipamento inexistente ou alugado",
            409
          );
    })
  );

  router.post(
    "/maintenances/:id/finish",
    wrap(async (req, res) => {
      const item = await prisma.$transaction(
        async (tx) => {
          const changed =
            await tx.maintenance.updateMany({
              where: {
                id: String(req.params.id),
                endDate: null
              },
              data: {
                endDate: new Date()
              }
            });

          if (!changed.count) return null;

          const m =
            await tx.maintenance.findUniqueOrThrow({
              where: {
                id: String(req.params.id)
              }
            });

          const otherOpen =
            await tx.maintenance.count({
              where: {
                equipmentId: m.equipmentId,
                endDate: null
              }
            });

          if (!otherOpen) {
            await tx.equipment.update({
              where: {
                id: m.equipmentId
              },
              data: {
                status: "DISPONIVEL"
              }
            });
          }

          return tx.maintenance.findUnique({
            where: { id: m.id },
            include: {
              equipment: true
            }
          });
        }
      );

      return item
        ? success(res, item)
        : fail(
            res,
            "Manutenção inexistente ou já finalizada",
            409
          );
    })
  );

  router.use((_req, res) =>
    fail(res, "Rota da API não encontrada", 404)
  );

  return router;
}
