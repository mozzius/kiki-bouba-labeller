import { did, getAgent } from "src/agent.js";
import { judge } from "src/judge.js";

const agent = await getAgent();

const likes = await agent.api.app.bsky.feed.getLikes({
  uri: `at://${did}/app.bsky.labeler.service/self`,
  limit: 50,
});

for (const like of likes.data.likes) {
  await judge(like.actor.did).catch((err) => console.error(err.message));
}
