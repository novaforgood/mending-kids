import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};

const adminEmail = get("--admin");
const internEmail = get("--intern");
const password = get("--password");

if (!adminEmail || !internEmail || !password) {
  console.error(`Usage:
  node --env-file=.env scripts/create-users.mjs \\
    --admin admin@example.com \\
    --intern intern@example.com \\
    --password 'your-password'
`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const [email, role] of [
  [adminEmail, "admin"],
  [internEmail, "intern"],
]) {
  const full_name = role === "admin" ? "Admin User" : "Intern User";

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, full_name },
  });

  if (error) {
    console.error(`${role} (${email}): ${error.message}`);
    process.exit(1);
  }

  console.log(`${role}: ${email} — ${data.user.id}`);
}

console.log("Done.");
