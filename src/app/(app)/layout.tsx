import { AppShell } from "@/components/app/AppShell";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./community.css";

// Member hub: approved members only (gate lives in AppShell via requireApprovedAccess).
export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider variant="app">
      <AppShell>{children}</AppShell>
    </MotionProvider>
  );
}
