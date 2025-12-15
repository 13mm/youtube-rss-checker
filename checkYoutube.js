import { parseStringPromise } from "xml2js";

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

async function checkChannel(channelId) {
  const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  try {
    const res = await fetch(RSS_URL);
    const xml = await res.text();
    const data = await parseStringPromise(xml);
    const entries = data.feed.entry || [];

    const now = new Date();
    const newVideos = [];

    // ★ 5分以内の動画を全部集める
    for (const video of entries) {
      const title = video.title[0];
      const link = video.link[0].$.href;
      const published = new Date(video.published[0]);

      const diffMinutes = (now - published) / 1000 / 60;

      if (diffMinutes <= 15) {
        newVideos.push({ title, link });
      }
    }

    // ★ 新しい動画がなければ何もしない
    if (newVideos.length === 0) return;

    // ★ まとめて通知
    const message =
      `🎬 **新しい動画が投稿されました！（${newVideos.length}件）**\n\n` +
      newVideos.map(v => `• ${v.title}\n${v.link}`).join("\n");

    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });

    console.log(`通知送信: ${newVideos.length}件`);

  } catch (err) {
    console.error("エラー:", err);
  }
}

async function main() {
  for (const id of CHANNELS) {
    await checkChannel(id);
  }
}

main();
