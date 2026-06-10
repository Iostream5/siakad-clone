require('dotenv').config();
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL tidak ada di .env');
    return;
  }

  console.log('🚀 MEMULAI PERBAIKAN DATABASE (via .env URL)...');
  const sql = postgres(connectionString, { ssl: 'require', prepare: false });

  try {
    console.log('📡 Menghubungkan ke Supabase...');
    await sql`SELECT 1`;
    console.log('✅ Terhubung!');

    console.log('🧹 Membersihkan skema public...');
    await sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `;
    
    console.log('⚙️ Menjalankan ulang seluruh migrasi...');
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`👉 ${file}`);
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await sql.unsafe(content);
    }

    console.log('🌱 Memasukkan data awal (Seed)...');
    if (fs.existsSync('seed.sql')) {
        const seedContent = fs.readFileSync('seed.sql', 'utf8');
        await sql.unsafe(seedContent);
    }

    console.log('✨ DATABASE BERHASIL DIPERBAIKI TOTAL!');
  } catch (err) {
    console.error('❌ GAGAL:', err.message);
  } finally {
    await sql.end();
    process.exit();
  }
}

run();
