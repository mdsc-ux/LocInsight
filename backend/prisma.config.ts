import "dotenv/config";
import { defineConfig } from "prisma/config";

// Tenta pegar do .env, se falhar ou estiver vazio (por conta do OneDrive), coloca a sua string do Postgres
const postgresUrl = process.env.DATABASE_URL || "postgresql://postgres:suasenha@localhost:5432/locinsight?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: postgresUrl,
  },
});