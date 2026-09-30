import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

// Public marketing pages keep the original navbar + footer look.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
