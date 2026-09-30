import { AdminShell } from "@/components/admin/AdminShell";

// Beheer: approved members with an admin row (gate lives in AdminShell via requireAdminAccess).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
