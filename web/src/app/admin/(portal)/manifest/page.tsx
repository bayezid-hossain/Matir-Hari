import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { ManifestClient } from "./ManifestClient";

export default async function AdminManifestPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return <ManifestClient />;
}
