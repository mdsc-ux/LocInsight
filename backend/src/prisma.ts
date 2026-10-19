import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Carrega o .env na marra por conta do OneDrive
dotenv.config();

// Sua string de conexão real do PostgreSQL
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:suasenha@localhost:5432/locinsight?schema=public";

// Cria o pool de conexões nativo do Postgres do driver 'pg'
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Inicializa o Prisma Client passando o adapter obrigatório no Prisma 7
const prisma = new PrismaClient({
    adapter: adapter,
    log: ["query", "info", "warn", "error"],
});

export default prisma;