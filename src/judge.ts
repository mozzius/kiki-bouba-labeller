import { createCanvas, loadImage } from "canvas";
import fs from "node:fs/promises";
import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { did, getAgent } from "./agent.js";
import { AppBskyActorDefs } from "@atproto/api";

export const judge = async (subject: string | AppBskyActorDefs.ProfileView) => {
  const avatar = `avatars/${subject}.png`;

  if (typeof subject === "string") {
    const agent = await getAgent();
    const { data } = await agent.getProfile({ actor: subject });
    if (!data) throw new Error("Profile not found");
    subject = data;
  }

  if (subject.labels && subject.labels.some((label) => label.src === did)) {
    throw new Error(
      "Already " + subject.labels.find((label) => label.src === did)?.val
    );
  }

  if (!subject.avatar) throw new Error("No avatar");

  const image = await loadImage(subject.avatar);
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, 100, 100);
  await fs.writeFile(avatar, canvas.toBuffer());

  generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Is ${subject.displayName || subject.handle} (@${
              subject.handle
            }) kiki or bouba? Bouba = round, soft, and curvy. Kiki = sharp, jagged, and angular.`,
          },
          {
            type: "image",
            image: canvas.toBuffer(),
          },
        ],
      },
    ],
    toolChoice: "required",
    tools: {
      decide: tool({
        parameters: z.object({
          answer: z.union([z.literal("kiki"), z.literal("bouba")]),
        }),
        execute: async ({ answer }) => {
          const agent = await getAgent();
          console.log(`@${subject.handle} is ${answer}`);
          await agent
            .withProxy("atproto_labeler", did)
            .api.tools.ozone.moderation.emitEvent({
              event: {
                $type: "tools.ozone.moderation.defs#modEventLabel",
                createLabelVals: [answer],
                negateLabelVals: [],
              },
              subject: {
                $type: "com.atproto.admin.defs#repoRef",
                did: subject.did,
              },
              createdBy: agent.session!.did,
              createdAt: new Date().toISOString(),
              subjectBlobCids: [],
            })
            .catch((err) => console.error(err.message));
        },
      }),
    },
  });
};

export async function removeLabel(subject: string) {
  const agent = await getAgent();
  const profile = await agent.getProfile({ actor: subject });
  const vals = profile.data?.labels?.filter((label) => label.src === did) ?.map((label) => label.val);
  console.log(`Removing labels from ${subject}:`, vals);
  await agent
    .withProxy("atproto_labeler", did)
    .tools.ozone.moderation.emitEvent({
      event: {
        $type: "tools.ozone.moderation.defs#modEventLabel",
        createLabelVals: [],
        negateLabelVals: vals,
      },
      subject: {
        $type: "com.atproto.admin.defs#repoRef",
        did: subject,
      },
      createdBy: agent.session!.did,
      createdAt: new Date().toISOString(),
      subjectBlobCids: [],
    })
    .catch((err) => console.error(err.message));
}
