/**
 * Whisper Voice Input — minimal pi plugin
 *
 * Alt+V → starts recording (blinking dot in status bar)
 * Enter → stops recording → transcribes → auto-submits (with any attachments)
 *
 * Editor is NEVER touched during recording — attachments and text are preserved.
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

type MicInfo = { name: string; description: string };

function getMicInfos(): MicInfo[] {
	try {
		const raw = execSync("pactl list sources", { encoding: "utf8" });
		const lines = raw.split("\n");
		const out: MicInfo[] = [];
		let name = "";
		let description = "";

		const flush = () => {
			if (!name || name.includes("monitor")) {
				name = "";
				description = "";
				return;
			}
			out.push({ name, description: description || name });
			name = "";
			description = "";
		};

		for (const line of lines) {
			const t = line.trim();
			if (t.startsWith("Source #")) {
				flush();
				continue;
			}
			if (t.startsWith("Name:")) {
				name = t.slice("Name:".length).trim();
				continue;
			}
			if (t.startsWith("Description:")) {
				description = t.slice("Description:".length).trim();
				continue;
			}
		}
		flush();
		return out;
	} catch {
		return [];
	}
}

export default function (pi: ExtensionAPI) {
	let recording = false;
	let recProc: ChildProcess | null = null;
	let tmpDir: string | null = null;
	let animTimer: ReturnType<typeof setInterval> | null = null;
	let savedEditorText: string = "";

	// Intercept Enter while recording
	pi.on("input", async (event, ctx) => {
		if (!recording) return { action: "continue" as const };

		// Capture images and original editor text
		const images = event.images?.length ? [...event.images] : null;

		// Stop recording
		recording = false;
		if (animTimer) { clearInterval(animTimer); animTimer = null; }
		recProc?.kill("SIGTERM");
		await new Promise((r) => setTimeout(r, 400));

		const tmp = tmpDir!;
		const wav = join(tmp, "rec.wav");
		const mp3 = join(tmp, "rec.mp3");
		const origText = savedEditorText;
		tmpDir = null;
		recProc = null;
		savedEditorText = "";

		try {
			if (!existsSync(wav)) {
				ctx.ui.notify("No audio recorded", "error");
				return { action: "handled" as const };
			}

			ctx.ui.setStatus("voice", "● Transcribing...");
			const text = await transcribe(toMp3(wav, mp3));

			if (!text) {
				ctx.ui.notify("Empty transcription", "warning");
			} else {
				// Combine: original editor text + transcribed voice
				const fullText = origText ? `${origText} ${text}` : text;

				// Brief flash in editor
				ctx.ui.setEditorText(fullText);
				await new Promise((r) => setTimeout(r, 250));
				ctx.ui.setEditorText("");

				// Submit with images if any
				if (images?.length) {
					const content: any[] = [{ type: "text", text: fullText }];
					content.push(...images);
					pi.sendUserMessage(content);
				} else {
					pi.sendUserMessage(fullText);
				}
			}
		} catch (e: any) {
			ctx.ui.notify(e.message, "error");
		} finally {
			ctx.ui.setStatus("voice", undefined);
			ctx.ui.setStatus("voice-mic", undefined);
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

		// Save whatever text is in the editor
		savedEditorText = (ctx.ui.getEditorText?.() || "").trim();

		tmpDir = mkdtempSync(join(tmpdir(), "piv-"));
		const wav = join(tmpDir, "rec.wav");

		// Pick mic: WHISPER_MIC (exact or substring) > default source > bluetooth source > first source
		const recArgs = ["--format=s16le", "--rate=16000", "--channels=1", "--file-format=wav"];
		try {
			const mics = getMicInfos();
			const inputs = mics.map((m) => m.name);
			const defaultSrc = execSync("pactl get-default-source", { encoding: "utf8" }).trim();
			const envMicRaw = (process.env.WHISPER_MIC || "").trim();
			const envMic = envMicRaw.toLowerCase();

			let device: string | undefined;
			if (envMic) {
				device =
					inputs.find((d) => d === envMicRaw) ||
					inputs.find((d) => d.toLowerCase().includes(envMic)) ||
					mics.find((m) => m.description.toLowerCase().includes(envMic))?.name;
			}

			if (!device && inputs.includes(defaultSrc)) device = defaultSrc;
			if (!device) device = inputs.find((d) => d.includes("bluez_source") || d.includes("bluez_input"));
			if (!device) device = inputs[0];

			if (device) {
				recArgs.unshift(`--device=${device}`);
				const label = mics.find((m) => m.name === device)?.description || device;
				ctx.ui.setStatus("voice-mic", `Mic: ${label}`);
			}
		} catch {}
		recArgs.push(wav);

		recProc = spawn("parecord", recArgs, { stdio: "ignore" });

		recording = true;

		const dots = ["●", "○"];
		let tick = 0;

		if (!savedEditorText) {
			// Empty editor — animate in prompt
			ctx.ui.setEditorText("● REC (Enter to stop)");
			animTimer = setInterval(() => {
				ctx.ui.setEditorText(`${dots[tick % 2]} REC (Enter to stop)`);
				tick++;
			}, 350);
		} else {
			// Has content/attachments — animate in status bar only
			ctx.ui.setStatus("voice", "● REC (Enter to stop)");
			animTimer = setInterval(() => {
				ctx.ui.setStatus("voice", `${dots[tick % 2]} REC (Enter to stop)`);
				tick++;
			}, 350);
		}
	}

	pi.registerCommand("voice", {
		description: "Voice -> Whisper -> auto-submit",
		handler: (_, ctx) => startRecording(ctx),
	});

	pi.registerCommand("voice-mics", {
		description: "Show available microphone names (friendly + internal)",
		handler: (_, ctx) => {
			const mics = getMicInfos();
			if (!mics.length) {
				ctx.ui.notify("No microphones detected", "warning");
				return;
			}
			let def = "";
			try { def = execSync("pactl get-default-source", { encoding: "utf8" }).trim(); } catch {}
			const rows = mics.map((m) => `${m.name === def ? "*" : " "} ${m.description}  [${m.name}]`);
			ctx.ui.notify(`Mics:\n${rows.join("\n")}`, "info");
		},
	});

	pi.registerShortcut("alt+v", {
		description: "Voice input",
		handler: (ctx) => startRecording(ctx),
	});
}
