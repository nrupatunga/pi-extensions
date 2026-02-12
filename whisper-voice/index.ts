/**
 * Whisper Voice Input — minimal pi plugin
 *
 * Alt+V → starts recording (status bar shows blinking dot)
 * Enter → stops recording → transcribes → auto-submits
 * Normal prompt stays untouched.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { spawn, execSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-1";

async function transcribe(audioPath: string): Promise<string> {
	const key = process.env.OPENAI_API_KEY!;
	const boundary = `--B${Date.now()}`;
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
	let recording = false;
	let recProc: ChildProcess | null = null;
	let tmpDir: string | null = null;
	let animTimer: ReturnType<typeof setInterval> | null = null;
	let statusCtx: any = null;

	// Intercept Enter while recording
	pi.on("input", async (event, ctx) => {
		if (!recording) return { action: "continue" as const };

		// Stop recording, handle transcription
		recording = false;
		if (animTimer) { clearInterval(animTimer); animTimer = null; }
		recProc?.kill("SIGTERM");
		await new Promise((r) => setTimeout(r, 400));

		const tmp = tmpDir!;
		const wav = join(tmp, "rec.wav");
		const mp3 = join(tmp, "rec.mp3");
		tmpDir = null;
		recProc = null;

		try {
			if (!existsSync(wav)) {
				ctx.ui.notify("No audio recorded", "error");
				return { action: "handled" as const };
			}

			ctx.ui.setEditorText("● Transcribing...");
			const text = await transcribe(toMp3(wav, mp3));

			if (!text) {
				ctx.ui.notify("Empty transcription", "warning");
			} else {
				// Show in editor first, then submit after a brief pause
				ctx.ui.setEditorText(text);
				await new Promise((r) => setTimeout(r, 250));
				ctx.ui.setEditorText("");
				pi.sendUserMessage(text);
			}
		} catch (e: any) {
			ctx.ui.notify(e.message, "error");
		} finally {
			ctx.ui.setStatus("voice", undefined);
			ctx.ui.setEditorText("");
			rmSync(tmp, { recursive: true, force: true });
		}

		return { action: "handled" as const };
	});

	function startRecording(ctx: any) {
		if (recording) return;
		if (!process.env.OPENAI_API_KEY) {
			ctx.ui.notify("OPENAI_API_KEY not set", "error");
			return;
		}

		statusCtx = ctx;
		tmpDir = mkdtempSync(join(tmpdir(), "piv-"));
		const wav = join(tmpDir, "rec.wav");

		recProc = spawn("parecord", [
			"--format=s16le", "--rate=16000", "--channels=1", "--file-format=wav", wav,
		], { stdio: "ignore" });

		recording = true;

		const dots = ["●", "○"];
		let tick = 0;
		ctx.ui.setEditorText("● REC (Enter to stop)");
		animTimer = setInterval(() => {
			ctx.ui.setEditorText(`${dots[tick % 2]} REC (Enter to stop)`);
			tick++;
		}, 350);
	}

	pi.registerCommand("voice", {
		description: "Start voice recording",
		handler: (_, ctx) => startRecording(ctx),
	});

	pi.registerShortcut("alt+v", {
		description: "Voice input",
		handler: (ctx) => startRecording(ctx),
	});
}
