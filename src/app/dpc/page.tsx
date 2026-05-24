import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DpcDashboardClient from "./DpcDashboardClient";

export const metadata = { title: "DPC Dashboard – HANURA TPI" };

export default async function DpcPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "DPC") redirect("/login");

  const [ktaCount, activityCount, pacUsers, memberCounts, maleCount, femaleCount] = await Promise.all([
    prisma.prospectiveMember.count({ where: { status: "PENDING" } }),
    prisma.activitySuggestion.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({ where: { role: { not: "DPC" } }, select: { id: true, name: true, role: true } }),
    prisma.member.groupBy({
      by: ["pacId"],
      _count: { id: true },
    }),
    prisma.member.count({ where: { OR: [{ gender: "L" }, { gender: "l" }] } }),
    prisma.member.count({ where: { OR: [{ gender: "P" }, { gender: "p" }] } }),
  ]);

  // Build a map of pacId -> member count
  const memberCountMap: Record<string, number> = {};
  for (const mc of memberCounts) {
    memberCountMap[mc.pacId] = mc._count.id;
  }

  // Calculate total members across all PACs
  const totalMembers = memberCounts.reduce((sum, mc) => sum + mc._count.id, 0);

  return (
    <DpcDashboardClient
      userName={session.user?.name ?? "DPC"}
      pendingKta={ktaCount}
      pendingActivity={activityCount}
      pacUsers={pacUsers}
      memberCountMap={memberCountMap}
      totalMembers={totalMembers}
      maleCount={maleCount}
      femaleCount={femaleCount}
    />
  );
}
