import { parseStringPromise } from "xml2js";
import fs from "fs";

const CHANNELS = [
  "UC8embhEdS-QrY3K6XcoyyNg",
  "UC47AYUs8AVU1QsT5LhpXjaw",
  "UCnoYhOtV0IXZ6lv2R-ZnB_Q",
  "UCXbAi7tbAcxoDfW5I8hvv8g",
  "UCoKXb95K5h3sME3c9OCBaeA",
  "UCE5GP4BHm2EJx4xyxBVSLlg",
  "UCFBY6EJFIwCQCl-DiYYNKlg",
  "UCXTsCXNGHmePgo3a47hnsAA",
  "UCEbxO0RPlOQIVWrDaeepvuA",
  "UCsJqbdE9SBvLnYdHKOggQbg"
];

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const SEEN_FILE = "data/seen.json";

function loadSeen() {
  try {
    return JSON.parse(fs.readFileSync(SEEN_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveSeen(list) {
  fs.writeFileSync(SEEN_FILE, JSON.stringify(list, null, 2));
}

async function checkChannel(channelId, seen) {
  const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(RSS_URL);
  const xml = await res.text();
  const data = await parseStringPromise(xml);
  const entries = data.feed.entry || [];

  const newVideos = [];
  const newIds = [];

  for (const video of entries) {
    const id = video["yt:videoId"][0];
    const title = video.title[0];
    const link = video.link[0].$.href;

    if (!seen.includes(id)) {
      newVideos.push({ id, title, link });
      newIds.push(id);
    }
  }

  if (newVideos.length > 0) {
    const message =
      `🎬 **新しい動画が投稿されました！（${newVideos.length}件）**\n\n` +
      newVideos.map(v => `• ${v.title}\n${v.link}`).join("\n");

    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });
  }

  return newIds; // ← 新しいIDを返す
}

async function main() {
  let seen = loadSeen();

  for (const id of CHANNELS) {
    const newIds = await checkChannel(id, seen);

    // ★ メモリ上の seen を更新（これが超重要）
    seen = [...newIds, ...seen];
  }

  // 最後に保存
  saveSeen(seen.slice(0, 200));
}

main();
