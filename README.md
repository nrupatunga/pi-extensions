# My Pi Extensions

Custom extensions and prompt templates for [pi-coding-agent](https://github.com/badlogic/pi-mono).

## Extensions

### quick-model-picker

**Shortcut:** `Ctrl+Q`

Cycles through 4 models instantly:
1. Sonnet (`claude-sonnet-4-20250514`)
2. Opus 4.5 (`claude-opus-4-5`)
3. Haiku (`claude-haiku-4-5`)
4. GPT-5.2 (`openai-codex/gpt-5.2`)

All with `thinking: medium`.

## Prompt Templates

Slash commands to quickly switch models:

| Command | Model |
|---------|-------|
| `/m1` | Claude Sonnet |
| `/m2` | Claude Haiku |
| `/m3` | GPT-5.2 (OpenAI Codex) |

## Installation

```bash
# Clone the repo
git clone <your-repo-url> ~/pi-extensions

# Symlink extensions
ln -sf ~/pi-extensions/quick-model-picker ~/.pi/agent/extensions/quick-model-picker

# Symlink prompts
ln -sf ~/pi-extensions/prompts/*.md ~/.pi/agent/prompts/

# Restart pi
```

## Customization

Edit `quick-model-picker/index.ts` to:
- Add/remove models
- Change thinking levels
- Change the shortcut key

## License

MIT
