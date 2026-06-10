import "../db/load-env";
import postgres from "postgres";
import fs from "fs";
import path from "path";

import { getPostgresSslOption } from "../db/postgres-options";

async function migrate() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ Error: DATABASE_URL tidak ditemukan di file .env");
    process.exit(1);
  }

  console.log("📡 Mencoba menghubungkan ke database...");

  const sql = postgres(connectionString, {
    ssl: getPostgresSslOption(connectionString),
    prepare: false,
    connect_timeout: 30,
  });

  try {
    // Cek koneksi
    await sql`SELECT 1`;
    console.log("✅ Berhasil terhubung ke Supabase!");

    await sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const migrationsDir = path.join(process.cwd(), "migrations");
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

    for (const file of files) {
      const alreadyRun = await sql`SELECT name FROM _migrations WHERE name = ${file}`;

      if (alreadyRun.length === 0) {
        console.log(`🚀 Menjalankan migrasi: ${file}`);
        const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");
        
        await sql.begin(async sql => {
          await sql.unsafe(content);
          await sql`INSERT INTO _migrations (name) VALUES (${file})`;
        });
        
        console.log(`✅ Selesai: ${file}`);
      } else {
        console.log(`⏩ Lewati: ${file}`);
      }
    }

    console.log("🎊 Seluruh migrasi database berhasil diterapkan!");
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat migrasi:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
