#!/usr/bin/env node
// Review a filmed segment: a still from the middle and the end of every beat,
// and each take's video duration against its filmed duration.
//
//   node stills.mjs demo-takes/<segment>

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node stills.mjs demo-takes/<segment>");
  process.exit(2);
}
const { takes, beats } = JSON.parse(
  readFileSync(path.join(dir, "beats.json"), "utf8"),
);
const stills = path.join(dir, "stills");
mkdirSync(stills, { recursive: true });

let drift = false;
for (const [name, take] of Object.entries(takes)) {
  const seconds = Number(
    execFileSync(
      "ffprobe",
      [
        ["-v", "error"],
        ["-show_entries", "format=duration"],
        ["-of", "csv=p=0"],
        path.join(dir, take.video),
      ].flat(),
    ).toString(),
  );
  const off = Math.abs(seconds * 1000 - take.durationMs);
  if (off > 40) drift = true;
  console.log(
    `${name}: video ${seconds.toFixed(2)}s, filmed ${(take.durationMs / 1000).toFixed(2)}s${off > 40 ? "  DRIFT" : ""}`,
  );
}

// The middle of a beat shows the action; its last frame shows the payoff.
beats.forEach((beat, i) => {
  const moments = {
    mid: (beat.startMs + beat.endMs) / 2,
    end: beat.endMs - 100,
  };
  for (const [moment, atMs] of Object.entries(moments)) {
    const file = path.join(
      stills,
      `${String(i + 1).padStart(2, "0")}-${beat.id}-${moment}.jpg`,
    );
    execFileSync(
      "ffmpeg",
      [
        ["-y", "-loglevel", "error", "-ss", (atMs / 1000).toFixed(2)],
        ["-i", path.join(dir, takes[beat.take].video)],
        ["-frames:v", "1", "-vf", "scale=1280:-1", file],
      ].flat(),
    );
    console.log(`${file}  ${beat.take}  "${beat.say}"`);
  }
});

if (drift) process.exit(1);
