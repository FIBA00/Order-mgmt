import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import log from "../../utils/logger.js";

const logsRouter = Router();
const LOG_FILE = path.join(process.cwd(), "data", "collected-logs.jsonl");

// Upload logs upstream if remote URL is configured
async function forwardToRemote(payload) {
  const remoteUrl = process.env.REMOTE_LOG_UPLOAD_URL;
  if (!remoteUrl) return null;
  try {
    const res = await fetch(remoteUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    log.warn(`Remote log upload failed: ${err.message}`);
    return false;
  }
}

logsRouter.post("/upload", async (req, res) => {
  const source = req.body?.source || "unknown";
  const entries = req.body?.entries || req.body?.logs;
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ success: false, error: "logs must be an array" });
  }

  const timestamp = new Date().toISOString();
  const lines = entries.map((entry) =>
    JSON.stringify({
      timestamp,
      source,
      entry: typeof entry === "string" ? { message: entry } : entry,
    }) + "\n",
  );

  try {
    fs.appendFileSync(LOG_FILE, lines.join(""), "utf8");
    log.info(`Collected ${entries.length} log(s) from [${source}]`);
    
    // Attempt upstream forward if configured
    forwardToRemote({ source, entries, timestamp }).catch(() => {});

    return res.status(200).json({ success: true, count: entries.length });
  } catch (err) {
    log.error(`Failed to store collected logs: ${err.message}`);
    return res.status(500).json({ success: false, message: "Failed to store logs" });
  }
});

export default logsRouter;
