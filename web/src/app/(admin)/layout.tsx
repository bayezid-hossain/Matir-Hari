import type { ReactNode } from "react";
// This route group exists only to satisfy Next.js — the real admin layout
// lives at app/admin/(portal)/layout.tsx.
export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
