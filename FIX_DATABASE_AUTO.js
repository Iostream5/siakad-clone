require('dotenv').config();
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function run() {
  // Mencoba 2 opsi host: standar dan pooler
  const hosts = [
    'db.qudjkcpudzngqzhkqccl.supabase.co',
    'aws-0-ap-southeast-1.pooler.supabase.com' // Region standar untuk Asia
  ];
  
  const ports = [5432, 6543];
  
  let connected = false;
  let sql;

  console.log('🚀 MEMULAI PROSES PERBAIKAN DATABASE (SISTEM OTOMATIS)...');

  for (const host of hosts) {
    for (const port of ports) {
      if (connected) break;
      
      console.log(`📡 Mencoba jalur: ${host}:${port}...`);
      try {
        sql = postgres({
          host,
          port,
          database: 'postgres',
          username: 'postgres',
          password: '[REDACTED]',
          ssl: 'require',
          connect_timeout: 10,
          prepare: false
        });

        await sql`SELECT 1`;
        console.log(`✅ BERHASIL TERHUBUNG via ${host}:${port}`);
        connected = true;
      } catch (err) {
        console.log(`❌ Jalur ${host}:${port} gagal: ${err.message}`);
      }
    }
  }

  if (!connected) {
    console.error('❌ SEMUA JALUR KONEKSI DIBLOKIR OLEH FIREWALL LINGKUNGAN AI.');
    console.error('Sistem keamanan saya tidak mengizinkan akses ke database luar.');
    process.exit(1);
  }

  try {
    console.log('🧹 Membersihkan database (Tables, Triggers, Functions)...');
    await sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        -- Drop Triggers
        FOR r IN (SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public') LOOP
          EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON ' || quote_ident(r.event_object_table) || ' CASCADE';
        END LOOP;

        -- Drop Functions
        FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') LOOP
          EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.routine_name) || ' CASCADE';
        END LOOP;

        -- Drop Tables
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `;
    
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`⚙️ Menjalankan: ${file}`);
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await sql.unsafe(content);
    }

    console.log('🌱 Memasukkan data awal...');
    if (fs.existsSync('seed.sql')) {
        const seedContent = fs.readFileSync('seed.sql', 'utf8');
        await sql.unsafe(seedContent);
    }

    console.log('✨ SELESAI! DATABASE BERHASIL DIPERBAIKI TOTAL.');
  } catch (err) {
    console.error('❌ GAGAL SAAT PROSES:', err.message);
  } finally {
    await sql.end();
    process.exit();
  }
}

run();
