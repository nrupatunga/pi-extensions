# My Pi Extensions

Custom extensions for [pi-coding-agent](https://github.com/badlogic/pi-mono).

## Extensions

### quick-model-picker

**Shortcut:** `Ctrl+Q`

Cycles through 4 models instantly:
1. Sonnet (`claude-sonnet-4-20250514`)
2. Opus 4.5 (`claude-opus-4-5`)
3. Haiku (`claude-haiku-4-5`)
4. GPT-5.2 (`openai-codex/gpt-5.2`)

All with `thinking: medium`.

## Installation

```bash
# Clone the repo
git clone <your-repo-url> ~/pi-extensions

# Symlink extension
ln -sf ~/pi-extensions/quick-model-picker ~/.pi/agent/extensions/quick-model-picker

# Restart pi
```

## Customization

Edit `quick-model-picker/index.ts` to:
- Add/remove models
- Change thinking levels
- Change the shortcut key

## License

MIT
