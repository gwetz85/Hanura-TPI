import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ActivityManagerClient from "./ActivityManagerClient";

export const metadata = { title: "Kelola Usulan Kegiatan – DPC HANURA TPI" };

export default async function ActivityManagerPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "DPC") redirect("/login");

  const suggestions = await prisma.activitySuggestion.findMany({
    include: { pac: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <ActivityManagerClient suggestions={suggestions} />;
}
