
import { did, getAgent } from "src/agent.js";
import { judge } from "src/judge.js";

const agent = await getAgent();

const likes = [];
const optOutsLikes: string[] = [];
let cursor;

while (true) {
  const { data } = await agent.app.bsky.feed.getLikes({
    uri: `at://${did}/app.bsky.feed.post/3l4obq2dxhs2p`,
    limit: 100,
    cursor,
  });
  optOutsLikes.push(...data.likes.map((like) => like.actor.did));
  cursor = data.cursor;
  if (!cursor) break;
}

cursor = undefined;

while (true) {
  const { data } = await agent.app.bsky.feed.getLikes({
    uri: `at://${did}/app.bsky.labeler.service/self`,
    limit: 100,
    cursor,
  });
  likes.push(
    ...data.likes.filter((like) => !optOutsLikes.includes(like.actor.did))
  );
  cursor = data.cursor;
  if (!cursor) break;
}

let errors: string[] = [];

for (const like of likes) {
  await judge(like.actor).catch((err) => errors.push(err.message));
}

for (const error of new Set(errors)) {
  console.error(errors.filter((e) => e === error).length + "x", error);
}
