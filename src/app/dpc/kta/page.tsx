import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import KtaManagerClient from "./KtaManagerClient";

export const metadata = { title: "Kelola KTA – DPC HANURA TPI" };

export default async function KtaManagerPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "DPC") redirect("/login");

  const submissions = await prisma.prospectiveMember.findMany({
    include: { pac: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <KtaManagerClient submissions={submissions} />;
}
