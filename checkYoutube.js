import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

const CHANNEL_ID = "UC_x5XG1OV2P6uZZ5FSM9Ttw"; // ← 好きなチャンネルIDに変更
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

// ← ここだけ後であなたの Webhook URL に書き換える
const WEBHOOK_URL = "https://discord.com/api/webhooks/1450241492143837224/n4OQWigJaFjihid1VgOcc3jPDKyNr9Eay7XKrjNQm3kaxocJ4aQLlIKXf8XM5GzOv8cu";

async function main() {
  console.log("YouTube RSS チェック開始");

  try {
    const res = await fetch(RSS_URL);
    const xml = await res.text();

    const data = await parseStringPromise(xml);
    const entries = data.feed.entry || [];

    if (entries.length === 0) {
      console.log("動画が見つかりませんでした");
      return;
    }

    const latest = entries[0];
    const title = latest.title[0];
    const link = latest.link[0].$.href;

    // Discord に通知
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🎬 **新しい動画が投稿されました！**\n${title}\n${link}`
      })
    });

    console.log("通知を送信しました:", title);

  } catch (err) {
    console.error("エラー:", err);
  }
}

main();
