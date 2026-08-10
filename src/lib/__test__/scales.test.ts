import { describe, expect, it } from "vitest";
import { getValuePosition } from "../core/primitives";
import {
	computeWheelZoom,
	createBandScale,
	createLinearScale,
	createTimeScale,
	getChartTimeScale,
	getChartYScale,
} from "../core/scales";

describe("createBandScale", () => {
	it("position riproduce step*index + (start + firstOffset)", () => {
		const s = createBandScale({
			start: 100,
			end: 500,
			count: 4,
			firstOffset: 10,
		});
		expect(s.step).toBe(100); // (500-100)/4
		expect(s.base).toBe(110); // 100 + 10
		expect(s.position(0)).toBe(110);
		expect(s.position(1)).toBe(210);
		expect(s.position(3)).toBe(410);
	});

	it("firstOffset di default e' 0", () => {
		const s = createBandScale({ start: 0, end: 300, count: 3 });
		expect(s.base).toBe(0);
		expect(s.position(2)).toBe(200);
	});

	it("invert e' l'inverso di position (round al centro)", () => {
		const s = createBandScale({
			start: 100,
			end: 500,
			count: 4,
			firstOffset: 10,
		});
		// esattamente sul centro
		expect(s.invert(210)).toBe(1);
		// entro mezza cella -> stesso indice
		expect(s.invert(210 + 49)).toBe(1);
		expect(s.invert(210 - 49)).toBe(1);
		// oltre mezza cella -> indice adiacente
		expect(s.invert(210 + 51)).toBe(2);
	});

	it("position e invert sono coerenti su ogni indice", () => {
		const s = createBandScale({
			start: 37,
			end: 613,
			count: 7,
			firstOffset: 12.5,
		});
		for (let i = 0; i < 7; i++) {
			expect(s.invert(s.position(i))).toBe(i);
		}
	});

	it("count 0 non divide per zero (step finito)", () => {
		const s = createBandScale({ start: 0, end: 400, count: 0 });
		expect(Number.isFinite(s.step)).toBe(true);
		expect(s.step).toBe(400); // (400-0)/(0||1)
	});
});

describe("createTimeScale", () => {
	// dominio: 0 -> 1000 ms; range: 100 -> 500 px
	const s = createTimeScale({ domain: [0, 1000], range: [100, 500] });

	it("position mappa linearmente dominio -> range", () => {
		expect(s.position(0)).toBe(100); // estremo sinistro
		expect(s.position(1000)).toBe(500); // estremo destro
		expect(s.position(500)).toBe(300); // metà tempo -> metà range
		expect(s.position(250)).toBe(200); // proporzionale
	});

	it("invert è l'inverso di position", () => {
		for (const t of [0, 137, 500, 999, 1000]) {
			expect(s.invert(s.position(t))).toBeCloseTo(t, 9);
		}
	});

	it("spaziatura proporzionale al tempo, non all'indice (il punto chiave)", () => {
		// tre istanti a campionamento IRREGOLARE: 0, 900, 1000
		const xs = [0, 900, 1000].map((t) => s.position(t));
		// il gap 0->900 (grande) deve essere molto più largo del gap 900->1000
		const gap1 = xs[1] - xs[0];
		const gap2 = xs[2] - xs[1];
		expect(gap1).toBeCloseTo(360, 9); // 900/1000 * 400
		expect(gap2).toBeCloseTo(40, 9); // 100/1000 * 400
		expect(gap1).toBeGreaterThan(gap2 * 5);
	});

	it("ticks: N istanti equispaziati con estremi inclusi", () => {
		expect(s.ticks(5)).toEqual([0, 250, 500, 750, 1000]);
		expect(s.ticks(2)).toEqual([0, 1000]);
		expect(s.ticks(1)).toEqual([0]);
	});

	it("dominio degenere (date uguali) non divide per zero", () => {
		const d = createTimeScale({ domain: [500, 500], range: [0, 400] });
		expect(Number.isFinite(d.position(500))).toBe(true);
		expect(d.position(500)).toBe(0); // span=1 -> tutto su r0
	});
});

describe("getChartTimeScale", () => {
	it("costruisce range [chartXStart+padding, chartXEnd-padding] dal timeDomain", () => {
		const scale = getChartTimeScale({
			timeDomain: [0, 100],
			chartXStart: 50,
			chartXEnd: 450,
			padding: 20,
		});
		expect(scale).not.toBeNull();
		expect(scale?.position(0)).toBe(70); // 50 + 20
		expect(scale?.position(100)).toBe(430); // 450 - 20
	});

	it("ritorna null senza timeDomain (scaleType != time)", () => {
		expect(
			getChartTimeScale({ chartXStart: 0, chartXEnd: 400, padding: 20 }),
		).toBeNull();
	});
});

describe("createLinearScale", () => {
	const s = createLinearScale({ domain: [0, 200], range: [400, 20] });

	it("scale mappa linearmente dominio -> range (invertito per l'asse Y)", () => {
		expect(s.scale(0)).toBe(400); // base in basso
		expect(s.scale(200)).toBe(20); // max in alto
		expect(s.scale(100)).toBe(210); // metà
	});

	it("invert è l'inverso di scale", () => {
		for (const v of [0, 37, 100, 199, 200]) {
			expect(s.invert(s.scale(v))).toBeCloseTo(v, 9);
		}
	});

	it("ticks: N valori equispaziati con estremi inclusi", () => {
		expect(s.ticks(5)).toEqual([0, 50, 100, 150, 200]);
	});

	it("createTimeScale delega a createLinearScale (position === scale)", () => {
		const t = createTimeScale({ domain: [0, 1000], range: [100, 500] });
		const l = createLinearScale({ domain: [0, 1000], range: [100, 500] });
		for (const v of [0, 250, 613, 1000]) {
			expect(t.position(v)).toBe(l.scale(v));
		}
	});
});

