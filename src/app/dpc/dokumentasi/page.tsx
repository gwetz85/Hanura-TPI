import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DokumentasiClient from "./DokumentasiClient";

export default async function DokumentasiPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Hanya ADMIN atau DPC yang bisa mengakses
  if (session.user.role !== "ADMIN" && session.user.role !== "DPC") {
    redirect("/login");
  }

  return <DokumentasiClient userRole={session.user.role} />;
}
