import fetch from "node-fetch";
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

// ★ ニュース専用 Webhook
const NEWS_WEBHOOK = process.env.WEBHOOK_NEWS;

// ★ ニュース判定（必要最低限）
function isNews(title) {
  const lower = title.toLowerCase();
  return (
    lower.includes("ジョジョ") ||
    lower.includes("期間限定") ||
    lower.includes("限定公開") ||
    lower.includes("イッキ見") ||
    lower.includes("プレミア公開")
  );
}

const SEEN_FILE = "data/seen.json"; // ★共通

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

  const newIds = [];

  for (const video of entries) {
    const id = video["yt:videoId"][0];
    const title = video.title[0];
    const link = video.link[0].$.href;

    if (!seen.includes(id)) {
      if (isNews(title) && NEWS_WEBHOOK) {
        await fetch(NEWS_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `📰 **ニュース動画**\n${title}\n${link}`
          })
        });
      }

      newIds.push(id);
    }
  }

  return newIds;
}

async function main() {
  let seen = loadSeen();

  for (const id of CHANNELS) {
    const newIds = await checkChannel(id, seen);
    seen = [...newIds, ...seen];
  }

  saveSeen(seen.slice(0, 200));
}

main();
