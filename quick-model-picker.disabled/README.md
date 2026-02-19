# Quick Model Picker

A pi extension that lets you cycle through your favorite models with a single keyboard shortcut.

## Installation

```bash
git clone <repo-url> ~/.pi/agent/extensions/quick-model-picker
```

Restart pi to load the extension.

## Usage

Press `Ctrl+Space` to cycle through models:

1. **Sonnet** (`claude-sonnet-4-20250514`)
2. **Opus 4.5** (`claude-opus-4-5`)
3. **Haiku** (`claude-haiku-4-5`)
4. **GPT-5.2** (`gpt-5.2` via openai-codex)

All models default to `medium` thinking level.

## Customization

Edit `index.ts` to:
- Add/remove models from the cycle
- Change thinking levels per model
- Change the keyboard shortcut

## Requirements

- [pi coding agent](https://github.com/badlogic/pi-mono)
- API keys for the models you want to use
