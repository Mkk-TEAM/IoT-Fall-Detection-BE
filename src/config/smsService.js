import { env } from "./env.js";

export async function sendFallSms({ to, event }) {
  if (!env.smsEnabled) return;
  if (!to) return;

  // Keep message ASCII-only and under 160 chars (1 SMS segment, cheaper).
  const confidence = event.confidence != null
    ? ` ${Math.round(event.confidence * 100)}%`
    : "";
  // Truncate device name to avoid blowing the 160-char limit.
  const device = (event.device?.displayName ?? event.deviceId ?? "tb")
    .replace(/[^\x00-\x7F]/g, "?")  // strip non-ASCII (unicode → 70-char segments)
    .substring(0, 20);
  const time = new Date(event.timestamp ?? Date.now())
    .toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const message = `[TE NGA] ${time} - ${device}${confidence}. Kiem tra nguoi dung!`;

  try {
    const res = await fetch(`${env.smsServiceUrl}/sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Edge-Secret": env.edgeSecret ?? "",
      },
      body: JSON.stringify({ to, message }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[SMS] Failed to ${to}: HTTP ${res.status} — ${body}`);
    } else {
      console.log(`[SMS] Sent to ${to}: ${message}`);
    }
  } catch (err) {
    console.error(`[SMS] Error sending to ${to}: ${err.message}`);
  }
}
