import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return <SettingsClient />;
}
