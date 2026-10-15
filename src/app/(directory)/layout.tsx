import { AppShell } from "@/components/app/AppShell";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { isApprovedMember } from "@/lib/access";
import "../(app)/community.css";

export default async function DirectoryLayout({ children }: { children: React.ReactNode }) {
  if (await isApprovedMember()) {
    return <MotionProvider variant="app"><AppShell>{children}</AppShell></MotionProvider>;
  }
  return <><Navbar /><main className="flex-1">{children}</main><Footer /></>;
}
