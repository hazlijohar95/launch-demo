# Script templates

One segment per feature. Segments stand alone as shorts and join into one long video: for the long cut, drop each segment's opener and keep the rest.

## Segment

```markdown
### <n>. <Feature, in the user's words> (~<seconds>s)

| Beat | Kind      | On screen                                  | You say                                                              |
| ---- | --------- | ------------------------------------------ | -------------------------------------------------------------------- |
| hook | screen    | <route, the first frame>                   | This is <feature> in <product>.                                      |
| pain | to camera | Face                                       | [Your line: <the founder's own moment with this pain, one sentence>] |
| <id> | screen    | <exact UI action, labels as in the source> | So check this out. <plain narration>                                 |
| <id> | screen    | <next action, harder than the last>        | <narration>                                                          |
| flaw | screen    | <the thing that is slow, limited or wrong> | <one honest line, then move on>                                      |
| cta  | to camera | Face, then end card                        | <3–4 word tagline>. Link below.                                      |
```

- A screen beat's id is its scene id in the demo spec. Keep them identical. To-camera beats have no scene.
- Every label in "On screen" is copied from a component rendered on that route, in quotes when it is button or status text.
- A screen beat's line is what the footage can carry: at 2.5 words a second, a 25-word line needs 10 seconds of action. Split a line that outruns its beat.
- The flaw beat is real: a region limit, a slow step, a raw error, a manual setup step. Draft it from the code and the do-not-demo list; after review, replace it with the truest entry in the friction log.
- When the AI answers on screen, the "You say" cell reads `(read its real answer, react in one line)`. AI output is never scripted.

## Cold open (long cut only)

```markdown
| On screen                                        | You say                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| <the strongest single moment, already happening> | (silent, then one reaction)                                                           |
| Face, close up                                   | Hey everyone, I'm <founder>, and I'm building <product>. [What's going on, one line.] |
| Face                                             | <product> <does what, for whom, one sentence>.                                        |
| Screen                                           | So here are <n> things we shipped. Let me show you.                                   |
```

## Outro

```markdown
| On screen | You say                                                                           |
| --------- | --------------------------------------------------------------------------------- |
| Changelog | That's <n>. Some shipped this week. Some are rough, and we'll fix them in public. |
| Face      | We ship every week. If you <who it's for>, give it a shot. Link below.            |
```

## Channel variants

- **Instagram, TikTok:** vertical, captions burned in, and a niche call-out before the hook: "Running a <niche>? Stop right there."
- **YouTube:** the long cut, plus each segment as a short. Chapters at each segment.
- **X, LinkedIn:** 16:9, the post format from voice.md, the video attached natively.

## Recording notes to include in the kit

- The bracketed lines, listed together, so the founder fills them in one sitting.
- Prep each segment needs: accounts, second users, sandbox credentials, data.
- The release order, strongest unannounced feature first.
