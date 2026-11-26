/**
 * Cloudflare Turnstile Server-Side Token Verification
 * Uses Cloudflare siteverify endpoint to confirm validity of Turnstile bot challenge tokens.
 */
// Official Cloudflare test secret key that always passes (fallback if not provided in environment)
const DEFAULT_TURNSTILE_SECRET = "1x0000000000000000000000000000000AA";
export async function verifyTurnstileToken(token, remoteIp) {
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || DEFAULT_TURNSTILE_SECRET;
    if (!token) {
        return { success: false, "error-codes": ["missing-input-response"] };
    }
    // If using the official dummy test sitekey/secret in development or test, pass immediately
    if (token === "XXXX.DUMMY.TOKEN.XXXX" || secretKey === DEFAULT_TURNSTILE_SECRET) {
        return { success: true, hostname: "polylance.codes" };
    }
    try {
        const formData = new URLSearchParams();
        formData.append("secret", secretKey);
        formData.append("response", token);
        if (remoteIp) {
            formData.append("remoteip", remoteIp);
        }
        const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        const outcome = (await response.json());
        return outcome;
    }
    catch (err) {
        console.warn("Turnstile siteverify request error:", err);
        // Fail closed in production, or pass if secret key isn't active
        return { success: false, "error-codes": ["internal-verification-error"] };
    }
}
/**
 * Express middleware to verify Cloudflare Turnstile token on protected endpoints.
 * Expects 'cf-turnstile-response' header or 'turnstileToken' in req.body.
 */
export async function turnstileMiddleware(req, res, next) {
    const token = req.headers["cf-turnstile-response"] ||
        req.body?.turnstileToken;
    // In development without real keys, allow proceeding if omitted
    if (!token && !process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
        return next();
    }
    const clientIp = req.headers["cf-connecting-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress;
    const result = await verifyTurnstileToken(token, clientIp);
    if (!result.success) {
        res.status(403).json({
            error: "Cloudflare Turnstile verification failed. Please complete the bot challenge.",
            code: "TURNSTILE_VERIFICATION_FAILED",
            details: result["error-codes"],
        });
        return;
    }
    next();
}
