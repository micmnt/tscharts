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
		// le chiavi di layout sul config sono deprecate (M1): silenzio il warnDev.
		vi.spyOn(console, "warn").mockImplementation(() => {});
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
		vi.spyOn(console, "warn").mockImplementation(() => {});
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

	// tutte le chiavi primitive sono ormai deprecate (M1/M2): il config emette
	// anche il warn di deprecation, quindi verifico il messaggio di COLLISIONE
	// per contenuto ("sovrascritto") invece di contare le chiamate.
	const collisionWarns = (warn: ReturnType<typeof vi.spyOn>) =>
		warn.mock.calls.filter((c) => String(c[0]).includes("sovrascritto"));

	it("avvisa (warnDev) quando due componenti impostano la stessa chiave PRIMITIVA con valori diversi", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = computeGlobalConfig([
			child({ selectedColor: "#f00" }),
			child({ selectedColor: "#00f" }),
		]);

		// vince l'ultimo (comportamento invariato)...
		expect(result.selectedColor).toBe("#00f");
		// ...ed esiste esattamente un avviso di collisione, che cita la chiave
		const collisions = collisionWarns(warn);
		expect(collisions).toHaveLength(1);
		expect(collisions[0]?.[0]).toContain("selectedColor");
	});

	it("NON avvisa di COLLISIONE se la stessa chiave e' impostata con lo stesso valore", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		computeGlobalConfig([
			child({ selectedColor: "#f00" }),
			child({ selectedColor: "#f00" }),
		]);

		expect(collisionWarns(warn)).toHaveLength(0);
	});

	// --- M1: layout config promossa a props di <Chart> ---

	it("avvisa (deprecation) quando una chiave di layout arriva dal config della serie", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = computeGlobalConfig([child({ barWidth: 20 })]);

		// resta funzionante (retrocompat)...
		expect(result.barWidth).toBe(20);
		// ...ma avvisa che e' deprecato
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0]?.[0]).toContain("deprecato");
	});

	it("le props di layout di <Chart> hanno precedenza sul config deprecato dei children", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = computeGlobalConfig([child({ barWidth: 20 })], {
			barWidth: 40,
		});

		expect(result.barWidth).toBe(40);
	});

	it("layoutConfig da solo (API nuova) non genera warn di deprecation", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = computeGlobalConfig([child(undefined)], {
			barWidth: 40,
			barGroupGap: 8,
			barOffset: 2,
		});

		expect(result).toEqual({ barWidth: 40, barGroupGap: 8, barOffset: 2 });
		expect(warn).not.toHaveBeenCalled();
	});

	it("layoutConfig ignora le chiavi undefined (non sovrascrive con undefined)", () => {
		const result = computeGlobalConfig([], {
			barWidth: undefined,
			barGroupGap: undefined,
			barOffset: undefined,
		});

		expect(result).toEqual({});
	});

	// --- M2: selezione promossa a props di <Axis> ---

	it("avvisa (deprecation -> <Axis>) per selectedValue/selectedColor dal config", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = computeGlobalConfig([
			child({ selectedValue: "14/03", selectedColor: "#f00" }),
		]);

		// restano funzionanti (fallback deprecato)...
		expect(result).toEqual({ selectedValue: "14/03", selectedColor: "#f00" });
		// ...e ognuna avvisa indicando <Axis>
		const deprecations = warn.mock.calls.filter((c) =>
			String(c[0]).includes("<Axis>"),
		);
		expect(deprecations).toHaveLength(2);
	});

	it("NON avvisa (deprecation) per barClickAction: dual-use, rimandato a M4", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		computeGlobalConfig([child({ barClickAction: () => {} })]);

		expect(
			warn.mock.calls.some((c) => String(c[0]).includes("deprecato")),
		).toBe(false);
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
