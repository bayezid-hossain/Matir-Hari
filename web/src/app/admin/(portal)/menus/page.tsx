import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { MenusClient } from "./MenusClient";

export default async function AdminMenusPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return <MenusClient />;
}
