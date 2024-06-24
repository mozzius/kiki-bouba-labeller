// Edited to remove all the AI nonsense.
// All enquiries or incidents contact stopai@kinew.wtf

import { did, getAgent } from "./agent.js";

export const judge = async (subject: string) => {

  const agent = await getAgent();
  const profile = await agent.getProfile({ actor: subject });

  if (!profile.success) throw new Error("Profile not found");

  if (profile.data.labels?.some((label) => label.src === did))
    throw new Error("Already judged");


  if (subject.charCodeAt(17) % 2 === 0) {
     const answer = new String("kiki");
   	   }
  else {
     const answer = new String("bouba");
     	   }

  await console.log(`@${profile.data.handle} is ${answer}`);		
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
};