describe("getChartYScale", () => {
	const chartYEnd = 360;
	const padding = 20;

	it("con min=0 è byte-identica al posizionamento storico (getValuePosition)", () => {
		const max = 250;
		const y = getChartYScale({ max, chartYEnd, padding });
		for (const v of [0, 12.5, 120, 187.4, 250]) {
			const legacy = chartYEnd - getValuePosition(max, v, chartYEnd - padding);
			expect(y.scale(v)).toBe(legacy); // uguaglianza ESATTA, non approssimata
		}
	});

	it("min/max custom restringono il dominio (S1b-B)", () => {
		const y = getChartYScale({ min: 98, max: 102, chartYEnd, padding });
		expect(y.scale(98)).toBe(chartYEnd); // base del dominio in basso
		expect(y.scale(102)).toBe(padding); // top del dominio in alto
		expect(y.scale(100)).toBeCloseTo((chartYEnd + padding) / 2, 6); // metà
	});

	it("clampa i valori fuori dominio ai bordi", () => {
		const y = getChartYScale({ min: 0, max: 100, chartYEnd, padding });
		expect(y.scale(150)).toBe(y.scale(100)); // sopra max -> bordo alto
		expect(y.scale(-30)).toBe(y.scale(0)); // sotto min -> bordo basso
	});

	it("invert è l'inverso di scale (entro il dominio)", () => {
		const y = getChartYScale({ min: 10, max: 90, chartYEnd, padding });
		for (const v of [10, 33, 60, 90]) {
			expect(y.invert(y.scale(v))).toBeCloseTo(v, 6);
		}
	});
});

describe("computeWheelZoom", () => {
	const base = [0, 100] as const;

	it("zoom in (deltaY < 0) restringe il dominio attorno al valore", () => {
		const [min, max] = computeWheelZoom({
			domain: [0, 100],
			baseDomain: base,
			value: 50,
			deltaY: -100,
		});
		expect(max - min).toBeLessThan(100); // span ridotto
		expect(min).toBeLessThan(50);
		expect(max).toBeGreaterThan(50); // 50 resta dentro
	});

	it("zoom out (deltaY > 0) allarga, clampato al baseSpan", () => {
		// parto gia' stretto e zoomo out oltre il base -> torna al base
		const [min, max] = computeWheelZoom({
			domain: [40, 60],
			baseDomain: base,
			value: 50,
			deltaY: 100000, // enorme -> span vorrebbe superare il base
		});
		expect(min).toBeCloseTo(0, 6);
		expect(max).toBeCloseTo(100, 6); // clampato al dominio base pieno
	});

	it("clampa lo span minimo (max zoom-in)", () => {
		const [min, max] = computeWheelZoom({
			domain: [0, 100],
			baseDomain: base,
			value: 50,
			deltaY: -100000, // zoom-in enorme
			minSpanRatio: 0.02,
		});
		expect(max - min).toBeCloseTo(2, 6); // 2% di 100
	});

	it("ancora il valore sotto il cursore alla stessa frazione (zoom focale)", () => {
		// value al 25% del dominio [0,100] -> resta al 25% del nuovo dominio
		const [min, max] = computeWheelZoom({
			domain: [0, 100],
			baseDomain: base,
			value: 25,
			deltaY: -100,
		});
		expect((25 - min) / (max - min)).toBeCloseTo(0.25, 6);
	});

	it("non pana fuori dal dominio base (clamp ai bordi)", () => {
		// valore vicino al bordo alto: il nuovo dominio non supera baseMax
		const [min, max] = computeWheelZoom({
			domain: [0, 100],
			baseDomain: base,
			value: 98,
			deltaY: -100,
		});
		expect(max).toBeLessThanOrEqual(100 + 1e-9);
		expect(min).toBeGreaterThanOrEqual(-1e-9);
	});

	it("zoomStep piu' alto = zoom piu' aggressivo (span cambia di piu')", () => {
		const args = {
			domain: [0, 100] as const,
			baseDomain: base,
			value: 50,
			deltaY: -100, // una tacca in zoom-in
		};
		const soft = computeWheelZoom({ ...args, zoomStep: 1.05 });
		const hard = computeWheelZoom({ ...args, zoomStep: 1.5 });
		const softSpan = soft[1] - soft[0];
		const hardSpan = hard[1] - hard[0];
		// una tacca: soft ~= /1.05 (~95), hard ~= /1.5 (~67) -> hard piu' stretto
		expect(hardSpan).toBeLessThan(softSpan);
		expect(softSpan).toBeCloseTo(100 / 1.05, 4);
		expect(hardSpan).toBeCloseTo(100 / 1.5, 4);
	});

	it("snap arrotonda gli estremi al multiplo indicato", () => {
		const [min, max] = computeWheelZoom({
			domain: [5.4, 60.5],
			baseDomain: [0, 100],
			value: 33,
			deltaY: 0, // nessun cambio di span, solo snap
			snap: 1,
		});
		expect(Number.isInteger(min)).toBe(true);
		expect(Number.isInteger(max)).toBe(true);
		expect(min).toBe(5);
		expect(max).toBe(61); // 60.5 -> 61 (round), dentro base
	});

	it("snap non degenera il dominio (mantiene almeno un multiplo)", () => {
		const [min, max] = computeWheelZoom({
			domain: [50.1, 50.4],
			baseDomain: [0, 100],
			value: 50.2,
			deltaY: 0,
			snap: 5,
		});
		expect(max).toBeGreaterThan(min); // non collassa a span 0
	});
});
