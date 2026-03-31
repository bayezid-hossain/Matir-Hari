import type { ReactNode } from "react";
import { AdminLayoutWrapper } from "./AdminLayoutWrapper";

export const metadata = { title: "Matir Hari Admin" };

export default function AdminPortalLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
