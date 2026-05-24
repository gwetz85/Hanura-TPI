import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import KtaManagerClient from "./KtaManagerClient";

export const metadata = { title: "Kelola KTA – DPC HANURA TPI" };

export default async function KtaManagerPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "DPC") redirect("/login");

  const [submissions, pacs] = await Promise.all([
    prisma.prospectiveMember.findMany({
      include: { pac: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: { not: "DPC" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Convert Date objects to JSON-safe strings for Client Component
  const serializedSubmissions = submissions.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return <KtaManagerClient submissions={serializedSubmissions} pacs={pacs} />;
}
