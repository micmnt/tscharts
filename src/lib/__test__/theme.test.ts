import { describe, expect, it } from "vitest";
import defaultTheme, { mergeTheme } from "../defaultTheme";

describe("mergeTheme", () => {
	it("senza override ritorna la base invariata", () => {
		expect(mergeTheme(defaultTheme, undefined)).toBe(defaultTheme);
	});

	it("un override di un sotto-campo preserva gli altri campi dello stesso oggetto (deep-merge)", () => {
		const merged = mergeTheme(defaultTheme, { axis: { color: "#ff0000" } });

		expect(merged.axis?.color).toBe("#ff0000");

		expect(merged.axis?.labelColor).toBe(defaultTheme.axis?.labelColor);
		expect(merged.axis?.titleColor).toBe(defaultTheme.axis?.titleColor);
		expect(merged.axis?.size).toBe(defaultTheme.axis?.size);
	});

	it("fonde in profondita' anche tooltip.grid (annidamento a due livelli)", () => {
		const merged = mergeTheme(defaultTheme, {
			tooltip: { grid: { color: "#123456" } },
		});

		expect(merged.tooltip?.grid?.color).toBe("#123456");

		expect(merged.tooltip?.grid?.size).toBe(defaultTheme.tooltip?.grid?.size);
	});

	it("seriesColors viene sostituito in blocco, non concatenato", () => {
		const custom = ["#111111", "#222222"];
		const merged = mergeTheme(defaultTheme, { seriesColors: custom });

		expect(merged.seriesColors).toEqual(custom);
	});

	it("i campi top-level non specificati restano dal default", () => {
		const merged = mergeTheme(defaultTheme, { padding: 40 });

		expect(merged.padding).toBe(40);
		expect(merged.yInterval).toBe(defaultTheme.yInterval);
		expect(merged.line).toEqual(defaultTheme.line);
	});

	it("non muta la base durante il merge", () => {
		const paddingBefore = defaultTheme.padding;
		mergeTheme(defaultTheme, { padding: 999, axis: { color: "#000" } });

		expect(defaultTheme.padding).toBe(paddingBefore);
		expect(defaultTheme.axis?.color).not.toBe("#000");
	});
});

describe("defaultTheme", () => {
	it("e' congelato: una mutazione accidentale non passa (in strict mode lancia)", () => {
		expect(() => {
			// @ts-expect-error - la mutazione e' proprio cio' che verifichiamo
			defaultTheme.padding = 40;
		}).toThrow();
	});

	it("e' congelato anche in profondita' (sotto-oggetti)", () => {
		expect(() => {
			// @ts-expect-error - mutazione volontaria per il test
			defaultTheme.axis.color = "#ffffff";
		}).toThrow();
	});
});
