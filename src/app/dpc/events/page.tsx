import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import EventsManagerClient from "./EventsManagerClient";

export const metadata = { title: "Kelola Event – DPC HANURA TPI" };

export default async function EventsManagerPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "DPC") redirect("/login");

  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
  });

  return <EventsManagerClient events={events} />;
}
