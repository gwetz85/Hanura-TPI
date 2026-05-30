import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import SuratClient from "./SuratClient";

export const metadata = { title: "Surat DPC – DPC HANURA TPI" };

export default async function SuratPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["DPC", "ADMIN"].includes(session.user?.role as string)) redirect("/login");

  const [suratMasuk, suratKeluar] = await Promise.all([
    prisma.incomingLetter.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.outgoingLetter.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  // Convert Date objects to JSON-safe strings for Client Component
  const serializedSuratMasuk = suratMasuk.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const serializedSuratKeluar = suratKeluar.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return <SuratClient initialSuratMasuk={serializedSuratMasuk} initialSuratKeluar={serializedSuratKeluar} />;
}
