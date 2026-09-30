import { AdminShell } from "@/components/admin/AdminShell";
import { MotionProvider } from "@/components/motion/MotionProvider";

// Beheer: approved members with an admin row (gate lives in AdminShell via requireAdminAccess).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider variant="admin">
      <AdminShell>{children}</AdminShell>
    </MotionProvider>
  );
}
