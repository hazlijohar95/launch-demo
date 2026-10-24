/**
 * Filming for demo specs. A shoot is one launch-video segment; each page it
 * films is a take. A take rolls only inside `scene()`: everything between
 * scenes (setup, waiting on a sweep) is cut out of the footage, so a take is
 * B-roll ready to edit, and its beats line up with the script's rows.
 *
 * Frames come from Chrome's screencast at the page's device scale, so a
 * 1600x900 viewport at 2x films at 3200x1800, and ffmpeg encodes them at a
 * constant 30 fps. Playwright's own video records at a low bitrate and cannot
 * cut between scenes.
 */

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  linkSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { CDPSession, Page } from "@playwright/test";

export interface Beat {
  readonly id: string;
  /** The script line spoken over this beat. */
  readonly say: string;
  readonly take: string;
  readonly startMs: number;
  readonly endMs: number;
}

interface Frame {
  readonly file: string;
  readonly atMs: number;
}

/** How long a scene holds on its first and last frame. */
const LEAD_IN_MS = 500;
const HOLD_MS = 900;
/** Speaking pace for a voice-over. */
const WORDS_PER_SECOND = 2.5;
const OUTPUT = { width: 2560, height: 1440, fps: 30 };

/** Segment and take names become directories that are deleted on re-run. */
function slug(kind: string, name: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error(
      `${kind} "${name}" must be lowercase letters, digits and hyphens.`,
    );
  }
  return name;
}

export class Shoot {
  readonly dir: string;
  private readonly takes: Take[] = [];
  private readonly beats: Beat[] = [];

  constructor(readonly segment: string) {
    this.dir = path.resolve(
      process.cwd(),
      "demo-takes",
      slug("Segment", segment),
    );
    rmSync(this.dir, { recursive: true, force: true });
    mkdirSync(this.dir, { recursive: true });
  }

  async take(name: string, page: Page): Promise<Take> {
    slug("Take", name);
    const cdp = await page.context().newCDPSession(page);
    const take = new Take(name, page, cdp, path.join(this.dir, name), (beat) =>
      this.beats.push(beat),
    );
    this.takes.push(take);
    return take;
  }

  /** Encode every take and write `beats.json` beside the videos. */
  async wrap(): Promise<void> {
    const takes: Record<string, { video: string; durationMs: number }> = {};
    for (const take of this.takes) {
      takes[take.name] = await take.encode(this.dir);
    }
    writeFileSync(
      path.join(this.dir, "beats.json"),
      `${JSON.stringify({ segment: this.segment, takes, beats: this.beats }, null, 4)}\n`,
    );
  }
}

export class Take {
  private readonly frames: Frame[] = [];
  private readonly writes: Promise<void>[] = [];
  private rolling = false;
  private filmedMs = 0;
  private rolledAt = 0;
  private frameCount = 0;

  constructor(
    readonly name: string,
    readonly page: Page,
    private readonly cdp: CDPSession,
    private readonly framesDir: string,
    private readonly log: (beat: Beat) => void,
  ) {
    mkdirSync(framesDir, { recursive: true });
    cdp.on("Page.screencastFrame", (event) => {
      void cdp.send("Page.screencastFrameAck", {
        sessionId: event.sessionId,
      });
      if (!this.rolling) return;
      const file = path.join(
        framesDir,
        `${String(this.frameCount++).padStart(6, "0")}.jpg`,
      );
      this.frames.push({ file, atMs: this.now() });
      this.writes.push(writeFile(file, Buffer.from(event.data, "base64")));
    });
  }

  /** Film `action` as one beat of the script. */
  async scene<T>(id: string, say: string, action: () => Promise<T>) {
    await this.roll();
    try {
      const startMs = this.now();
      await this.page.waitForTimeout(LEAD_IN_MS);
      const result = await action();
      // A beat runs at least as long as its line takes to say.
      const words = say.trim().split(/\s+/).length;
      const sayMs = (words / WORDS_PER_SECOND) * 1000;
      await this.page.waitForTimeout(
        Math.max(HOLD_MS, startMs + sayMs - this.now()),
      );
      this.log({ id, say, take: this.name, startMs, endMs: this.now() });
      return result;
    } finally {
      await this.cut();
    }
  }

  /** Encode the take to `<name>.mp4`, its last frame to `<name>.jpg`. */
  async encode(dir: string) {
    const last = this.frames.at(-1);
    if (!last) throw new Error(`Take "${this.name}" filmed no frames.`);
    await Promise.all(this.writes);
    // The screencast sends a frame only when the page changes. Each output
    // frame links the latest screencast frame at its time, so the video
    // runs exactly as long as the take and the beats stay in sync.
    const sequence = path.join(this.framesDir, "sequence");
    mkdirSync(sequence);
    const count = Math.ceil((this.filmedMs * OUTPUT.fps) / 1000);
    let shown = 0;
    for (let i = 0; i < count; i++) {
      const atMs = (i * 1000) / OUTPUT.fps;
      let next = this.frames[shown + 1];
      while (next && next.atMs <= atMs) {
        shown++;
        next = this.frames[shown + 1];
      }
      // Hard links: symlinks need extra privileges on Windows.
      linkSync(
        (this.frames[shown] ?? last).file,
        path.join(sequence, `${String(i).padStart(6, "0")}.jpg`),
      );
    }

    const video = path.join(dir, `${this.name}.mp4`);
    execFileSync(
      "ffmpeg",
      [
        ["-y", "-loglevel", "error"],
        ["-framerate", String(OUTPUT.fps)],
        ["-i", path.join(sequence, "%06d.jpg")],
        [
          "-vf",
          `scale=${OUTPUT.width}:${OUTPUT.height}:flags=lanczos,format=yuv420p`,
        ],
        ["-c:v", "libx264", "-preset", "slow", "-crf", "14"],
        ["-movflags", "+faststart", video],
      ].flat(),
    );
    copyFileSync(last.file, path.join(dir, `${this.name}.jpg`));
    rmSync(this.framesDir, { recursive: true, force: true });
    return { video: path.basename(video), durationMs: this.filmedMs };
  }

  private now() {
    return this.rolling
      ? this.filmedMs + (Date.now() - this.rolledAt)
      : this.filmedMs;
  }

  private async roll() {
    const viewport = this.page.viewportSize();
    if (!viewport) throw new Error("A filmed page needs a fixed viewport.");
    const scale = await this.page.evaluate(() => window.devicePixelRatio);
    this.rolledAt = Date.now();
    this.rolling = true;
    // Starting the screencast sends the current frame, so a scene opens
    // on the page as it stands, not on the last frame of the scene before.
    await this.cdp.send("Page.startScreencast", {
      format: "jpeg",
      quality: 92,
      maxWidth: viewport.width * scale,
      maxHeight: viewport.height * scale,
      everyNthFrame: 1,
    });
  }

  private async cut() {
    await this.cdp.send("Page.stopScreencast");
    this.filmedMs += Date.now() - this.rolledAt;
    this.rolling = false;
  }
}
