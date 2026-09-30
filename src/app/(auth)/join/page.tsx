import { redirect } from "next/navigation";
import { AuthSplit } from "@/components/app/AuthSplit";
import { InviteCodeForm } from "@/components/access/InviteCodeForm";
import { getAccessState } from "@/lib/access-state";

export const metadata = { title: "Uitnodiging | IN-IT" };

const QUOTE = {
  title: "Iraqi Network of Information Technology",
  text: "Een besloten netwerk van IT-professionals met Iraakse roots in Nederland.",
};

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  if ((await getAccessState()).state === "approved") redirect("/vandaag");
  const { code } = await searchParams;
  return (
    <AuthSplit crop="c-wide" quote={QUOTE}>
      <InviteCodeForm initialCode={typeof code === "string" ? code : ""} />
    </AuthSplit>
  );
}
