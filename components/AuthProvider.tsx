"use client";

import { usePathname } from "next/navigation";
import { useAuthUser } from "@/app/hooks/authUser";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { loading } = useAuthUser();

  const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];
  if (loading && !publicPaths.includes(pathname)) return <p className="p-6">Loading...</p>;

  return <>{children}</>;
}