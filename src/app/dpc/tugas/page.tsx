import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TugasClient from "./TugasClient";

export const metadata = {
  title: "Tugas & Hasil Pertemuan | Hanura",
};

export default async function TugasPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Hanya DPC, ADMIN, PETUGAS yang bisa akses (PAC diblokir)
  if (session.user.role.startsWith("PAC")) {
    redirect("/pac");
  }

  return <TugasClient userRole={session.user.role} userName={session.user.name} />;
}
