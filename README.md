# pi Extensions & Skills

My collection of extensions and skills for [pi](https://github.com/badlogic/pi-mono), the coding agent.

## Setup

```bash
git clone https://github.com/nrupatunga/pi-extensions.git ~/pi-extensions
cp -r ~/pi-extensions/extensions/* ~/.pi/agent/extensions/
cp -r ~/pi-extensions/skills/* ~/.pi/agent/skills/
```

---

## Extensions

Live in `~/.pi/agent/extensions/` — auto-discovered and loaded by pi on startup.

| Extension | Description | Trigger |
|-----------|-------------|---------|
| **handoff** | Transfer context to a new focused session with a generated summary prompt | `/handoff <goal>` |
| **modes** | Model/thinking preset manager with named modes, editor label, and ↑/↓ prompt history | `/mode`, `Ctrl+Space`, `Ctrl+Shift+M` |
| **session-query** | Query a previous session file for context, decisions, or file changes | Tool: `session_query` |
| **whisper-voice** | Voice input via OpenAI Whisper — record, transcribe, auto-submit | `/voice`, `Alt+V` |
| **review** | Code review — PRs, branches, uncommitted changes, specific commits | `/review` |
| **todos** | File-based todo management with claim/release for multi-agent work | `/todo` |
| **answer** | Extract questions from assistant responses and answer interactively | `/answer` |
| **control** | Inter-session communication via Unix sockets | `--session-control` flag |
| **files** | Lists all files read/written/edited in the session, open in VS Code | `/files` |
| **new-with-name** | Start a new session with a name in one command | `/n <name>` |
| **go-to-bed** | Late-night guardrail that nudges sleep and gates tool use during quiet hours | Automatic |
| **whimsical** | Fun random working messages while the agent is thinking | Automatic |

### Disabled

| Extension | Reason |
|-----------|--------|
| **cwd-history** | Merged into `modes.ts` — history seeding now happens inside the modes editor |
| **quick-model-picker** | Superseded by `modes.ts` which covers model/thinking switching with persistence |

### Extension Notes

#### handoff
Generates a focused context-transfer prompt and starts a new session. Injects `/skill:session-query` and the parent session path so the new session can recall details on demand.

#### modes
Manages named model+thinking presets stored in `~/.pi/agent/modes.json` (or `.pi/modes.json` per project). Shortcuts:
- `Ctrl+Space` — cycle modes
- `Ctrl+Shift+M` — open mode picker
- `/mode configure` — add/edit/delete modes

Also seeds the prompt editor with ↑/↓ history from previous sessions in the same working directory (ported from `cwd-history`).

#### session-query
Registers a `session_query(sessionPath, question)` tool. Used automatically in handoff-created sessions to recall context from the parent session.

#### whisper-voice
Requires:
- `parecord` (PulseAudio) or `arecord` (ALSA) for recording
- `ffmpeg` for audio conversion
- `OPENAI_API_KEY` environment variable

#### control
Start pi with the flag:
```bash
pi --session-control
```

---

## Skills

Live in `~/.pi/agent/skills/` — loaded via `/skill:<name>` in prompts.

| Skill | Description | Used by |
|-------|-------------|---------|
| **session-query** | Instructions for using the `session_query` tool to look up past sessions | Injected automatically by `handoff.ts` |
| **pi-messenger-crew** | Multi-agent coordination and Crew task orchestration via pi-messenger | Manual: `/skill:pi-messenger-crew` |

### Skill Notes

#### session-query
Companion to the `session-query` extension. Tells the model when and how to call `session_query(sessionPath, question)`. Automatically injected into every handoff-created session via the parent session path line.

#### pi-messenger-crew
Covers joining the mesh, planning from PRDs, working on tasks, file reservations, and agent messaging. Load manually when coordinating multi-agent work.

---

## License

Personal use.
