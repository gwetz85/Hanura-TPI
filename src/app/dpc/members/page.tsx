import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import MembersManagerClient from "./MembersManagerClient";

export const metadata = { title: "Daftar Anggota – DPC HANURA TPI" };

export default async function MembersManagerPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["DPC", "ADMIN"].includes(session.user?.role as string)) redirect("/login");

  const members = await prisma.member.findMany({
    include: { pac: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pacs = await prisma.user.findMany({
    where: { role: { startsWith: "PAC" } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" }
  });

  return <MembersManagerClient members={members} pacs={pacs} />;
}
