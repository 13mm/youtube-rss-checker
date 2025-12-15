import { parseStringPromise } from "xml2js";

const CHANNELS = [
  "UC8embhEdS-QrY3K6XcoyyNg",
  "UC47AYUs8AVU1QsT5LhpXjaw",
  "UCnoYhOtV0IXZ6lv2R-ZnB_Q",
  "UCXbAi7tbAcxoDfW5I8hvv8g",
  "UCXbAi7tbAcxoDfW5I8hvv8g",
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

    if (entries.length === 0) return;

    const latest = entries[0];
    const title = latest.title[0];
    const link = latest.link[0].$.href;

    // ★ 投稿時間チェック
    const published = new Date(latest.published[0]);
    const now = new Date();
    const diffMinutes = (now - published) / 1000 / 60;

    if (diffMinutes > 5) {
      console.log("新しい動画ではない:", title);
      return;
    }

    // ★ 新しい動画だけ通知
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🎬 **新しい動画が投稿されました！**\n${title}\n${link}`
      })
    });

    console.log("通知送信:", title);

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
