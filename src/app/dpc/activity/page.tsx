import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ActivityManagerClient from "./ActivityManagerClient";

export const metadata = { title: "Kelola Usulan Kegiatan – DPC HANURA" };

export default async function ActivityManagerPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["DPC", "ADMIN"].includes(session.user?.role as string)) redirect("/login");

  const suggestions = await prisma.activitySuggestion.findMany({
    include: {
      pac: { select: { id: true, name: true, role: true } },
      comments: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pacs = await prisma.user.findMany({
    where: { role: { notIn: ["DPC", "ADMIN"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  return <ActivityManagerClient suggestions={suggestions} pacs={pacs} />;
}
