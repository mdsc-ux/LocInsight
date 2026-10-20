
import "dotenv/config";
import { defineConfig } from "prisma/config";

const postgresUrl = process.env.DATABASE_URL;

if (!postgresUrl) {
  throw new Error("DATABASE_URL não configurada");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: postgresUrl,
  },
});
