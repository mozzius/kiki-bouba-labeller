import { AppBskyFeedLike } from "@atproto/api";
import {
  ComAtprotoSyncSubscribeRepos,
  SubscribeReposMessage,
  subscribeRepos,
} from "atproto-firehose";
import { did } from "./agent.js";
import { judge } from "./judge.js";

const subscribe = async () => {
  console.log("Subscribing...");
  const client = subscribeRepos(`wss://bsky.network`, { decodeRepoOps: true });
  client.on("message", (m: SubscribeReposMessage) => {
    if (ComAtprotoSyncSubscribeRepos.isCommit(m)) {
      m.ops.forEach((op) => {
        if (AppBskyFeedLike.isRecord(op.payload)) {
          if (op.payload.subject.uri.includes(did)) {
            judge(m.repo).catch((err) => console.error(err.message));
          }
        }
      });
    }
  });
  client.on("error", (e) => {
    console.error(e);
  });
  client.on("close", () => {
    console.log("Closed");
    setTimeout(subscribe, 1000);
  });
  console.log("Subscribed!");
};

subscribe();
