import "../db/load-env";
import postgres from "postgres";
import { execSync } from "child_process";

import { getPostgresSslOption } from "../db/postgres-options";

async function reset() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL is missing in .env");
    process.exit(1);
  }

  console.log("🔗 Connecting to Supabase...");
  
  const sql = postgres(connectionString, {
    ssl: getPostgresSslOption(connectionString),
    prepare: false, // Penting untuk Supabase/PgBouncer
    connect_timeout: 30,
  });

  try {
    console.log("🧨 STARTING RESET: Cleaning public schema...");
    
    // Test koneksi sederhana
    await sql`SELECT 1`;
    console.log("✅ Connection verified.");

    // Drop all tables
    await sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `;

    // Drop special tables
    await sql`DROP TABLE IF EXISTS _migrations CASCADE`;

    console.log("扫 DB Cleared. Now running migrations...");
    await sql.end(); // Tutup koneksi sebelum menjalankan proses eksternal

    // Jalankan migrasi & seed melalui command line
    execSync("npx tsx src/supabase/migrate.ts", { stdio: "inherit" });
    execSync("npx tsx src/supabase/seed.ts", { stdio: "inherit" });

    console.log("✨ ALL DONE! Database is fresh and seeded.");
  } catch (error) {
    console.error("❌ Reset process failed:");
    console.error(error);
    process.exit(1);
  }
}

reset();
