import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AccountsManagerClient from "./AccountsManagerClient";

export const metadata = { title: "Kelola Akun PAC – DPC HANURA TPI" };

export default async function AccountsManagerPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "DPC") {
    redirect("/login");
  }

  const pacUsers = await prisma.user.findMany({
    where: {
      role: { not: "DPC" }
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true
    },
    orderBy: {
      name: "asc"
    }
  });

  // Convert Date objects to JSON-safe strings
  const serializedPacUsers = pacUsers.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString()
  }));

  return <AccountsManagerClient pacUsers={serializedPacUsers} />;
}
