---
name: launch-demo
description: Turn shipped features into launch demos, end to end. Finds what is launchable in the codebase, writes the script in a founder's own voice (built on Farza Majeed's playbook), films the B-roll from the real app as filmed e2e tests that prove each flow works, gates the launch, and writes the posts. Use when asked to launch, demo, announce or make a video of features, or to script, film or record B-roll of a product.
---

# Launch demo

A **demo** is a small launch: one feature, one minute, one story, shown working. This skill takes a codebase from "we shipped things" to a launch kit the founder records and posts: the feature table, the script, filmed B-roll that proves every flow, the launch gate, and the posts.

The voice comes from [references/voice.md](references/voice.md). Read it before writing a word of script or post copy.

## Rules that hold in every step

- **Proof before claims.** A feature goes in a video only when its demo spec passes. A number goes in only when you read it from a source you can cite. Unverified means it stays out.
- **The founder's life is theirs to tell.** Write every personal story, every "I" line about the founder's past, as a `[bracketed]` slot with an example. Fill product facts yourself; leave lived experience to them.
- **The founder posts.** Prepare everything up to the post. Publishing, scheduling and messaging people stay with the human.
- **Log, then move on.** A product bug found while filming goes in the friction log with a still and a one-line fix. Fix it only when asked.

## Steps

### 1. Inventory

Find what is shipped and launchable. Read, in this order: release notes and changelog sources, unreleased change entries, the route tree, end-to-end specs, feature flags and capability gates. For every candidate record its route, the e2e spec that covers it, its flag state, whether a changelog has announced it, and where a new user would find it in the navigation.

Done when every candidate has all five filled, and a separate do-not-demo list names each flagged-off, half-built or stubbed feature with the file that proves it. Unannounced, finished features rank first: they are the strongest launches.

### 2. Script

Write one segment per feature with the templates in [references/script.md](references/script.md). Each segment is a beats table, 45 to 75 seconds, following the formula in voice.md. Mark each beat as a screen beat (it gets a scene) or a to-camera beat (the founder records it). Draft the flaw beat from the code and the do-not-demo list; step 4 replaces it with what filming shows.

Done when each segment has a hook, a pain slot, a demo of two to four escalating screen beats, a drafted flaw, and a call to action, and every on-screen label greps to a component rendered on that beat's route.

### 3. Film

Turn each segment's screen beats into a **demo spec**: a filmed e2e test where each scene is one beat, asserts what it shows, and holds for its line; everything between scenes is cut. Follow [references/demo-specs.md](references/demo-specs.md); the tooling is in [scripts/](scripts/).

Done when the spec passes and writes `<take>.mp4` and `beats.json` for the segment, with one scene per screen beat and matching ids.

### 4. Review the footage

Run the stills script on the segment (demo-specs.md, "Review it") and look at every still it writes, mid and end. Hold each to the review list there. Fix what the spec controls and re-run. Then revise the script against the footage: replace the drafted flaw with the truest one the friction log holds, and adjust any line the footage contradicts.

Done when every still has been viewed and passes, or shows a product bug that is in the friction log and marks the segment for holding at the gate; the durations match; and the script matches the footage.

### 5. Gate

Run every check in [references/launch-gate.md](references/launch-gate.md) for each segment. A segment that fails a check is held, with the failing check and its fix named.

Done when each segment is marked ready or held, with evidence for every check.

### 6. Kit

Write the launch kit to the folder the user names, by default `launch/<yyyy-mm-dd>/`:

1. `features.md` with the inventory table and the do-not-demo list.
2. `script.md` with the cold open, every segment, and the outro.
3. `gate.md` with each segment's status and the friction log, stills linked.
4. `posts.md` with per-channel post copy, the niche call-out variant, and a release order (strongest ready feature first, one post a day or two).
5. A footage index: each segment's `demo-takes/` path, takes and beats. The footage stays where the demo config writes it.

Done when every file exists, every ready segment has footage, script and posts, and the reply lists what the founder still does: fill the bracketed lines, record the to-camera beats, make the end cards in the edit, and post.

### 7. After launch

When asked how a launch went, report signups per tracked link, not views. When a filmed screen changes, re-run its demo spec so the footage matches what users see.
