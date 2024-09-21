import { AppBskyLabelerService, BskyAgent } from "@atproto/api";
import "dotenv/config";

const agent = new BskyAgent({
  service: process.env.BSKY_SERVICE ?? "https://bsky.social",
});

await agent.login({
  identifier: process.env.BSKY_IDENTIFIER!,
  password: process.env.BSKY_PASSWORD!,
});

const config = {
  policies: {
    labelValues: ["kiki", "bouba"],
    labelValueDefinitions: [
      {
        identifier: "kiki",
        severity: "inform",
        blurs: "none",
        defaultSetting: "inform",
        locales: [
          {
            lang: "en",
            name: "Kiki",
            description: "User has been judged and deemed kiki",
          },
        ],
        adultOnly: false,
      },
      {
        identifier: "bouba",
        severity: "inform",
        blurs: "none",
        defaultSetting: "inform",
        locales: [
          {
            lang: "en",
            name: "Bouba",
            description: "User has been judged and deemed bouba",
          },
        ],
        adultOnly: false,
      },
    ],
  },
  createdAt: new Date().toISOString(),
} satisfies AppBskyLabelerService.Record;

await agent.app.bsky.labeler.service.delete({
  repo: agent.session!.did,
  rkey: "self",
}).catch(() => null);
await agent.app.bsky.labeler.service.create(
  {
    repo: agent.session!.did,
    rkey: "self",
  },
  config
);

console.log("Done!");
