import { describe, expect, it } from "vitest";
import { paintTexts } from "../canvas/paint";

// Fake context 2D che registra le chiamate (paintTexts non usa Path2D, quindi
// e' testabile in node senza canvas reale).
const recorder = () => {
	const calls: string[] = [];
	const g = {
		calls,
		fillStyle: "",
		font: "",
		textAlign: "" as CanvasTextAlign,
		textBaseline: "" as CanvasTextBaseline,
		save() {
			calls.push("save");
		},
		restore() {
			calls.push("restore");
		},
		translate(x: number, y: number) {
			calls.push(`t:${x},${y}`);
		},
		rotate(a: number) {
			calls.push(`r:${a.toFixed(4)}`);
		},
		fillText(text: string, x: number, y: number) {
			calls.push(`f:${text}@${x},${y}`);
		},
	};
	return g;
};

describe("paintTexts", () => {
	it("senza rotate disegna al punto, niente translate/rotate", () => {
		const g = recorder();
		paintTexts(
			g as unknown as CanvasRenderingContext2D,
			[{ x: 10, y: 20, text: "A" }],
			"#000",
			12,
		);
		expect(g.calls).toContain("f:A@10,20");
		expect(g.calls.some((c) => c.startsWith("t:"))).toBe(false);
		expect(g.calls.some((c) => c.startsWith("r:"))).toBe(false);
	});

	it("con rotate: translate al punto, rotazione, fillText all'origine", () => {
		const g = recorder();
		paintTexts(
			g as unknown as CanvasRenderingContext2D,
			[{ x: 10, y: 20, text: "B", rotate: 45 }],
			"#000",
			12,
		);
		expect(g.calls).toContain("t:10,20");
		expect(g.calls).toContain(`r:${((45 * Math.PI) / 180).toFixed(4)}`);
		expect(g.calls).toContain("f:B@0,0"); // disegnato all'origine traslata
	});

	it("salta il testo vuoto", () => {
		const g = recorder();
		paintTexts(
			g as unknown as CanvasRenderingContext2D,
			[{ x: 0, y: 0, text: "" }],
			"#000",
			12,
		);
		expect(g.calls.some((c) => c.startsWith("f:"))).toBe(false);
	});
});
