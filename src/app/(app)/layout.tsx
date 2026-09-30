import { AppShell } from "@/components/app/AppShell";
import "./community.css";

// Member hub: approved members only (gate lives in AppShell via requireApprovedAccess).
export default function HubLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
