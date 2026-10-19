import { Router, Request, Response, NextFunction } from "express";
import prisma from "./prisma";
import upload from "./upload";

const router = Router();

// Middleware para encapsular respostas de erro padrão
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==========================================
// MÓDULO: SEED / AUXILIAR
// ==========================================

// Rota para resetar/popular banco com dados de teste iniciais
router.post(
  "/seed",
  asyncHandler(async (req: Request, res: Response) => {
    // Limpar banco
    await prisma.maintenance.deleteMany();
    await prisma.rental.deleteMany();
    await prisma.equipment.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Criar categorias
    const catBetoneira = await prisma.category.create({ data: { name: "Betoneiras" } });
    const catFerramentas = await prisma.category.create({ data: { name: "Ferramentas Elétricas" } });
    const catAndaimes = await prisma.category.create({ data: { name: "Acesso e Andaimes" } });
    const catGeradores = await prisma.category.create({ data: { name: "Geradores e Compressores" } });

    // Criar cliente de teste
    const client1 = await prisma.user.create({
      data: {
        name: "José da Silva",
        email: "jose@construtorasilva.com",
        password: "senha123_criptografada",
        role: "CLIENT",
        points: 50,
      },
    });

    // Criar admin de teste
    await prisma.user.create({
      data: {
        name: "Administrador LocInsight",
        email: "admin@locinsight.com",
        password: "admin_password",
        role: "ADMIN",
        points: 0,
      },
    });

    // Criar equipamentos iniciais
    const eq1 = await prisma.equipment.create({
      data: {
        name: "Betoneira 400 Litros Monofásica",
        description: "Betoneira robusta para mistura de concreto na obra. Motor elétrico 2CV.",
        categoryId: catBetoneira.id,
        status: "DISPONIVEL",
        serialNumber: "BET-400-001",
        quantity: 3,
        manualUrl: "/uploads/manual-sample.pdf",
        imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400",
      },
    });

    const eq2 = await prisma.equipment.create({
      data: {
        name: "Martelo Demolidor SDS Max 10kg",
        description: "Ideal para rompimento de pisos, concreto, vigas e colunas com alta potência.",
        categoryId: catFerramentas.id,
        status: "DISPONIVEL",
        serialNumber: "MAR-010-002",
        quantity: 2,
        manualUrl: "/uploads/manual-sample.pdf",
        imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400",
      },
    });

    const eq3 = await prisma.equipment.create({
      data: {
        name: "Gerador de Energia 3000W Gasolina",
        description: "Gerador de energia portátil monofásico ideal para iluminação e ferramentas leves.",
        categoryId: catGeradores.id,
        status: "MANUTENCAO",
        serialNumber: "GER-3000-003",
        quantity: 1,
        manualUrl: "/uploads/manual-sample.pdf",
        imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=400",
      },
    });

    const eq4 = await prisma.equipment.create({
      data: {
        name: "Painel de Andaime Metálico 1.5m",
        description: "Painéis metálicos modulares para montagem de andaimes seguros na construção civil.",
        categoryId: catAndaimes.id,
        status: "ALUGADO",
        serialNumber: "AND-150-004",
        quantity: 4,
        manualUrl: "/uploads/manual-sample.pdf",
        imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=400",
      },
    });

    // Criar locação ativa de teste
    await prisma.rental.create({
      data: {
        equipmentId: eq4.id,
        userId: client1.id,
        startDate: new Date(),
        expectedReturn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        status: "ACTIVE",
      },
    });

    // Criar manutenção pendente de teste
    await prisma.maintenance.create({
      data: {
        equipmentId: eq3.id,
        type: "PREVENTIVA",
        cost: 150.0,
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        description: "Troca de óleo e limpeza de velas.",
      },
    });

    res.json({
      success: true,
      message: "Banco de dados resetado e semeado com sucesso!",
    });
  })
);

// ==========================================
// MÓDULO: CATEGORIAS
// ==========================================

// Listar categorias
router.get(
  "/categories",
  asyncHandler(async (req: Request, res: Response) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: categories });
  })
);

