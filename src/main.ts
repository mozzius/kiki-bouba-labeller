import { AppBskyEmbedExternal, AppBskyEmbedVideo } from "@atproto/api";

import { Jetstream } from "@skyware/jetstream";


const jetstream = new Jetstream({
  wantedCollections: [ 'app.bsky.feed.post'],

});

jetstream.on("error", (err) => console.error(err));




let video = 0
let gif = 0

setInterval(() => {
  console.log(`Videos: ${video}, Gifs: ${gif}`);
}, 5000)

jetstream.onCreate("app.bsky.feed.post", (op) => {
  const embed = op.commit.record.embed
  if (AppBskyEmbedVideo.isMain(embed)) {
    video++
  } else if (AppBskyEmbedExternal.isMain(embed)) {
    if (embed.external.uri.includes('media.tenor.com') && embed.external.uri.includes('hh=') && embed.external.uri.includes('ww=')) {
      gif++
    }
  }

})

jetstream.start();
