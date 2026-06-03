// Email seam for IN-IT. Uses Resend when RESEND_API_KEY is set, otherwise logs to the
// console so the rest of the app stays unblocked in local/dev and DB-less environments.
// FR-006 (activeringscode) and FR-026 (activiteit-notificaties) both send through here.

type SendArgs = {
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
};

type SendResult = { ok: boolean; id?: string; error?: string };

const FROM = process.env.EMAIL_FROM ?? "IN-IT Community <onboarding@resend.dev>";

export function hasEmail() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function siteUrl() {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  if (!hasEmail()) {
    // Stub: surface the message in server logs without a provider configured.
    const recipientCount = Array.isArray(args.bcc) ? args.bcc.length : args.bcc ? 1 : 0;
    console.info("[email:stub] would send", { to: args.to, bcc: recipientCount, subject: args.subject });
    return { ok: true, id: "stub" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      ...(args.bcc ? { bcc: args.bcc } : {}),
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Email send failed" };
  }
}

// Shared branded wrapper so every IN-IT email looks consistent.
function layout(bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#0d3b66;border-radius:20px;padding:20px 28px;color:#ffffff;">
      <span style="font-weight:800;letter-spacing:0.08em;text-transform:uppercase;font-size:13px;">IN-IT Community</span>
    </div>
    <div style="background:#ffffff;border-radius:20px;padding:28px;margin-top:14px;line-height:1.6;font-size:15px;">
      ${bodyHtml}
    </div>
    <p style="color:#8a8f98;font-size:12px;margin-top:18px;text-align:center;">
      Iraqi Network of Information Technology — besloten community
    </p>
  </div></body></html>`;
}

// FR-006: one-time activation invite after the coordinator approves a request.
export function activationEmail(params: { name: string; code: string }) {
  const url = `${siteUrl()}/join?code=${encodeURIComponent(params.code)}`;
  const subject = "Je toegang tot de IN-IT community is goedgekeurd";
  const html = layout(`
    <h1 style="font-size:22px;margin:0 0 12px;">Welkom bij IN-IT, ${escapeHtml(params.name)}</h1>
    <p>Je toegangsaanvraag is goedgekeurd door de coordinator. Gebruik de onderstaande eenmalige activeringscode om je toegang te activeren. De code is 24 uur geldig.</p>
    <p style="font-family:monospace;font-size:20px;font-weight:800;background:#f4f1ea;border-radius:12px;padding:14px 18px;text-align:center;letter-spacing:0.05em;">${escapeHtml(params.code)}</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${url}" style="background:#0d3b66;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;display:inline-block;">Activeer en log in met LinkedIn</a>
    </p>
    <p style="color:#6b7280;font-size:13px;">Inloggen verloopt uitsluitend via LinkedIn. Heb je deze aanvraag niet gedaan? Negeer dan deze e-mail.</p>
  `);
  const text = `Welkom bij IN-IT, ${params.name}.\n\nJe toegangsaanvraag is goedgekeurd. Activeringscode (24u geldig): ${params.code}\nActiveer via: ${url}\n\nInloggen verloopt via LinkedIn.`;
  return { subject, html, text };
}

// FR-026: notify authorized members when a new activity is published.
export function eventPublishedEmail(event: {
  title: string;
  slug: string;
  starts_at: string;
  location?: string | null;
  description?: string | null;
}) {
  const url = `${siteUrl()}/agenda/${encodeURIComponent(event.slug)}`;
  const when = new Date(event.starts_at).toLocaleString("nl-NL", { dateStyle: "full", timeStyle: "short" });
  const subject = `Nieuwe IN-IT activiteit: ${event.title}`;
  const html = layout(`
    <h1 style="font-size:22px;margin:0 0 12px;">${escapeHtml(event.title)}</h1>
    <p style="margin:0 0 6px;"><strong>Wanneer:</strong> ${escapeHtml(when)}</p>
    ${event.location ? `<p style="margin:0 0 6px;"><strong>Waar:</strong> ${escapeHtml(event.location)}</p>` : ""}
    ${event.description ? `<p style="margin:12px 0;">${escapeHtml(event.description)}</p>` : ""}
    <p style="text-align:center;margin:24px 0;">
      <a href="${url}" style="background:#0d3b66;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;display:inline-block;">Bekijk activiteit & meld je aan</a>
    </p>
    <p style="color:#6b7280;font-size:13px;">Je ontvangt deze mail als geautoriseerd IN-IT lid. Afmelden kan via je profielinstellingen.</p>
  `);
  const text = `Nieuwe IN-IT activiteit: ${event.title}\nWanneer: ${when}${event.location ? `\nWaar: ${event.location}` : ""}\n\nBekijk & meld je aan: ${url}`;
  return { to: FROM, subject, html, text };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export { escapeHtml };