// Criar categoria
router.post(
  "/categories",
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: "NAME_REQUIRED", message: "Nome da categoria é obrigatório." },
      });
    }

    // Regra: Nome único
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: "CATEGORY_EXISTS", message: "Esta categoria já está cadastrada." },
      });
    }

    const category = await prisma.category.create({ data: { name } });
    res.status(201).json({ success: true, data: category });
  })
);

// ==========================================
// MÓDULO: EQUIPAMENTOS
// ==========================================

// Listar Equipamentos (Com filtros e busca)
router.get(
  "/equipments",
  asyncHandler(async (req: Request, res: Response) => {
    const { search, categoryId, status, public: isPublic } = req.query;

    const where: any = {};

    // Filtro de busca por nome/descrição/serial
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { description: { contains: String(search) } },
        { serialNumber: { contains: String(search) } },
      ];
    }

    // Filtro por categoria
    if (categoryId) {
      where.categoryId = String(categoryId);
    }

    // Filtro por status
    if (status) {
      where.status = String(status);
    }

    // RN01: Equipamentos em manutenção não aparecem no catálogo público
    if (isPublic === "true") {
      where.status = { not: "MANUTENCAO" };
    }

    const equipments = await prisma.equipment.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: equipments });
  })
);

// Obter equipamento por ID
router.get(
  "/equipments/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string; // Corrigido TS2322 com Type Casting explícito
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        category: true,
        maintenances: { orderBy: { startDate: "desc" } },
        rentals: { include: { user: true }, orderBy: { startDate: "desc" } },
      },
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: { code: "EQUIPMENT_NOT_FOUND", message: "Equipamento não encontrado." },
      });
    }

    res.json({ success: true, data: equipment });
  })
);

// Criar equipamento (Com upload de foto e manual PDF)
router.post(
  "/equipments",
  upload.fields([
    { name: "manual", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const { name, description, categoryId, serialNumber, quantity } = req.body;

    // Obter caminhos dos arquivos caso tenham sido enviados
    const manualFile = files?.["manual"]?.[0];
    const imageFile = files?.["image"]?.[0];

    const manualUrl = manualFile ? `/uploads/${manualFile.filename}` : req.body.manualUrl;
    const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : req.body.imageUrl;

    // RN05: Manual PDF deve ser obrigatório no cadastro
    if (!manualUrl) {
      return res.status(400).json({
        success: false,
        error: { code: "MANUAL_REQUIRED", message: "O manual técnico PDF é obrigatório para cadastrar o equipamento." },
      });
    }

    if (!name || !categoryId || !serialNumber) {
      return res.status(400).json({
        success: false,
        error: { code: "REQUIRED_FIELDS", message: "Os campos nome, categoria e número de série são obrigatórios." },
      });
    }

    // Validar serial único
    const existing = await prisma.equipment.findUnique({ where: { serialNumber } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: "SERIAL_EXISTS", message: "Já existe um equipamento com este número de série." },
      });
    }

    const equipment = await prisma.equipment.create({
      data: {
        name,
        description,
        categoryId,
        serialNumber,
        quantity: quantity ? parseInt(String(quantity), 10) : 1,
        manualUrl,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=400", // Fallback
        status: "DISPONIVEL",
      },
    });

    res.status(201).json({ success: true, data: equipment });
  })
);

// Atualizar equipamento
router.put(
  "/equipments/:id",
  upload.fields([
    { name: "manual", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string; // Corrigido TS2322 com Type Casting explícito
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const { name, description, categoryId, serialNumber, status, quantity } = req.body;

    const existingEq = await prisma.equipment.findUnique({ where: { id } });
    if (!existingEq) {
      return res.status(404).json({
        success: false,
        error: { code: "EQUIPMENT_NOT_FOUND", message: "Equipamento não encontrado." },
      });
    }

    // Arquivos novos se enviados
    const manualFile = files?.["manual"]?.[0];
    const imageFile = files?.["image"]?.[0];

    const manualUrl = manualFile ? `/uploads/${manualFile.filename}` : req.body.manualUrl || existingEq.manualUrl;
    const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : req.body.imageUrl || existingEq.imageUrl;

    // Validar serial único se estiver sendo modificado
    if (serialNumber && serialNumber !== existingEq.serialNumber) {
      const serialCheck = await prisma.equipment.findUnique({ where: { serialNumber } });
      if (serialCheck) {
        return res.status(400).json({
          success: false,
          error: { code: "SERIAL_EXISTS", message: "Já existe outro equipamento com este número de série." },
        });
      }
    }

    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        name: name || existingEq.name,
        description: description !== undefined ? description : existingEq.description,
        categoryId: categoryId || existingEq.categoryId,
        serialNumber: serialNumber || existingEq.serialNumber,
        status: status || existingEq.status,
        quantity: quantity !== undefined ? parseInt(String(quantity), 10) : existingEq.quantity,
        manualUrl,
        imageUrl,
      },
    });

    res.json({ success: true, data: equipment });
  })
);

