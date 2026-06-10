export function getPostgresSslOption(connectionString: string) {
  const explicit = process.env.DATABASE_SSL?.trim().toLowerCase();

  if (explicit && ["0", "false", "disable", "disabled", "no", "off"].includes(explicit)) {
    return false;
  }

  if (explicit && ["1", "true", "require", "required", "yes", "on"].includes(explicit)) {
    return "require" as const;
  }

  return /supabase\.(co|com)|pooler\.supabase\.com/i.test(connectionString) ? ("require" as const) : false;
}
