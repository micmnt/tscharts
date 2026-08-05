import type { JSX } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computeGlobalConfig } from "../globalConfig";

// computeGlobalConfig legge solo child.props.config: costruisco dei finti
// JSX.Element con la forma minima necessaria, senza dover renderizzare nulla.
const child = (config: unknown): JSX.Element =>
	({ props: { config } }) as unknown as JSX.Element;

afterEach(() => {
	vi.restoreAllMocks();
});

describe("computeGlobalConfig", () => {
	it("estrae solo le 6 chiavi del canale trasversale, ignorando le altre", () => {
		const fn = () => {};
		const result = computeGlobalConfig([
			child({
				barWidth: 12,
				barGroupGap: 4,
				barOffset: 2,
				selectedColor: "#fff",
				selectedValue: "14/03",
				barClickAction: fn,
				// chiavi NON del canale trasversale: devono essere ignorate
				radius: 8,
				labelSize: 11,
				labelColor: "white",
			}),
		]);

		expect(result).toEqual({
			barWidth: 12,
			barGroupGap: 4,
			barOffset: 2,
			selectedColor: "#fff",
			selectedValue: "14/03",
			barClickAction: fn,
		});
	});

	it("fonde le chiavi provenienti da piu' children", () => {
		const result = computeGlobalConfig([
			child({ barWidth: 12 }),
			child({ barGroupGap: 4 }),
			child(undefined),
		]);

		expect(result).toEqual({ barWidth: 12, barGroupGap: 4 });
	});

	it("children senza config (o senza props) danno un oggetto vuoto senza crashare", () => {
		expect(computeGlobalConfig([])).toEqual({});
		expect(computeGlobalConfig([child(undefined)])).toEqual({});
		expect(computeGlobalConfig([{} as JSX.Element])).toEqual({});
	});

	it("avvisa (warnDev) quando due componenti impostano la stessa chiave PRIMITIVA con valori diversi", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = computeGlobalConfig([
			child({ barWidth: 10 }),
			child({ barWidth: 30 }),
		]);

		// vince l'ultimo (comportamento invariato)...
		expect(result.barWidth).toBe(30);
		// ...ma ora c'e' un avviso in dev
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0]?.[0]).toContain("barWidth");
	});

	it("NON avvisa se la stessa chiave e' impostata con lo stesso valore", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		computeGlobalConfig([child({ barWidth: 20 }), child({ barWidth: 20 })]);

		expect(warn).not.toHaveBeenCalled();
	});

	it("NON avvisa sulle collisioni di barClickAction (le funzioni collidono per reference, non per intento)", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = computeGlobalConfig([
			child({ barClickAction: () => {} }),
			child({ barClickAction: () => {} }),
		]);

		expect(typeof result.barClickAction).toBe("function");
		expect(warn).not.toHaveBeenCalled();
	});
});
