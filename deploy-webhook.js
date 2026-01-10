/**
 * RetraLabs Deploy Webhook (run on VPS host, not inside app container)
 *
 * Listens for GitHub push webhooks and runs deploy.sh in APP_DIR.
 *
 * Env:
 *  - WEBHOOK_SECRET (required)
 *  - APP_DIR (default: /opt/retralabs)
 *  - WEBHOOK_PORT (default: 9000)
 */

const http = require("http");
const crypto = require("crypto");
const { spawn } = require("child_process");

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const APP_DIR = process.env.APP_DIR || "/opt/retralabs";
const WEBHOOK_PORT = Number(process.env.WEBHOOK_PORT || 9000);
// Default to localhost; expose publicly only if you must.
const WEBHOOK_HOST = process.env.WEBHOOK_HOST || "127.0.0.1";

if (!WEBHOOK_SECRET) {
  console.error("WEBHOOK_SECRET is required");
  process.exit(1);
}

function json(res, statusCode, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  });
  res.end(data);
}

function safeTimingEqual(a, b) {
  const aBuf = Buffer.isBuffer(a) ? a : Buffer.from(String(a));
  const bBuf = Buffer.isBuffer(b) ? b : Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifyGitHubSignature(rawBody, signatureHeader) {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(rawBody);
  const expected = `sha256=${hmac.digest("hex")}`;
  return safeTimingEqual(signatureHeader, expected);
}

function triggerDeploy() {
  // Run detached so webhook request can return quickly
  const child = spawn("/bin/bash", ["./deploy.sh"], {
    cwd: APP_DIR,
    stdio: "inherit",
    detached: true,
  });
  child.unref();
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/webhook/deploy") {
    return json(res, 404, { error: "Not found" });
  }

  const event = req.headers["x-github-event"];
  const signature = req.headers["x-hub-signature-256"];

  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const rawBody = Buffer.concat(chunks);

    if (!verifyGitHubSignature(rawBody, signature)) {
      return json(res, 401, { error: "Invalid signature" });
    }

    if (event !== "push") {
      return json(res, 200, { message: "Ignored non-push event" });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }

    const ref = payload.ref || "";
    const branch = ref.replace("refs/heads/", "");
    if (branch !== "main" && branch !== "master") {
      return json(res, 200, { message: `Ignored push to ${branch} branch` });
    }

    console.log(`🚀 Deploy triggered by push to ${branch}: ${payload.after || ""}`);
    triggerDeploy();

    return json(res, 200, {
      message: "Deployment triggered",
      branch,
      commit: payload.after,
      timestamp: new Date().toISOString(),
    });
  });
});

server.listen(WEBHOOK_PORT, WEBHOOK_HOST, () => {
  console.log(
    `Deploy webhook listening on http://${WEBHOOK_HOST}:${WEBHOOK_PORT}/webhook/deploy`,
  );
});


