"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase/client";

export function useRequireAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

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

      setAuthorized(true);
      setLoading(false);
    };

    checkAccess();
  }, [router]);

  return { loading, authorized };
}
