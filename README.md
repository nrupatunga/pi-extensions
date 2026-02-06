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

### Option 1: Direct Copy (Recommended)

Simply copy the `quick-model-picker.ts` file directly to your pi extensions folder:

```bash
# Copy the file directly
cp quick-model-picker/quick-model-picker.ts ~/.pi/agent/extensions/

# Restart pi
```

### Option 2: Git Clone

```bash
# Clone directly into pi extensions folder
git clone <your-repo-url> ~/.pi/agent/extensions/quick-model-picker

# Restart pi
```

## Customization

Edit `quick-model-picker/quick-model-picker.ts` to:
- Add/remove models
- Change thinking levels
- Change the shortcut key

## License

MIT
