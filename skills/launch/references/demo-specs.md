# Demo specs

A **demo spec** is a filmed end-to-end test. It drives the real app at human pace, and each **scene** is one screen beat of the script: it rolls the camera, performs the beat, asserts what the viewer sees, holds until the beat's line has been said, and cuts. Everything outside a scene (seeding, setup, waiting on background jobs) never reaches the footage. A passing spec is the proof the video is true; its output is B-roll ready to edit.

## Contents

- Set up once per repo
- Write one
- Run it
- Review it
- Why it is built this way

## Set up once per repo

Requires Playwright with Chromium, and ffmpeg with libx264 on the PATH.

1. Copy all three files in [`scripts/`](../scripts/) (`shoot.ts`, `stage.ts`, `stills.mjs`) into a `tests/demo/` folder beside the repo's e2e specs.
2. Add a `playwright.demo.config.ts` next to the e2e config. It reuses that config, so the app server, stand-ins and fixtures come along, and pipes the servers' output so a server error seen on camera can be traced:

   ```ts
   import { defineConfig } from "@playwright/test";
   import e2e from "./playwright.config";

   export default defineConfig({
     ...e2e,
     testDir: "./tests/demo",
     testMatch: "*.demo.ts",
     fullyParallel: false,
     workers: 1,
     retries: 0,
     timeout: 10 * 60_000,
     reporter: [["list"]],
     use: { ...e2e.use, video: "off", trace: "off" },
     webServer: [e2e.webServer ?? []]
       .flat()
       .map((server) => ({ ...server, stdout: "pipe" as const })),
   });
   ```

3. Add `demo-takes/` to `.gitignore`.

The `*.demo.ts` suffix keeps demo specs out of the CI e2e run and the unit runner. Check both configs' include patterns. Every command below runs from the folder that holds the Playwright config; `demo-takes/` is written there.

## Write one

Read the e2e spec that already covers the flow for its selectors and stand-ins. Build the world through the product, not around it.

```ts
const shoot = new Shoot("03-invite-teammate");
const context = await filmedContext(browser, { baseURL, storageState });
const page = await context.newPage();
const hand = new Hand(page);
const take = await shoot.take("owner", page);

await page.goto("/settings/team"); // off camera
await take.scene(
  "invite",
  "So check this out. I invite my co-founder,",
  async () => {
    await hand.click(page.getByRole("button", { name: "Invite" }));
    await expect(page.getByText("Invitation sent")).toBeVisible();
  },
);

await shoot.wrap(); // encodes every take, writes beats.json
```

- **Screen beats get scenes.** A scene's id is the script beat's id and its `say` is the line. To-camera beats (the founder's face: hook, pain, call to action) get no scene; the founder records them.
- **On camera, use `Hand`.** It moves an eased cursor, presses with a visible ripple, and types at reading speed. Clicking a link or button is a beat like any other. `page.goto` and reloads happen between scenes, so each scene opens on a settled page.
- **Off camera, use plain Playwright calls.** They are fast and never filmed.
- **Assert in every scene** what the beat claims.
- **Pacing is automatic.** A scene holds until its line could be said at 2.5 words a second, so B-roll and voice-over line up. Long lines make long beats; split a line that outruns its action.
- **Seed through the product.** Create the records a beat shows (invoices, runs, payslips) through the UI or the app's own services off camera, so numbers, ledger entries and PDFs are real. Raw inserts suit only background data the camera never reads as a document.
- **Seed a believable world.** Invented local names for the company, people, customers and suppliers. Fixed, readable emails; the app's chrome shows them. Fill every field a document or preview renders (addresses, tax numbers, phone), or the screen shows placeholders. Read column types before seeding (a country column may want a two-letter code). Pick amounts inside every stand-in's limits; a payments fake may hold a fixed balance.
- **A fixed email that must survive reruns:** before creating the user, rename any existing holder of that email out of the way (`UPDATE users SET email = concat('old-', id, '@invalid') WHERE email = ...`). Users the fixture does not delete outlive the run.
- **Two people, two takes.** A flow with a second approver gets a second filmed context logged in as that person, with its own take.
- **Wait for background work off camera**, polling for exactly the condition the next scene asserts. Async states pass through intermediate labels ("Sending" before "With the bank"); a poll on "nothing pending" passes too early.
- **A screen that is stale until reloaded** is a product issue: log it, reload off camera, and film the true state.
- **AI on screen.** Assert the answer or proposal appears, never its words. Those segments need the model credentials in the e2e server's environment.

## Run it

```bash
pnpm exec playwright test -c playwright.demo.config.ts <spec-name>
```

A run builds the app before the first scene, so allow a few minutes. When another agent may already hold the e2e app's port, set the repo's port override (for example `E2E_PORT`) so the run never attaches to someone else's server.

When the shared test database refuses to migrate (a table that already exists, another branch's migration), run against a throwaway Postgres instead of resetting the shared one:

```bash
docker run -d --name demo-takes-pg -p 5471:5432 -e POSTGRES_USER=<user> -e POSTGRES_PASSWORD=<password> -e POSTGRES_DB=<db> postgres:<version>
DATABASE_URL=postgresql://<user>:<password>@localhost:5471/<db> pnpm exec playwright test -c playwright.demo.config.ts
```

Each run replaces `demo-takes/<segment>/` and the failure screenshots under `test-results/`. Copy a take you want to keep, and any failure screenshot that belongs in the friction log, before re-running.

## Review it

```bash
node tests/demo/stills.mjs demo-takes/<segment>
```

It writes two stills per beat to `demo-takes/<segment>/stills/`: `-mid` shows the action, `-end` shows the payoff. It prints each take's video duration against its filmed duration and exits non-zero on drift. Look at every still and hold each to this list:

- The cursor is visible on every action.
- No test identities: worker emails, "E2E", "Test Vendor", placeholder addresses, lorem text.
- Text is sharp; the 2x capture leaves room to zoom in the edit.
- No raw error text, false warnings, empty containers or layout gaps, unless the beat is the flaw.
- The end still of each beat shows the result its line promises.

Fix what the spec controls (data, pacing, timing) and re-run. A product bug the spec cannot remove goes in the friction log with its still, what is wrong, and the one-line fix; when it shows in a beat other than the flaw, the segment is held at the gate until the fix lands.

## Why it is built this way

- Chrome's screencast captures at the page's device scale (1600x900 at 2x films at 3200x1800). Playwright's own video records at a low bitrate and cannot cut between scenes.
- The screencast sends a frame only when the page changes. `shoot.ts` builds a constant 30 fps sequence by linking each output frame to the latest captured frame. Feeding variable-length frames to ffmpeg's concat demuxer stretches the video and drifts the beats.
- Starting the screencast sends the current frame, so a scene opens on the page as it stands.
- Hydration can drop nodes React did not render; the cursor re-attaches itself, and keeps its position across navigations.
