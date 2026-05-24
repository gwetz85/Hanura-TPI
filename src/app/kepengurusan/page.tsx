import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import BoardClient from "./BoardClient";

export const metadata = { title: "Kepengurusan – DPC HANURA TPI" };

export default async function BoardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const boardMembers = await prisma.boardMember.findMany({
    orderBy: { createdAt: "asc" }
  });

  return <BoardClient boardMembers={boardMembers} userRole={session.user?.role || ""} />;
}
