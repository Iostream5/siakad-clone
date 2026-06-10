import "../db/load-env";
import postgres from "postgres";
import fs from "fs";
import path from "path";

import { getPostgresSslOption } from "../db/postgres-options";

async function seed() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ Error: DATABASE_URL is not set in .env file");
    process.exit(1);
  }

  const sql = postgres(connectionString, {
    ssl: getPostgresSslOption(connectionString),
    prepare: false,
    connect_timeout: 30,
  });

  try {
    const seedFile = path.join(process.cwd(), "seed.sql");
    
    if (!fs.existsSync(seedFile)) {
      console.warn("⚠️ Warning: seed.sql not found. Skipping seeding.");
      return;
    }

    console.log("🌱 Seeding database...");
    const content = fs.readFileSync(seedFile, "utf8");
    
    await sql.unsafe(content);
    
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seed();