// Excluir equipamento
router.delete(
  "/equipments/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string; // Corrigido TS2322 com Type Casting explícito

    const existingEq = await prisma.equipment.findUnique({ where: { id } });
    if (!existingEq) {
      return res.status(404).json({
        success: false,
        error: { code: "EQUIPMENT_NOT_FOUND", message: "Equipamento não encontrado." },
      });
    }

    // Excluir registros relacionados encadeados
    await prisma.maintenance.deleteMany({ where: { equipmentId: id } });
    await prisma.rental.deleteMany({ where: { equipmentId: id } });
    await prisma.equipment.delete({ where: { id } });

    res.json({ success: true, message: "Equipamento deletado com sucesso!" });
  })
);

// ==========================================
// MÓDULO: LOCAÇÕES (RENTALS)
// ==========================================

// Listar todas as locações
router.get(
  "/rentals",
  asyncHandler(async (req: Request, res: Response) => {
    const rentals = await prisma.rental.findMany({
      include: {
        equipment: { include: { category: true } },
        user: true,
      },
      orderBy: { startDate: "desc" },
    });
    res.json({ success: true, data: rentals });
  })
);

// Criar nova locação (Valida RN02)
router.post(
  "/rentals",
  asyncHandler(async (req: Request, res: Response) => {
    const { equipmentId, expectedReturn, clientName, clientEmail, clientPhone } = req.body;

    if (!equipmentId || !expectedReturn || !clientEmail || !clientName) {
      return res.status(400).json({
        success: false,
        error: {
          code: "REQUIRED_FIELDS",
          message: "Campos obrigatórios: ID do equipamento, data esperada de devolução, nome e email do cliente.",
        },
      });
    }

    // Buscar equipamento
    const equipment = await prisma.equipment.findUnique({ where: { id: String(equipmentId) } });
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: { code: "EQUIPMENT_NOT_FOUND", message: "Equipamento não encontrado." },
      });
    }

    // RN02: Não pode alugar equipamento indisponível (alugado ou em manutenção)
    if (equipment.status !== "DISPONIVEL") {
      return res.status(400).json({
        success: false,
        error: {
          code: "EQUIPMENT_UNAVAILABLE",
          message: `Este equipamento está indisponível para aluguel. Status atual: ${equipment.status}`,
        },
      });
    }

    // Encontrar ou cadastrar cliente
    let user = await prisma.user.findUnique({ where: { email: clientEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: clientName,
          email: clientEmail,
          password: "password_auto_generated", // Mock password
          role: "CLIENT",
          points: 0,
        },
      });
    }

    // Criar locação e atualizar status do equipamento para ALUGADO
    const rental = await prisma.rental.create({
      data: {
        equipmentId: String(equipmentId),
        userId: user.id,
        expectedReturn: new Date(expectedReturn),
        status: "ACTIVE",
      },
    });

    const activeRentalsCount = await prisma.rental.count({
      where: { equipmentId: String(equipmentId), status: "ACTIVE" }
    });

    if (activeRentalsCount >= equipment.quantity) {
      await prisma.equipment.update({
        where: { id: String(equipmentId) },
        data: { status: "ALUGADO" },
      });
    }

    res.status(201).json({ success: true, data: rental });
  })
);

