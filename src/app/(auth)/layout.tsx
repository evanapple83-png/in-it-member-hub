import { ToastProvider } from "@/components/app/Toast";
import { MotionProvider } from "@/components/motion/MotionProvider";

// Auth frame: full viewport, no marketing navbar. Pages render a `.screen.auth` (use
// <AuthSplit>) or a `.screen.wait` inside it. Older pages that are not restyled yet scroll here.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider variant="auth">
      <div className="app ui" lang="nl">
        <ToastProvider>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", position: "relative" }}>
            {children}
          </div>
        </ToastProvider>
      </div>
    </MotionProvider>
  );
}
