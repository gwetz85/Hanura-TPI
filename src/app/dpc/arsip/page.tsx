import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ArsipClient from "./ArsipClient";

export default async function ArsipPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "DPC" && session.user.role !== "PETUGAS") {
    redirect("/login"); // or some unauthorized page
  }

  return <ArsipClient userRole={session.user.role} />;
}