// Devolução com checklist (RN03 e RN04)
router.post(
  "/rentals/:id/return",
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string; // Corrigido TS2322 com Type Casting explícito
    const { conditionOnReturn } = req.body; // BOM ou DANIFICADO

    // RN03: Checklist de devolução é obrigatório antes da mudança de status para “Disponível”
    if (!conditionOnReturn || (conditionOnReturn !== "BOM" && conditionOnReturn !== "DANIFICADO")) {
      return res.status(400).json({
        success: false,
        error: {
          code: "CHECKLIST_REQUIRED",
          message: "Checklist de devolução obrigatório. Escolha entre 'BOM' ou 'DANIFICADO'.",
        },
      });
    }

    // Buscar locação ativa
    const rental = await prisma.rental.findUnique({
      where: { id },
      include: { equipment: true, user: true },
    });

    if (!rental || rental.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        error: { code: "RENTAL_NOT_ACTIVE", message: "Esta locação não existe ou já foi finalizada." },
      });
    }

    let pointsEarned = 0;
    let nextStatus: "DISPONIVEL" | "MANUTENCAO" = "DISPONIVEL";

    // RN04: Motor de bonificação - Pontos só são gerados para devoluções sem avarias
    if (conditionOnReturn === "BOM") {
      pointsEarned = 10; // Atribui 10 pontos
      nextStatus = "DISPONIVEL";

      // Adicionar pontos ao cliente
      await prisma.user.update({
        where: { id: rental.userId },
        data: { points: { increment: pointsEarned } },
      });
    } else {
      // Se estiver danificado, o equipamento entra diretamente em MANUTENCAO
      nextStatus = "MANUTENCAO";

      // Criar registro automático de manutenção
      await prisma.maintenance.create({
        data: {
          equipmentId: rental.equipmentId,
          type: "CORRETIVA",
          cost: 0.0, // A ser calculado após conserto
          description: "Manutenção corretiva aberta automaticamente após devolução reportada como DANIFICADO.",
          startDate: new Date(),
        },
      });
    }

    // Finalizar locação
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        status: "FINISHED",
        actualReturn: new Date(),
        conditionOnReturn,
        pointsEarned,
      },
    });

    // Atualizar status do equipamento
    await prisma.equipment.update({
      where: { id: rental.equipmentId },
      data: { status: nextStatus },
    });

    res.json({
      success: true,
      data: {
        rental: updatedRental,
        pointsEarned,
        nextEquipmentStatus: nextStatus,
      },
    });
  })
);

// Resgate de Descontos (PB14)
router.post(
  "/clients/:id/redeem",
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string; // Corrigido TS2322 com Type Casting explícito
    const { pointsToRedeem } = req.body; // Quantos pontos resgatar

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_POINTS", message: "Insira uma quantidade de pontos válida maior que zero." },
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "CLIENT_NOT_FOUND", message: "Cliente não encontrado." },
      });
    }

    // RN: pontos não podem ser negativos
    if (user.points < pointsToRedeem) {
      return res.status(400).json({
        success: false,
        error: { code: "INSUFFICIENT_POINTS", message: "Saldo de pontos insuficiente para realizar este resgate." },
      });
    }

    // Desconto de 1 real para cada 5 pontos (por exemplo)
    const discountAmount = pointsToRedeem * 0.2; // R$0,20 por ponto, 50 pontos = R$10

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { points: { decrement: pointsToRedeem } },
    });

    res.json({
      success: true,
      data: {
        pointsRedeemed: pointsToRedeem,
        discountValue: discountAmount,
        remainingPoints: updatedUser.points,
      },
    });
  })
);

// ==========================================
// MÓDULO: MANUTENÇÕES
// ==========================================

// Listar todas as manutenções
router.get(
  "/maintenances",
  asyncHandler(async (req: Request, res: Response) => {
    const GrandpaMaintenances = await prisma.maintenance.findMany({
      include: { equipment: true },
      orderBy: { startDate: "desc" },
    });
    res.json({ success: true, data: GrandpaMaintenances });
  })
);

