import { createCanvas, loadImage } from "canvas";
import fs from "node:fs/promises";
import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { did, getAgent } from "./agent.js";

export const judge = async (subject: string) => {
  const avatar = `avatars/${subject}.png`;

  // skip if avatar already exists
  if (await fs.stat(avatar).catch(() => null))
    throw new Error("Avatar already judged");

  const agent = await getAgent();
  const profile = await agent.getProfile({ actor: subject });

  if (!profile.success) throw new Error("Profile not found");

  if (profile.data.labels?.some((label) => label.src === did))
    throw new Error("Already judged");

  if (!profile.data.avatar) throw new Error("No avatar");

  const image = await loadImage(profile.data.avatar);
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, 100, 100);
  await fs.writeFile(avatar, canvas.toBuffer());

  await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Is ${profile.data.displayName || profile.data.handle} (@${
              profile.data.handle
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
          console.log(`@${profile.data.handle} is ${answer}`);
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
                did: subject,
              },
              createdBy: agent.session!.did,
              createdAt: new Date().toISOString(),
              subjectBlobCids: [],
            });
        },
      }),
    },
  });
};
