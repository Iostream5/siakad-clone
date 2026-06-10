import "../load-env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

import { getPostgresSslOption } from "../postgres-options";

type SeedRole =
  | "Admin"
  | "Prodi"
  | "Dosen"
  | "Mahasiswa"
  | "Calon Mahasiswa"
  | "Staff"
  | "Keuangan"
  | "Pimpinan"
  | "Bendahara";

type SeedAccount = {
  username: string;
  email: string;
  fullName: string;
  role: SeedRole;
  password: string;
};

const seedAccounts: SeedAccount[] = [
  { username: "admin", email: "admin@kampus.ac.id", fullName: "Admin SIAKAD", role: "Admin", password: "admin123" },
  { username: "prodi", email: "prodi@kampus.ac.id", fullName: "Ketua Prodi Informatika", role: "Prodi", password: "prodi123" },
  { username: "dosen", email: "dosen@kampus.ac.id", fullName: "Dr. Ahmad Fauzi", role: "Dosen", password: "dosen123" },
  { username: "mahasiswa", email: "mahasiswa@kampus.ac.id", fullName: "Nadia Putri", role: "Mahasiswa", password: "mhs12345" },
  { username: "staff", email: "staff@kampus.ac.id", fullName: "Staff Akademik", role: "Staff", password: "staff123" },
  { username: "keuangan", email: "keuangan@kampus.ac.id", fullName: "Biro Keuangan", role: "Keuangan", password: "keu12345" },
  { username: "pimpinan", email: "pimpinan@kampus.ac.id", fullName: "Wakil Rektor", role: "Pimpinan", password: "pimpinan123" },
  { username: "bendahara", email: "bendahara@kampus.ac.id", fullName: "Tim Bendahara", role: "Bendahara", password: "bendahara123" },
];

async function run() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("Error: DATABASE_URL tidak ditemukan.");
    process.exit(1);
  }

  const client = postgres(connectionString, {
    ssl: getPostgresSslOption(connectionString),
    prepare: false,
    connect_timeout: 30,
  });
  const db = drizzle(client);

  try {
    console.log("\nSeed account list:");
    console.table(seedAccounts.map(({ username, email, role, password }) => ({ username, email, role, password })));

    let upserted = 0;
    const missingAuthUsers: string[] = [];

    for (const account of seedAccounts) {
      const authResult = await db.execute<{ id: string }>(
        sql`select id from auth.users where email = ${account.email} limit 1`
      );
      const authUserId = authResult[0]?.id;

      if (!authUserId) {
        missingAuthUsers.push(account.email);
        continue;
      }

      await db.execute(sql`
        insert into public.users (id, username, email, full_name, role, is_active)
        values (${authUserId}, ${account.username}, ${account.email}, ${account.fullName}, ${account.role}, true)
        on conflict (id) do update
        set
          username = excluded.username,
          email = excluded.email,
          full_name = excluded.full_name,
          role = excluded.role,
          is_active = true,
          updated_at = now()
      `);

      await db.execute(sql`
        insert into public.user_roles (user_id, role)
        values (${authUserId}, ${account.role})
        on conflict (user_id, role) do nothing
      `);

      upserted += 1;
    }

    console.log(`\nSelesai seed: ${upserted} akun tersinkron ke public.users/public.user_roles.`);
    if (missingAuthUsers.length > 0) {
      console.warn("\nEmail berikut belum ada di auth.users (buat dulu di Supabase Auth):");
      for (const email of missingAuthUsers) {
        console.warn(`- ${email}`);
      }
    }
  } catch (error) {
    console.error("Seed gagal:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
