import { describe, expect, it } from "vitest";
import { getSeriesMissingYAxis } from "../core";

const bar = (name: string, axisName?: string) => ({
	name,
	type: "bar" as const,
	axisName,
	data: [],
});
const line = (name: string, axisName?: string) => ({
	name,
	type: "line" as const,
	axisName,
	data: [],
});
const pie = (name: string) => ({ name, type: "pie" as const, data: [] });

describe("getSeriesMissingYAxis", () => {
	it("segnala una serie la cui chiave d'asse non corrisponde a nessun asse Y", () => {
		// asse Y "vendite"; la line "obiettivo" (senza axisName) punta a
		// "obiettivo" -> nessun asse -> segnalata.
		const elements = [bar("vendite"), line("obiettivo")];
		const missing = getSeriesMissingYAxis(elements, ["vendite"]);
		expect(missing.map((s) => s.name)).toEqual(["obiettivo"]);
	});

	it("non segnala se la serie ha axisName che punta a un asse esistente", () => {
		const elements = [bar("vendite"), line("obiettivo", "vendite")];
		expect(getSeriesMissingYAxis(elements, ["vendite"])).toEqual([]);
	});

	it("non segnala se il name della serie coincide con un asse", () => {
		const elements = [bar("vendite"), line("temperatura")];
		expect(getSeriesMissingYAxis(elements, ["vendite", "temperatura"])).toEqual(
			[],
		);
	});

	it("ignora le serie non time-serie (pie/donut/angle-donut)", () => {
		const elements = [pie("fette"), bar("vendite")];
		expect(getSeriesMissingYAxis(elements, ["vendite"])).toEqual([]);
	});

	it("non segnala nulla se non ci sono assi Y (grafico volutamente senza assi)", () => {
		const elements = [bar("vendite"), line("obiettivo")];
		expect(getSeriesMissingYAxis(elements, [])).toEqual([]);
	});

	it("ignora group-bar e bar-stacked (scala aggregata, il name non e' una chiave d'asse)", () => {
		const groupA = { name: "prodotto A", type: "group-bar" as const, data: [] };
		const groupB = { name: "prodotto B", type: "group-bar" as const, data: [] };
		const stacked = { name: "st1", type: "bar-stacked" as const, data: [] };
		// asse Y "vendite": i name delle group-bar/stacked NON corrispondono, ma
		// non vanno segnalati (falso positivo evitato).
		expect(
			getSeriesMissingYAxis([groupA, groupB, stacked], ["vendite"]),
		).toEqual([]);
	});

	it("segnala piu' serie problematiche insieme", () => {
		const elements = [bar("a"), line("b"), bar("c", "a")];
		// asse Y solo "a": "b" (chiave b) manca; "c" (axisName a) ok; "a" ok
		const missing = getSeriesMissingYAxis(elements, ["a"]);
		expect(missing.map((s) => s.name)).toEqual(["b"]);
	});
});
