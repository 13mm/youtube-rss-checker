import { parseStringPromise } from "xml2js";
import fs from "fs";

// ★ チャンネルIDとジャンルを紐づける
const CHANNELS = [
  { id: "UC8embhEdS-QrY3K6XcoyyNg", genre: "vlog" },
  { id: "UC47AYUs8AVU1QsT5LhpXjaw", genre: "other" },
  { id: "UCnoYhOtV0IXZ6lv2R-ZnB_Q", genre: "music" },
  { id: "UCXbAi7tbAcxoDfW5I8hvv8g", genre: "game" },
  { id: "UCoKXb95K5h3sME3c9OCBaeA", genre: "music" },
  { id: "UCE5GP4BHm2EJx4xyxBVSLlg", genre: "music" },
  { id: "UCFBY6EJFIwCQCl-DiYYNKlg", genre: "music" },
  { id: "UCXTsCXNGHmePgo3a47hnsAA", genre: "music" },
  { id: "UCEbxO0RPlOQIVWrDaeepvuA", genre: "music" },
  { id: "UCsJqbdE9SBvLnYdHKOggQbg", genre: "game" }
];

// ★ ジャンルごとに Webhook を設定
const WEBHOOKS = {
  game: process.env.WEBHOOK_GAME,
  music: process.env.WEBHOOK_MUSIC,
  vlog: process.env.WEBHOOK_VLOG,
  other: process.env.WEBHOOK_OTHER
};

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

async function checkChannel(channel, seen) {
  console.log("genre:", channel.genre, "webhook:", WEBHOOKS[channel.genre]);

  const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
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
    const webhook = WEBHOOKS[channel.genre];

    if (webhook) {
      const message =
        `🎬 **${channel.genre} ジャンルの新着動画（${newVideos.length}件）**\n\n` +
        newVideos.map(v => `• ${v.title}\n${v.link}`).join("\n");

      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
      });
    }
  }

  return newIds;
}

async function main() {
  let seen = loadSeen();

  for (const channel of CHANNELS) {
    const newIds = await checkChannel(channel, seen);
    seen = [...newIds, ...seen];
  }

  saveSeen(seen.slice(0, 200));
}

main();
