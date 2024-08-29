import { did, getAgent } from "src/agent.js";
import { judge } from "src/judge.js";

const agent = await getAgent();

const likes = [];
let cursor;

while (true) {
  const { data } = await agent.api.app.bsky.feed.getLikes({
    uri: `at://${did}/app.bsky.labeler.service/self`,
    limit: 100,
    cursor,
  });
  likes.push(...data.likes);
  cursor = data.cursor;
  if (!cursor) break;
}

for (const like of likes) {
  let errors: string[] = []
  await judge(like.actor).catch((err) => errors.push(err.message));
  for (const error of new Set(errors)) {
    console.error(errors.filter(e => e === error).length + "x", error);
  }
}
