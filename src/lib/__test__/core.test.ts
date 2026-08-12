import { describe, expect, it } from "vitest";
import {
	generateArcBarPath,
	generateDonutSlice,
	generateHorizontalBarPath,
	generatePieSlice,
	generateVerticalBarPath,
	getValuePosition,
	polarToCartesian,
} from "../core";

describe("getValuePosition", () => {
	it("calcola la posizione proporzionale al valore massimo", () => {
		expect(getValuePosition(100, 50, 200)).toBe(100);
	});

	it("ritorna 0 per un valore 0", () => {
		expect(getValuePosition(100, 0, 200)).toBe(0);
	});
});

describe("polarToCartesian", () => {
	it("angolo 0 punta verso l'alto (y negativa rispetto al centro)", () => {
		const p = polarToCartesian(0, 0, 10, 0);
		expect(p.x).toBeCloseTo(0);
		expect(p.y).toBeCloseTo(-10);
	});

	it("angolo 90 punta a destra", () => {
		const p = polarToCartesian(0, 0, 10, 90);
		expect(p.x).toBeCloseTo(10);
		expect(p.y).toBeCloseTo(0);
	});

	it("angolo 180 punta verso il basso", () => {
		const p = polarToCartesian(0, 0, 10, 180);
		expect(p.x).toBeCloseTo(0);
		expect(p.y).toBeCloseTo(10);
	});

	it("angolo 360 torna al punto di partenza (equivalente a 0)", () => {
		const p = polarToCartesian(0, 0, 10, 360);
		expect(p.x).toBeCloseTo(0);
		expect(p.y).toBeCloseTo(-10);
	});

	it("trasla correttamente rispetto a un centro diverso dall'origine", () => {
		const p = polarToCartesian(50, 50, 10, 0);
		expect(p.x).toBeCloseTo(50);
		expect(p.y).toBeCloseTo(40);
	});
});

describe("generateArcBarPath: confine isLargeArc", () => {
	it("un arco di esattamente 180 gradi usa il flag large-arc = 0", () => {
		expect(generateArcBarPath(0, 0, 10, undefined, 0, 180)).toContain(" 0 1 ");
	});

	it("un arco di poco superiore a 180 gradi usa il flag large-arc = 1", () => {
		expect(generateArcBarPath(0, 0, 10, undefined, 0, 180.1)).toContain(
			" 1 1 ",
		);
	});
});

describe("generateArcBarPath: innerRadius", () => {
	it("con innerRadius troncato a 0 NON genera un donut: 0 e' falsy, ricade nel ramo pie", () => {
		const withZero = generateArcBarPath(0, 0, 10, 0, 0, 90);
		const withoutInner = generateArcBarPath(0, 0, 10, undefined, 0, 90);
		expect(withZero).toBe(withoutInner);
	});

	it("con innerRadius > 0 genera un path a due archi (donut)", () => {
		const path = generateArcBarPath(0, 0, 10, 5, 0, 90);
		expect(path).toContain("A 10 10");
		expect(path).toContain("A 5 5");
	});
});

describe("generatePieSlice / generateDonutSlice", () => {
	it("generatePieSlice parte e torna al centro (path chiuso su se stesso)", () => {
		const path = generatePieSlice(50, 50, 20, 0, 90);
		expect(path.startsWith("M 50 50")).toBe(true);
		expect(path.endsWith("L 50 50")).toBe(true);
	});

	it("generateDonutSlice delega a generateArcBarPath con innerRadius", () => {
		expect(generateDonutSlice(50, 50, 20, 10, 0, 90)).toBe(
			generateArcBarPath(50, 50, 20, 10, 0, 90),
		);
	});
});

describe("generateVerticalBarPath", () => {
	it("senza radius genera un rettangolo semplice", () => {
		expect(generateVerticalBarPath(10, 20, 30, 100)).toBe(
			"M 10 100 V 20 H 40 V 100 Z",
		);
	});

	it("con radius e y !== startY genera angoli arrotondati", () => {
		expect(generateVerticalBarPath(10, 20, 30, 100, 8)).toBe(
			"M 10 108 V 28 Q10,20 18,20 H 32 Q40,20 40,28 V 92 Q40,100 32,100 H 18 Q10,100 10,92",
		);
	});

	it("ignora il radius se y === startY (barra a valore zero: nessuna altezza da arrotondare)", () => {
		expect(generateVerticalBarPath(10, 100, 30, 100, 8)).toBe(
			"M 10 100 V 100 H 40 V 100 Z",
		);
	});

	it("un radius maggiore dello spazio disponibile viene dimezzato da normalizeBarRadius", () => {
		expect(generateVerticalBarPath(10, 97, 30, 100, 20)).toBe(
			"M 10 110 V 107 Q10,97 20,97 H 30 Q40,97 40,107 V 90 Q40,100 30,100 H 20 Q10,100 10,90",
		);
	});
});

describe("generateHorizontalBarPath", () => {
	it("senza radius genera un rettangolo semplice", () => {
		expect(generateHorizontalBarPath(20, 40, 30, 10)).toBe(
			"M 10 20 H 40 V 50 H 10 Z",
		);
	});
});
