import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { OrdersClient } from "./OrdersClient";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await getAdminSession())) redirect("/admin/login");
  const { status } = await searchParams;
  return <OrdersClient initialStatus={status} />;
}
