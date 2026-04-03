import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { PaymentNumbersClient } from "./PaymentNumbersClient";

export default async function PaymentNumbersPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return (
    <div className="px-6 py-8 max-w-2xl mx-auto w-full">
      <PaymentNumbersClient />
    </div>
  );
}
