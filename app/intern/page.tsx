"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase/client";

export default function InternPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{
    name: string;
    role: string;
  } | null>(null);

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

      if (role !== "intern") {
        router.push("/admin");
        return;
      }

      // 👇 SAVE USER INFO
      setUserData({
        name: user.user_metadata?.name || user.email || "No name",
        role: role || "No role",
      });

      setLoading(false);
    };

    checkAccess();
  }, [router]);

  if (loading) return <main style={{ padding: "40px" }}>Loading...</main>;

  return (
    <main style={{ padding: "40px" }}>
      <h1>Intern Dashboard</h1>

      {userData && (
        <>
          <p><strong>Name:</strong> {userData.name}</p>
          <p><strong>Role:</strong> {userData.role}</p>
        </>
      )}

      <p>This is the intern flow.</p>
    </main>
  );
}