/**
 * Whisper Voice Input — minimal pi plugin
 *
 * /voice  or  Alt+V  →  record  →  Enter to stop  →  transcribe  →  auto-submit
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { spawn, execSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-1";

async function transcribe(audioPath: string): Promise<string> {
	const key = process.env.OPENAI_API_KEY!;
	const boundary = `--B${Date.now()}`;

	// Whisper prompt guides transcription style — fewer fillers, concise
	const whisperPrompt = "Concise technical instruction. No filler words.";

	const field = (name: string, value: string) =>
		`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;

	const body = Buffer.concat([
		Buffer.from(
			`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n`
		),
		await readFile(audioPath),
		Buffer.from(
			`\r\n${field("model", WHISPER_MODEL)}` +
				`${field("response_format", "json")}` +
				`${field("prompt", whisperPrompt)}` +
				`${field("temperature", "0")}` +
				`--${boundary}--\r\n`
		),
	]);

	const res = await fetch(WHISPER_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": `multipart/form-data; boundary=${boundary}`,
		},
		body,
	});

	if (!res.ok) throw new Error(`Whisper API ${res.status}: ${await res.text()}`);
	return ((await res.json()) as { text: string }).text.trim();
}

function toMp3(wav: string, mp3: string): string {
	try {
		execSync(`ffmpeg -y -i "${wav}" -ar 16000 -ac 1 -b:a 64k "${mp3}" 2>/dev/null`, { stdio: "ignore" });
		if (existsSync(mp3)) return mp3;
	} catch {}
	return wav;
}

export default function (pi: ExtensionAPI) {
	async function voice(ctx: any) {
		if (!process.env.OPENAI_API_KEY) {
			ctx.ui.notify("OPENAI_API_KEY not set", "error");
			return;
		}

		const tmp = mkdtempSync(join(tmpdir(), "piv-"));
		const wav = join(tmp, "rec.wav");
		const mp3 = join(tmp, "rec.mp3");

		try {
			// Record
			ctx.ui.setStatus("voice", "● REC (Enter to stop)");
			const rec = spawn("parecord", [
				"--format=s16le", "--rate=16000", "--channels=1", "--file-format=wav", wav,
			], { stdio: "ignore" });

			await ctx.ui.input("● REC - press Enter to stop");
			rec.kill("SIGTERM");
			await new Promise((r) => setTimeout(r, 400));

			if (!existsSync(wav)) {
				ctx.ui.notify("No audio recorded", "error");
				return;
			}

			// Transcribe
			ctx.ui.setStatus("voice", "● Transcribing...");
			const text = await transcribe(toMp3(wav, mp3));

			if (!text) {
				ctx.ui.notify("Empty transcription", "warning");
			} else {
				pi.sendUserMessage(text);
			}
		} catch (e: any) {
			ctx.ui.notify(e.message, "error");
		} finally {
			ctx.ui.setStatus("voice", undefined);
			rmSync(tmp, { recursive: true, force: true });
		}
	}

	pi.registerCommand("voice", {
		description: "Voice -> Whisper -> auto-submit",
		handler: (_, ctx) => voice(ctx),
	});

	pi.registerShortcut("alt+v", {
		description: "Voice input",
		handler: (ctx) => voice(ctx),
	});
}
