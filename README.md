# pi Extensions

My collection of extensions for [pi](https://github.com/badlogic/pi-mono), the coding agent.

## Extensions

| Extension | Description | Trigger |
|-----------|-------------|---------|
| **whisper-voice** | Voice input via OpenAI Whisper — record, transcribe, auto-submit | `/voice`, `Alt+V` |
| **quick-model-picker** | Cycle through favorite models with one shortcut | `Ctrl+Space` |
| **review** | Code review — PRs, branches, uncommitted changes, specific commits | `/review` |
| **todos** | File-based todo management with claim/release for multi-agent work | `/todo` |
| **answer** | Extract questions from assistant responses and answer interactively | `/answer` |
| **control** | Inter-session communication via Unix sockets | `--session-control` flag |
| **cwd-history** | Seeds editor history with recent prompts from same working directory | Automatic |
| **files** | Lists all files read/written/edited in the session, open in VS Code | `/files` |
| **new-with-name** | Start a new session with a name in one command | `/n my-session` |
| **whimsical** | Fun random working messages while the agent is thinking | Automatic |

## Setup

These live in `~/.pi/agent/extensions/` and are auto-discovered by pi.

```bash
git clone https://github.com/nrupatunga/pi-extensions.git ~/.pi/agent/extensions
```

### whisper-voice

Requires:
- `parecord` (PulseAudio) or `arecord` (ALSA) for recording
- `ffmpeg` for audio conversion
- `OPENAI_API_KEY` environment variable

### control

Start pi with the flag:
```bash
pi --session-control
```

## License

Personal use.
