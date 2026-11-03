# launch

An agent skill that turns shipped features into launch demos. Point an agent at a codebase and it finds what is launchable, writes a one-minute script per feature in the founder's voice, films the B-roll from the real app as filmed end-to-end tests that prove each flow works, gates the launch, and writes the posts. The founder fills in their own stories, records the to-camera lines, and posts.

The voice is built on Farza Majeed's launch playbook: demos, not launches; one plain sentence of what it is; a real, unpolished demo; one honest flaw; "link below".

## Install

Claude Code reads skills from `~/.claude/skills/` (every project) or `<repo>/.claude/skills/` (one project):

```bash
git clone git@github.com:hazlijohar95/launch-demo.git ~/.claude/skills/launch
```

Then run `/launch`, or ask your agent to launch, demo or make a video of your features.

## What filming needs

- Playwright with Chromium, and an existing end-to-end setup the demo specs can reuse.
- ffmpeg with libx264 on the PATH.

The filming tools in `scripts/` are templates: the agent copies them into the repo it is filming. See `references/demo-specs.md`.

## Layout

| Path                        | What it holds                                    |
| --------------------------- | ------------------------------------------------ |
| `SKILL.md`                  | The seven steps, each with its done criteria     |
| `references/voice.md`       | Farza's playbook, distilled, with sources        |
| `references/script.md`      | Segment, cold open, outro and channel templates  |
| `references/demo-specs.md`  | Writing, running and reviewing a filmed e2e test |
| `references/launch-gate.md` | The checks a segment passes before it goes out   |
| `scripts/shoot.ts`          | Takes, scenes, pacing and encoding               |
| `scripts/stage.ts`          | A visible, human-paced cursor and typing         |
| `scripts/stills.mjs`        | Review stills per beat and a duration check      |
