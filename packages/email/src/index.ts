/**
 * Transactional email via Resend when configured; otherwise a console
 * transport so local development never depends on a third party.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailTransport = {
  send(message: EmailMessage): Promise<{ id: string }>;
};

export class ConsoleTransport implements EmailTransport {
  async send(message: EmailMessage): Promise<{ id: string }> {
    console.log(
      `[email:console] to=${message.to} subject=${message.subject}\n${message.text}`,
    );
    return { id: `console-${Date.now()}` };
  }
}

export function createTransport(): EmailTransport {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return new ConsoleTransport();
  return {
    async send(message) {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      const from =
        process.env.EMAIL_FROM ?? "Utah Esports <updates@utahesports.net>";
      const { data, error } = await resend.emails.send({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      if (error) throw new Error(`Resend error: ${error.message}`);
      return { id: data?.id ?? "unknown" };
    },
  };
}

export type DigestEvent = {
  title: string;
  url: string;
  whenLabel: string;
  city: string | null;
  gameNames: string[];
};

export function renderWeeklyDigest(input: {
  name: string | null;
  events: DigestEvent[];
  siteUrl: string;
}): EmailMessage {
  const name = input.name ?? "there";
  const listHtml = input.events
    .map(
      (e) =>
        `<li style="margin:8px 0"><a href="${e.url}">${escapeHtml(e.title)}</a> — ${escapeHtml(e.whenLabel)}${e.city ? ` · ${escapeHtml(e.city)}` : ""}${e.gameNames.length ? ` · ${escapeHtml(e.gameNames.join(", "))}` : ""}</li>`,
    )
    .join("");
  const text = [
    `Hi ${name},`,
    "",
    `${input.events.length} upcoming Utah gaming event${input.events.length === 1 ? "" : "s"} for you:`,
    ...input.events.map((e) => `- ${e.title} — ${e.whenLabel}${e.city ? ` (${e.city})` : ""} ${e.url}`),
    "",
    `Explore more: ${input.siteUrl}/explore`,
    "Manage notifications in your account preferences.",
  ].join("\n");
  return {
    to: "",
    subject: `This week in Utah gaming (${input.events.length} event${input.events.length === 1 ? "" : "s"})`,
    html: `
      <div style="font-family:system-ui,sans-serif;color:#242833">
        <h2 style="margin:0 0 8px">Hi ${escapeHtml(name)} 👋</h2>
        <p style="margin:0 0 16px">Upcoming Utah gaming events matching your interests:</p>
        <ul>${listHtml || "<li>No events this week — check /explore for the latest.</li>"}</ul>
        <p><a href="${input.siteUrl}/explore">Explore all events →</a></p>
        <p style="color:#8b91a3;font-size:12px">You get this because weekly digests are enabled. Adjust anytime in account preferences.</p>
      </div>`,
    text,
  };
}

export function renderDeadlineReminder(input: {
  eventTitle: string;
  eventUrl: string;
  deadlineLabel: string;
}): EmailMessage {
  const text = `Registration for "${input.eventTitle}" closes ${input.deadlineLabel}. Details: ${input.eventUrl}`;
  return {
    to: "",
    subject: `Registration closing soon: ${input.eventTitle}`,
    html: `
      <div style="font-family:system-ui,sans-serif">
        <p>Registration for <strong>${escapeHtml(input.eventTitle)}</strong> closes ${escapeHtml(input.deadlineLabel)}.</p>
        <p><a href="${input.eventUrl}">View event &amp; register →</a></p>
      </div>`,
    text,
  };
}

export function renderChangeNotice(input: {
  eventTitle: string;
  eventUrl: string;
  changeSummary: string;
}): EmailMessage {
  const text = `"${input.eventTitle}" changed: ${input.changeSummary}. ${input.eventUrl}`;
  return {
    to: "",
    subject: `Update: ${input.eventTitle}`,
    html: `
      <div style="font-family:system-ui,sans-serif">
        <p><strong>${escapeHtml(input.eventTitle)}</strong> was updated.</p>
        <p>${escapeHtml(input.changeSummary)}</p>
        <p><a href="${input.eventUrl}">See details →</a></p>
      </div>`,
    text,
  };
}

export function renderFreshnessRequest(input: {
  orgName: string;
  eventTitle: string;
  eventUrl: string;
  confirmUrl: string;
}): EmailMessage {
  const text = `Please confirm the details for "${input.eventTitle}" are still accurate: ${input.confirmUrl} (listing: ${input.eventUrl})`;
  return {
    to: "",
    subject: `Confirm: is "${input.eventTitle}" still accurate?`,
    html: `
      <div style="font-family:system-ui,sans-serif">
        <p>Hi ${escapeHtml(input.orgName)} — your listing <strong>${escapeHtml(input.eventTitle)}</strong> hasn't been confirmed in a while.</p>
        <p><a href="${input.confirmUrl}">Confirm details are current →</a></p>
        <p style="color:#8b91a3;font-size:12px">Unconfirmed listings are labeled on the site and may appear less often in discovery.</p>
      </div>`,
    text,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
