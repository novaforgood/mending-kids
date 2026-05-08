"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase/client";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const role = user.user_metadata?.role;

      if (role !== "admin") {
        router.push("/intern");
        return;
      }

      setLoading(false);
    };

    checkAccess();
  }, [router]);

  if (loading) return <main style={{ padding: "40px" }}>Loading...</main>;

  return (
    <main style={{ padding: "40px" }}>
      <h1>Admin Dashboard</h1>
      <p>This is the admin flow.</p>
    </main>
  );
}