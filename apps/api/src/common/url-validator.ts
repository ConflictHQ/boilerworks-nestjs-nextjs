/**
 * SSRF protection: validates that a URL is safe to fetch.
 * Rejects localhost, private IPs, link-local, and non-HTTP(S) schemes.
 */
export function validateWebhookUrl(raw: string): void {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid webhook URL: ${raw}`);
  }

  // Only allow http and https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `Invalid webhook URL scheme: ${parsed.protocol} — only http and https are allowed`,
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  // Reject localhost variants
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  ) {
    throw new Error(`Webhook URL must not point to localhost: ${hostname}`);
  }

  // Reject private / reserved IPv4 ranges
  const ipv4Match = hostname.match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,
  );
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);

    // 10.0.0.0/8
    if (a === 10) {
      throw new Error(`Webhook URL must not point to private IP: ${hostname}`);
    }

    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) {
      throw new Error(`Webhook URL must not point to private IP: ${hostname}`);
    }

    // 192.168.0.0/16
    if (a === 192 && b === 168) {
      throw new Error(`Webhook URL must not point to private IP: ${hostname}`);
    }

    // 169.254.0.0/16 — link-local / cloud metadata
    if (a === 169 && b === 254) {
      throw new Error(
        `Webhook URL must not point to link-local IP: ${hostname}`,
      );
    }

    // 127.0.0.0/8 (covers 127.x.x.x beyond just 127.0.0.1)
    if (a === 127) {
      throw new Error(`Webhook URL must not point to loopback IP: ${hostname}`);
    }
  }
}
