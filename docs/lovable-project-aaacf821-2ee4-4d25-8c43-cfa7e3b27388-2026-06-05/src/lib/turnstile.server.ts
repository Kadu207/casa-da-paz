/**
 * Verifica um token Cloudflare Turnstile junto à API oficial de siteverify.
 * Roda apenas no servidor (usa o secret).
 */
export async function verifyTurnstile(
  token: string,
  remoteIp?: string,
): Promise<{ success: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { success: false, error: "turnstile_secret_missing" };
  }
  if (!token) {
    return { success: false, error: "missing_token" };
  }

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
      },
    );

    if (!res.ok) {
      return { success: false, error: `siteverify_http_${res.status}` };
    }

    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!data.success) {
      return {
        success: false,
        error: data["error-codes"]?.join(",") ?? "verification_failed",
      };
    }
    return { success: true };
  } catch (err) {
    console.error("turnstile verify error", err);
    return { success: false, error: "network_error" };
  }
}
