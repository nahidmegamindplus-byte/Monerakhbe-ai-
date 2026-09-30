const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const path = require("path");
const fs = require("fs");

// Load environment variables
require("dotenv").config();

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT, 10) || 3000;

// 1. Auto-Build and Self-Heal if .next is missing on Hostinger
const nextDir = path.join(__dirname, ".next");
if (!fs.existsSync(nextDir)) {
  console.log("⚡ [Hostinger Zero-Touch] First-time setup detected. Auto-building Next.js application...");
  try {
    const { execSync } = require("child_process");
    execSync("npx prisma generate && node scripts/sync_db.js && npx next build", {
      stdio: "inherit",
      cwd: __dirname,
    });
    console.log("✅ [Hostinger Zero-Touch] Build completed successfully!");
  } catch (buildErr) {
    console.warn("⚠️ [Hostinger Zero-Touch Build Warning]", buildErr.message);
  }
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Sync database & initial seed data if needed
  try {
    const syncScript = path.join(__dirname, "scripts", "sync_db.js");
    if (fs.existsSync(syncScript)) {
      require(syncScript);
    }
  } catch (dbErr) {
    console.warn("[Hostinger Startup] DB Init Notice:", dbErr.message);
  }

  // Start HTTP Server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("[Hostinger Server Error] Handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  server
    .once("error", (err) => {
      console.error("[Hostinger Server Fatal Error]", err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 MoneRakhbe AI Server is live on http://${hostname}:${port}`);
    });
});
