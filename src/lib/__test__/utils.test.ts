import { describe, expect, it } from "vitest";
import {
	calculateFlatValue,
	getFirstValorizedElementIndex,
	isDefined,
	isFunction,
	normalizeBarRadius,
	trimZerosAndNullLinePath,
} from "../utils";

describe("isDefined", () => {
	it("ritorna true per valori definiti, inclusi i falsy come 0 e stringa vuota", () => {
		expect(isDefined(0)).toBe(true);
		expect(isDefined("")).toBe(true);
	});

	it("ritorna false per null e undefined", () => {
		expect(isDefined(null)).toBe(false);
		expect(isDefined(undefined)).toBe(false);
	});
});

describe("isFunction", () => {
	it("ritorna true per una funzione", () => {
		expect(isFunction(() => {})).toBe(true);
	});

	it("ritorna false per valori non funzione", () => {
		expect(isFunction("stringa")).toBe(false);
		expect(isFunction(42)).toBe(false);
		expect(isFunction(null)).toBe(false);
		expect(isFunction(undefined)).toBe(false);
		expect(isFunction({})).toBe(false);
	});
});

describe("calculateFlatValue", () => {
	it("ritorna 0 per il valore 0", () => {
		expect(calculateFlatValue(0)).toBe(0);
	});

	it("arrotonda per eccesso al multiplo di 10 sotto i due ordini di grandezza", () => {
		expect(calculateFlatValue(5)).toBe(10);
		expect(calculateFlatValue(23)).toBe(30);
		expect(calculateFlatValue(99)).toBe(100);
	});

	it("arrotonda per eccesso all'ordine di grandezza sopra i due ordini", () => {
		expect(calculateFlatValue(100)).toBe(100);
		expect(calculateFlatValue(150)).toBe(200);
		expect(calculateFlatValue(1234)).toBe(2000);
	});

	it("per valori negativi 'arrotonda' verso lo zero (Math.ceil), non in modulo", () => {
		// Comportamento reale della funzione: Math.ceil su un numero negativo
		// arrotonda verso lo zero, non allontana dal valore assoluto.
		expect(calculateFlatValue(-234)).toBe(-200);
	});

	it("valori negativi piccoli possono produrre -0 (Math.ceil(-0.5) === -0 in JS)", () => {
		expect(Object.is(calculateFlatValue(-5), -0)).toBe(true);
	});
});

describe("normalizeBarRadius", () => {
	it("ritorna 0 se radius non e' definito o e' 0", () => {
		expect(normalizeBarRadius(undefined, 100)).toBe(0);
		expect(normalizeBarRadius(0, 100)).toBe(0);
	});

	it("dimezza il radius se lo spazio disponibile e' inferiore alla meta' del radius", () => {
		expect(normalizeBarRadius(10, 3)).toBe(5);
	});

	it("ritorna il radius intero se lo spazio disponibile e' sufficiente (bordo incluso)", () => {
		expect(normalizeBarRadius(10, 5)).toBe(10); // dimension === radius/2: non scatta il dimezzamento
		expect(normalizeBarRadius(10, 10)).toBe(10);
	});
});

describe("getFirstValorizedElementIndex", () => {
	it("ritorna l'indice del primo elemento con value definito", () => {
		const arr = [
			{ date: "a", value: null },
			{ date: "b", value: null },
			{ date: "c", value: 5 },
		];
		expect(getFirstValorizedElementIndex(arr)).toBe(2);
	});

	it("ritorna -1 se nessun elemento ha un value definito", () => {
		const arr = [
			{ date: "a", value: null },
			{ date: "b", value: null },
		];
		expect(getFirstValorizedElementIndex(arr)).toBe(-1);
	});

	it("ritorna -1 per un array vuoto", () => {
		expect(getFirstValorizedElementIndex([])).toBe(-1);
	});
});

describe("trimZerosAndNullLinePath", () => {
	it("non modifica un array senza path vuoti", () => {
		const paths = ["M 0 0", "L 1 1", "L 2 2"];
		expect(trimZerosAndNullLinePath(paths)).toEqual(paths);
	});

	it("converte in 'M' il primo path valido dopo un gap centrale", () => {
		const paths = ["L 0 0", "", "L 1 1"];
		expect(trimZerosAndNullLinePath(paths)).toEqual(["L 0 0", "M 1 1"]);
	});

	it("assorbe un gap iniziale nel primo path valido successivo", () => {
		const paths = ["", "L 1 1", "L 2 2"];
		expect(trimZerosAndNullLinePath(paths)).toEqual(["M 1 1", "L 2 2"]);
	});

	it("lascia un placeholder '*' letterale se il gap e' finale (nessun path valido dopo)", () => {
		// Comportamento attuale, non necessariamente corretto: questo "*" non
		// viene poi filtrato da line.tsx (che scarta solo le stringhe vuote),
		// quindi finirebbe nell'attributo `d` dell'SVG come sintassi non valida.
		const paths = ["L 1 1", "", ""];
		expect(trimZerosAndNullLinePath(paths)).toEqual(["L 1 1", "*"]);
	});
});
