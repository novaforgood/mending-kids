"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";

export function useAuthUser({ redirect = true } = {}) {
  const pathname = usePathname();  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user && pathname !== "/login" && redirect) {
        router.push("/login");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [router, redirect]);

  return { user, loading };
}