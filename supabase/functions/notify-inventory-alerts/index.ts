import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type InventoryRow = {
  id: number;
  item_description: string | null;
  quantity: number;
  alert_threshold: number | null;
  expiration_date: string | null;
  location: string | null;
};

type AlertUser = {
  email: string;
  full_name: string | null;
};

// Prefer PROJECT_* vars (used for local testing against prod data) and fall back to
// the auto-injected SUPABASE_* vars when deployed.
const SUPABASE_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("PROJECT_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

// Replace with a Resend-verified domain address before production use.
// For testing only, use "onboarding@resend.dev" (delivers only to your Resend account email).
const FROM_EMAIL = "onboarding@resend.dev";
const FROM_NAME = "Mending Kids Inventory";

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Fetch all inventory rows
    const { data: allItems, error: inventoryError } = await supabase
      .from("inventory")
      .select("id, item_description, quantity, alert_threshold, expiration_date, location");

    if (inventoryError) throw new Error(`Inventory query failed: ${inventoryError.message}`);

    const rows: InventoryRow[] = allItems ?? [];

    // 2. Filter alerts (mirrors app/alerts/page.tsx logic exactly)
    const lowStockItems = rows
      .filter((r) => r.alert_threshold != null && r.quantity < r.alert_threshold)
      .sort((a, b) => a.quantity / a.alert_threshold! - b.quantity / b.alert_threshold!);

    const now = new Date();
    const sixMonthsFromNow = new Date(now);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    const expiringItems = rows
      .filter((r) => {
        if (!r.expiration_date) return false;
        return new Date(r.expiration_date) <= sixMonthsFromNow;
      })
      .sort((a, b) => new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime());

    // 3. Skip if nothing to report
    if (lowStockItems.length === 0 && expiringItems.length === 0) {
      return json({ ok: true, message: "No alerts today — no emails sent." });
    }

    // 4. Fetch all registered users
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw new Error(`Failed to fetch users: ${usersError.message}`);

    const users: AlertUser[] = (usersData?.users ?? [])
      .filter((u) => !!u.email)
      .map((u) => ({
        email: u.email!,
        full_name: (u.user_metadata?.full_name as string) ?? null,
      }));

    if (users.length === 0) {
      return json({ ok: true, message: "No users to notify." });
    }

    // 5. Build shared email content once
    const subject = buildSubject(lowStockItems.length, expiringItems.length);
    const htmlTemplate = buildHtmlTemplate(lowStockItems, expiringItems, now);

    // 6. Send one email per user concurrently
    const results = await Promise.allSettled(
      users.map((user) =>
        sendEmail(user.email, personalizeHtml(htmlTemplate, user.full_name), subject)
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed: { email: string; reason: string }[] = [];
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        failed.push({
          email: users[i].email,
          reason: (r as PromiseRejectedResult).reason?.message ?? "unknown",
        });
      }
    });

    if (failed.length > 0) console.error("Failed sends:", JSON.stringify(failed));

    return json({
      ok: true,
      sent: succeeded,
      failed: failed.length,
      failedDetails: failed,
      lowStockCount: lowStockItems.length,
      expiringCount: expiringItems.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Edge function error:", message);
    return json({ ok: false, error: message }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildSubject(lowCount: number, expCount: number): string {
  const parts: string[] = [];
  if (lowCount > 0) parts.push(`${lowCount} low stock item${lowCount === 1 ? "" : "s"}`);
  if (expCount > 0) parts.push(`${expCount} expiring item${expCount === 1 ? "" : "s"}`);
  return `[Mending Kids] Inventory Alert: ${parts.join(" & ")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function getExpiryLabel(dateStr: string, now: Date): string {
  const diffDays = Math.ceil((new Date(dateStr).getTime() - now.getTime()) / 86_400_000);
  if (diffDays < 0) return '<span style="color:#b91c1c;font-weight:700;">EXPIRED</span>';
  if (diffDays <= 60) return `<span style="color:#b91c1c;font-weight:700;">Expires in ${diffDays} day${diffDays === 1 ? "" : "s"}</span>`;
  const months = Math.floor(diffDays / 30);
  return `<span style="color:#d97706;font-weight:700;">Expires in ~${months} month${months === 1 ? "" : "s"}</span>`;
}

function buildHtmlTemplate(
  lowStockItems: InventoryRow[],
  expiringItems: InventoryRow[],
  now: Date
): string {
  const lowStockSection = lowStockItems.length > 0 ? `
    <h2 style="color:#92400e;font-size:15px;margin:24px 0 8px;padding-bottom:4px;border-bottom:2px solid #fde68a;">
      ⚠️ Low Stock Items (${lowStockItems.length})
    </h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#fef3c7;">
          <th style="text-align:left;padding:8px 10px;border:1px solid #fde68a;">Item</th>
          <th style="text-align:center;padding:8px 10px;border:1px solid #fde68a;">Qty</th>
          <th style="text-align:center;padding:8px 10px;border:1px solid #fde68a;">Threshold</th>
          <th style="text-align:left;padding:8px 10px;border:1px solid #fde68a;">Location</th>
        </tr>
      </thead>
      <tbody>
        ${lowStockItems.map((item, i) => `
        <tr style="background:${i % 2 === 0 ? "#fff" : "#fffbeb"};">
          <td style="padding:8px 10px;border:1px solid #fde68a;">${item.item_description ?? "—"}</td>
          <td style="padding:8px 10px;border:1px solid #fde68a;text-align:center;color:#b45309;font-weight:700;">${item.quantity}</td>
          <td style="padding:8px 10px;border:1px solid #fde68a;text-align:center;">${item.alert_threshold}</td>
          <td style="padding:8px 10px;border:1px solid #fde68a;">${item.location ?? "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>` : "";

  const expiringSection = expiringItems.length > 0 ? `
    <h2 style="color:#991b1b;font-size:15px;margin:24px 0 8px;padding-bottom:4px;border-bottom:2px solid #fca5a5;">
      🗓️ Expiring Items (${expiringItems.length})
    </h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#fee2e2;">
          <th style="text-align:left;padding:8px 10px;border:1px solid #fca5a5;">Item</th>
          <th style="text-align:center;padding:8px 10px;border:1px solid #fca5a5;">Qty</th>
          <th style="text-align:left;padding:8px 10px;border:1px solid #fca5a5;">Expiration Date</th>
          <th style="text-align:left;padding:8px 10px;border:1px solid #fca5a5;">Status</th>
          <th style="text-align:left;padding:8px 10px;border:1px solid #fca5a5;">Location</th>
        </tr>
      </thead>
      <tbody>
        ${expiringItems.map((item, i) => `
        <tr style="background:${i % 2 === 0 ? "#fff" : "#fff5f5"};">
          <td style="padding:8px 10px;border:1px solid #fca5a5;">${item.item_description ?? "—"}</td>
          <td style="padding:8px 10px;border:1px solid #fca5a5;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 10px;border:1px solid #fca5a5;">${formatDate(item.expiration_date!)}</td>
          <td style="padding:8px 10px;border:1px solid #fca5a5;">${getExpiryLabel(item.expiration_date!, now)}</td>
          <td style="padding:8px 10px;border:1px solid #fca5a5;">${item.location ?? "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>` : "";

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:660px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">

    <div style="background:#1e3a5f;padding:22px 28px;">
      <h1 style="color:#fff;margin:0;font-size:18px;font-weight:700;">Mending Kids — Inventory Alert</h1>
      <p style="color:#93c5fd;margin:4px 0 0;font-size:12px;">Daily digest · ${dateLabel}</p>
    </div>

    <div style="padding:22px 28px;">
      <p style="color:#374151;font-size:14px;margin:0 0 6px;">{{GREETING}}</p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">The following inventory items require your attention.</p>

      ${lowStockSection}
      ${expiringSection}

      <div style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;">
        <a href="https://mending-kids.vercel.app/alerts"
           style="display:inline-block;background:#1e3a5f;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">
          View Alerts in Dashboard →
        </a>
      </div>
    </div>

    <div style="background:#f9fafb;padding:14px 28px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;">
      You are receiving this because you are a registered Mending Kids team member. This is an automated daily digest.
    </div>
  </div>
</body>
</html>`;
}

function personalizeHtml(template: string, fullName: string | null): string {
  return template.replace("{{GREETING}}", fullName ? `Hello, ${fullName}!` : "Hello,");
}

async function sendEmail(to: string, html: string, subject: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status} for ${to}: ${body}`);
  }
}
