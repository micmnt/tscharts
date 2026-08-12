import { describe, expect, it } from "vitest";
import { aggregate, bin, cumulative, movingAverage } from "../../transform";

const P = (date: string, value: number) => ({ date, value });

describe("movingAverage", () => {
	it("media degli ultimi `window` punti (finestra piu' corta all'inizio)", () => {
		const out = movingAverage(
			[P("a", 10), P("b", 20), P("c", 30), P("d", 40)],
			2,
		);
		expect(out.map((p) => p.value)).toEqual([10, 15, 25, 35]);
		expect(out.map((p) => p.date)).toEqual(["a", "b", "c", "d"]);
	});

	it("window <= 1 restituisce i dati invariati (copia)", () => {
		const data = [P("a", 3), P("b", 7)];
		const out = movingAverage(data, 1);
		expect(out).toEqual(data);
		expect(out).not.toBe(data);
	});
});

describe("cumulative", () => {
	it("somma progressiva", () => {
		const out = cumulative([P("a", 5), P("b", 3), P("c", 10)]);
		expect(out.map((p) => p.value)).toEqual([5, 8, 18]);
	});
});

describe("aggregate", () => {
	const data = [
		P("2024-01-05", 10),
		P("2024-01-20", 30),
		P("2024-02-03", 5),
		P("2024-02-28", 15),
	];

	it("raggruppa per chiave (mese) e somma di default", () => {
		const out = aggregate(data, { by: (p) => p.date.slice(0, 7) });
		expect(out).toEqual([
			{ date: "2024-01", value: 40 },
			{ date: "2024-02", value: 20 },
		]);
	});

	it("reduce avg/min/max/count", () => {
		const by = (p: (typeof data)[number]) => p.date.slice(0, 7);
		expect(aggregate(data, { by, reduce: "avg" })[0].value).toBe(20);
		expect(aggregate(data, { by, reduce: "min" })[1].value).toBe(5);
		expect(aggregate(data, { by, reduce: "max" })[0].value).toBe(30);
		expect(aggregate(data, { by, reduce: "count" })[0].value).toBe(2);
	});
});

describe("bin", () => {
	it("size fisso: conta i valori per intervallo, max incluso nell'ultimo", () => {
		const data = [0, 5, 9, 10, 12, 19, 20].map((v, i) => P(String(i), v));
		const out = bin(data, { size: 10 });

		expect(out.map((p) => p.value)).toEqual([3, 3, 1]);
		expect(out[0].date).toBe("0–10");
	});

	it("count: N intervalli equi tra min e max", () => {
		const data = [1, 2, 3, 4, 5, 6, 7, 8].map((v, i) => P(String(i), v));
		const out = bin(data, { count: 2 });
		expect(out.length).toBe(2);

		expect(out.reduce((s, p) => s + p.value, 0)).toBe(8);
	});

	it("dati vuoti -> nessun intervallo", () => {
		expect(bin([], { size: 10 })).toEqual([]);
	});
});
