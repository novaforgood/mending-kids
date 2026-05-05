"use client";

import { useAuthUser } from "@/app/hooks/authUser";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthUser();

  if (loading) return <p className="p-6">Loading...</p>;

  return <>{children}</>;
}