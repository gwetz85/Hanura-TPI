import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DpcDashboardClient from "./DpcDashboardClient";

export const metadata = { title: "DPC Dashboard – HANURA TPI" };

export default async function DpcPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "DPC") redirect("/login");

  const [ktaCount, activityCount, pacUsers] = await Promise.all([
    prisma.prospectiveMember.count({ where: { status: "PENDING" } }),
    prisma.activitySuggestion.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({ where: { role: { not: "DPC" } }, select: { id: true, name: true, role: true } }),
  ]);

  return (
    <DpcDashboardClient
      userName={session.user?.name ?? "DPC"}
      pendingKta={ktaCount}
      pendingActivity={activityCount}
      pacUsers={pacUsers}
    />
  );
}
