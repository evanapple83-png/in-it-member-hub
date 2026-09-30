import Link from "next/link";
import { redirect } from "next/navigation";
import { BlogEditor } from "@/components/blog/BlogEditor";
import { Icon } from "@/components/ui/icon";
import { getApprovedCurrentMember } from "@/lib/access";

export const metadata = { title: "Schrijf een verhaal | IN-IT" };

export default async function WriteBlogPostPage() {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=blog");

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="hello">
        <div>
          <h1>Deel jouw verhaal</h1>
          <p>Over een ervaring, project of les die je met de community wilt delen.</p>
        </div>
        <Link className="btn ghost" href="/blog">
          <Icon name="back" />
          Terug naar verhalen
        </Link>
      </div>
      <BlogEditor />
    </div>
  );
}