// Registrar manutenção (Só pode criar se equipamento estiver disponível)
router.post(
  "/maintenances",
  asyncHandler(async (req: Request, res: Response) => {
    const { equipmentId, type, cost, description, partsReplaced } = req.body;

    if (!equipmentId || !type || cost === undefined || !description) {
      return res.status(400).json({
        success: false,
        error: {
          code: "REQUIRED_FIELDS",
          message: "Campos obrigatórios: ID do equipamento, tipo, custo e descrição.",
        },
      });
    }

    const equipment = await prisma.equipment.findUnique({ where: { id: String(equipmentId) } });
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: { code: "EQUIPMENT_NOT_FOUND", message: "Equipamento não encontrado." },
      });
    }

    // Regra: Só pode enviar para manutenção se o equipamento estiver disponível
    if (equipment.status !== "DISPONIVEL") {
      return res.status(400).json({
        success: false,
        error: {
          code: "EQUIPMENT_NOT_AVAILABLE",
          message: `Só é possível abrir manutenção para equipamentos que estão 'DISPONIVEL'. Status atual: ${equipment.status}`,
        },
      });
    }

    // Criar registro de manutenção e atualizar status do equipamento para MANUTENCAO
    const maintenance = await prisma.maintenance.create({
      data: {
        equipmentId: String(equipmentId),
        type,
        cost: Number(cost),
        description,
        partsReplaced,
        startDate: new Date(),
      },
    });

    await prisma.equipment.update({
      where: { id: String(equipmentId) },
      data: { status: "MANUTENCAO" },
    });

    res.status(201).json({ success: true, data: maintenance });
  })
);

// Concluir manutenção
router.post(
  "/maintenances/:id/finish",
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string; // Corrigido TS2322 com Type Casting explícito
    const { cost, partsReplaced } = req.body;

    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: { equipment: true },
    });

    if (!maintenance || maintenance.endDate) {
      return res.status(400).json({
        success: false,
        error: { code: "MAINTENANCE_NOT_ACTIVE", message: "Manutenção não encontrada ou já finalizada." },
      });
    }

    // Finalizar manutenção e alterar status do equipamento para DISPONIVEL
    const updatedMaintenance = await prisma.maintenance.update({
      where: { id },
      data: {
        endDate: new Date(),
        cost: cost !== undefined ? Number(cost) : maintenance.cost,
        partsReplaced: partsReplaced || maintenance.partsReplaced,
      },
    });

    await prisma.equipment.update({
      where: { id: maintenance.equipmentId },
      data: { status: "DISPONIVEL" },
    });

    res.json({ success: true, data: updatedMaintenance });
  })
);

// ==========================================
// MÓDULO: CLIENTES / USERS
// ==========================================

// Listar clientes
router.get(
  "/clients",
  asyncHandler(async (req: Request, res: Response) => {
    const clients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: clients });
  })
);

// Detalhes do cliente (com pontos e histórico de locações)
router.get(
  "/clients/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string; // Corrigido TS2322 com Type Casting explícito
    const client = await prisma.user.findUnique({
      where: { id },
      include: {
        rentals: {
          include: { equipment: true },
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: "CLIENT_NOT_FOUND", message: "Cliente não encontrado." },
      });
    }

    res.json({ success: true, data: client });
  })
);

// Listar todos os usuários (Admin e Client)
router.get(
  "/users",
  asyncHandler(async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
    });
    // Omitir senhas por segurança
    const usersWithoutPassword = users.map(({ password, ...u }) => u);
    res.json({ success: true, data: usersWithoutPassword });
  })
);

// Cadastrar novo usuário (Admin ou Client)
router.post(
  "/users",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: { code: "FIELDS_REQUIRED", message: "Todos os campos (nome, e-mail, senha e função) são obrigatórios." },
      });
    }

    if (role !== "ADMIN" && role !== "CLIENT") {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_ROLE", message: "A função deve ser ADMIN ou CLIENT." },
      });
    }

    // Validar e-mail único
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: "EMAIL_EXISTS", message: "Já existe um usuário cadastrado com este e-mail." },
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
        points: 0,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ success: true, data: userWithoutPassword });
  })
);

// Rota de login
router.post(
  "/auth/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: "FIELDS_REQUIRED", message: "E-mail e senha são obrigatórios." },
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "E-mail ou senha incorretos." },
      });
    }

    // Remover senha antes de retornar
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  })
);

// Rota de Erro Genérica para Express
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Erro interno:", err);

  // Tratar erros do multer
  if (err.message && (err.message.includes("FORMAT_INVALID") || err.message.includes("LIMIT_FILE_SIZE"))) {
    return res.status(400).json({
      success: false,
      error: {
        code: "FILE_UPLOAD_ERROR",
        message: err.message,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: err.message || "Ocorreu um erro interno no servidor.",
    },
  });
});

export default router;