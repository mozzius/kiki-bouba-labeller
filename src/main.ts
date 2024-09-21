import { did } from "./agent.js";
import { judge, removeLabel } from "./judge.js";
import { Jetstream } from "@skyware/jetstream";

import fs from "node:fs";

let interval: ReturnType<typeof setInterval>;
const cursorFile = fs.readFileSync("cursor.txt", "utf8");
if (cursorFile) console.log(`Initiate firehose at cursor ${cursorFile}`);
else console.log("Initiate firehose (no cursor)");

const jetstream = new Jetstream({
  wantedCollections: ["app.bsky.feed.like"],
  cursor: cursorFile || undefined,
});

jetstream.on("open", () => {
  interval = setInterval(() => {
    const cursor = jetstream.cursor;
    if (cursor) {
      console.log(`${new Date().toISOString()}: ${cursor}`);
      fs.writeFile("cursor.txt", cursor.toString(), (err) => {
        if (err) console.log(err);
      });
    }
  }, 60000);
});

jetstream.on("error", (err) => console.error(err));

jetstream.on("close", () => clearInterval(interval));

jetstream.onCreate("app.bsky.feed.like", (op) => {
  if (
    op.commit.record?.subject?.uri ===
    `at://${did}/app.bsky.labeler.service/self`
  ) {
    judge(op.did).catch((err) => console.error(err.message));
  } else if (
    op.commit.record?.subject?.uri ===
    `at://${did}/app.bsky.feed.post/3l4obq2dxhs2p`
  ) {
    removeLabel(op.did).catch((err) => console.error(err.message));
  }
});

jetstream.start();
