import { describe, expect, it } from "vitest";
import {
	generateAngleDonutPaths,
	generateDonutPaths,
	generateDonutSlice,
	generatePiePaths,
	generatePieSlice,
	resolveOutsideLabelCollisions,
} from "../core";

const baseCtx = { width: 200, height: 200, padding: 10 };

describe("generatePiePaths", () => {
	it("due fette uguali (50/50) ottengono esattamente 180 gradi ciascuna", () => {
		const serie = {
			name: "p1",
			type: "pie",
			data: [
				{ name: "a", value: 50 },
				{ name: "b", value: 50 },
			],
		};
		const result = generatePiePaths(serie, baseCtx);

		expect(result?.paths[0]).toBe(generatePieSlice(100, 85, 85, 0, 180));

		expect(result?.paths[1]).toBe(generatePieSlice(100, 85, 85, 180, 359.9));
	});

	it("una fetta sotto i 31 gradi non genera un dataPoint per la label, una sopra si'", () => {
		const serie = {
			name: "p1",
			type: "pie",
			data: [
				{ name: "small", value: 5 },
				{ name: "big", value: 95 },
			],
		};
		const result = generatePiePaths(serie, baseCtx);

		expect(result?.dataPoints.has("small")).toBe(false);
		expect(result?.dataPoints.has("big")).toBe(true);
	});

	it("un'unica fetta al 100% chiude il cerchio, clampata a 359.9 invece di 360", () => {
		const serie = {
			name: "p1",
			type: "pie",
			data: [{ name: "solo", value: 10 }],
		};
		const result = generatePiePaths(serie, baseCtx);

		expect(result?.paths[0]).toBe(generatePieSlice(100, 85, 85, 0, 359.9));
	});

	it("labelPosition outside produce le label esterne anche per il pie", () => {
		const serie = {
			name: "p1",
			type: "pie",
			data: [
				{ name: "a", value: 50 },
				{ name: "b", value: 50 },
			],
		};
		const outside = generatePiePaths(serie, {
			...baseCtx,
			labelPosition: "outside",
		});

		expect(outside.outsideLabels.size).toBe(2);
		const a = outside.outsideLabels.get("a");
		expect(a.anchor).toBe("start");
		expect(a.p1).toEqual({ x: 159, y: 85 });
		expect(a.p3).toEqual({ x: 191, y: 85 });
	});
});

describe("generateDonutPaths", () => {
	it("due fette uguali (50/50) ottengono esattamente 180 gradi ciascuna", () => {
		const serie = {
			name: "d1",
			type: "donut",
			data: [
				{ name: "a", value: 50 },
				{ name: "b", value: 50 },
			],
		};
		const result = generateDonutPaths(serie, baseCtx);

		expect(result?.paths[0]).toBe(generateDonutSlice(100, 90, 90, 45, 0, 180));
		expect(result?.paths[1]).toBe(
			generateDonutSlice(100, 90, 90, 45, 180, 359.9),
		);
	});

	it("centerPoint presente solo se centerElement.value e' definito", () => {
		const serie = {
			name: "d1",
			type: "donut",
			data: [{ name: "a", value: 100 }],
		};

		const withCenter = generateDonutPaths(serie, {
			...baseCtx,
			centerElement: { value: "42" },
		});
		const withoutCenter = generateDonutPaths(serie, baseCtx);

		expect(withCenter?.centerPoint).toEqual({ x: 100, y: 90 });
		expect(withoutCenter && "centerPoint" in withoutCenter).toBe(false);
	});

	it("una fetta sotto i 31 gradi non genera un dataPoint per la label", () => {
		const serie = {
			name: "d1",
			type: "donut",
			data: [
				{ name: "small", value: 5 },
				{ name: "big", value: 95 },
			],
		};
		const result = generateDonutPaths(serie, baseCtx);

		expect(result?.dataPoints.has("small")).toBe(false);
		expect(result?.dataPoints.has("big")).toBe(true);
	});

	it("gap > 0 restringe ogni fetta di gap/2 per lato", () => {
		const serie = {
			name: "d1",
			type: "donut",
			data: [
				{ name: "a", value: 50 },
				{ name: "b", value: 50 },
			],
		};
		const result = generateDonutPaths(serie, { ...baseCtx, gap: 20 });

		expect(result?.paths[0]).toBe(generateDonutSlice(100, 90, 90, 45, 10, 170));
		expect(result?.paths[1]).toBe(
			generateDonutSlice(100, 90, 90, 45, 190, 349.9),
		);
	});

	it("una fetta piu' piccola del gap mantiene l'arco pieno", () => {
		const serie = {
			name: "d1",
			type: "donut",
			data: [
				{ name: "small", value: 5 },
				{ name: "big", value: 95 },
			],
		};
		const result = generateDonutPaths(serie, { ...baseCtx, gap: 20 });

		expect(result?.paths[0]).toBe(generateDonutSlice(100, 90, 90, 45, 0, 18));
	});

	it("sliceRadius > 0 arrotonda gli angoli (path con curve Q, diverso dallo spigolo)", () => {
		const serie = {
			name: "d1",
			type: "donut",
			data: [
				{ name: "a", value: 50 },
				{ name: "b", value: 50 },
			],
		};
		const sharp = generateDonutPaths(serie, baseCtx);
		const rounded = generateDonutPaths(serie, { ...baseCtx, sliceRadius: 8 });

		expect(rounded?.paths[0]).toContain("Q");
		expect(rounded?.paths[0]).not.toBe(sharp?.paths[0]);
		expect(rounded?.paths[0]).toBe(
			generateDonutSlice(100, 90, 90, 45, 0, 180, 8),
		);
	});

	it("labelPosition outside produce il layout delle label esterne (leader + ancoraggio)", () => {
		const serie = {
			name: "d1",
			type: "donut",
			data: [
				{ name: "a", value: 50 },
				{ name: "b", value: 50 },
			],
		};
		const inside = generateDonutPaths(serie, baseCtx);
		const outside = generateDonutPaths(serie, {
			...baseCtx,
			labelPosition: "outside",
		});

		expect(inside?.outsideLabels.size).toBe(0);
		expect(outside?.outsideLabels.size).toBe(2);

		const a = outside?.outsideLabels.get("a");
		expect(a.anchor).toBe("start");
		expect(a.p1).toEqual({ x: 164, y: 90 });
		expect(a.p3).toEqual({ x: 196, y: 90 });

		const b = outside?.outsideLabels.get("b");
		expect(b.anchor).toBe("end");
		expect(b.p1.x).toBeCloseTo(36);
	});
});

describe("generateAngleDonutPaths", () => {
	const angleDonutCtx = { ...baseCtx, innerRadius: 15 };

	it("value === maxValue con angle custom raggiunge esattamente quell'angolo", () => {
		const serie = {
			name: "ad1",
			type: "angle-donut",
			data: [{ name: "kpi", value: 50, maxValue: 50 }],
		};
		const result = generateAngleDonutPaths(serie, {
			...angleDonutCtx,
			angle: 270,
		});

		expect(result?.paths[0]?.path).toBe(
			generateDonutSlice(100, 90, 90, 75, 0, 270),
		);
	});

	it("un valore oltre il 100% del massimo viene clampato a 359.9 gradi, non genera un arco degenere a 360+", () => {
		const serie = {
			name: "ad1",
			type: "angle-donut",
			data: [{ name: "kpi", value: 150, maxValue: 100 }],
		};
		const result = generateAngleDonutPaths(serie, angleDonutCtx);

		expect(result?.paths[0]?.path).toBe(
			generateDonutSlice(100, 90, 90, 75, 0, 359.9),
		);
	});

	it("shadowPath presente solo con showTrack=true E maxValue definito", () => {
		const serieWithMax = {
			name: "ad1",
			type: "angle-donut",
			data: [{ name: "kpi", value: 50, maxValue: 100 }],
		};
		const serieNoMax = {
			name: "ad1",
			type: "angle-donut",
			data: [{ name: "kpi", value: 50 }],
		};

		const withTrack = generateAngleDonutPaths(serieWithMax, {
			...angleDonutCtx,
			showTrack: true,
		});
		const withoutTrack = generateAngleDonutPaths(serieWithMax, {
			...angleDonutCtx,
			showTrack: false,
		});
		const trackNoMax = generateAngleDonutPaths(serieNoMax, {
			...angleDonutCtx,
			showTrack: true,
		});

		expect(withTrack?.paths[0]?.shadowPath).not.toBe("");
		expect(withoutTrack?.paths[0]?.shadowPath).toBe("");
		expect(trackNoMax?.paths[0]?.shadowPath).toBe("");
	});

	it("piu' elementi in data generano anelli concentrici, ciascuno con la propria labelElement (K7)", () => {
		const serie = {
			name: "s1",
			type: "angle-donut",
			data: [
				{ name: "kpi1", value: 30, maxValue: 100 },
				{ name: "kpi2", value: 60, maxValue: 100 },
			],
		};
		const result = generateAngleDonutPaths(serie, angleDonutCtx);

		expect(result?.paths[0]?.labelElement).toEqual({
			x: 41,
			y: 0,
			width: 54,
			height: 15,
		});
		expect(result?.paths[1]?.labelElement).toEqual({
			x: 41,
			y: 16.25,
			width: 54,
			height: 15,
		});
	});

	it("centerPoint presente solo se centerElement.value e' definito", () => {
		const serie = {
			name: "ad1",
			type: "angle-donut",
			data: [{ name: "kpi", value: 50, maxValue: 100 }],
		};

		const withCenter = generateAngleDonutPaths(serie, {
			...angleDonutCtx,
			centerElement: { value: "42" },
		});
		const withoutCenter = generateAngleDonutPaths(serie, angleDonutCtx);

		expect(withCenter?.centerPoint).toEqual({ x: 100, y: 90 });
		expect(withoutCenter && "centerPoint" in withoutCenter).toBe(false);
	});
});

describe("resolveOutsideLabelCollisions", () => {
	it("spinge in basso le label troppo vicine dello stesso lato", () => {
		const items = [
			{ textY: 10, anchor: "start" as const, p3: { x: 5, y: 10 } },
			{ textY: 12, anchor: "start" as const, p3: { x: 5, y: 12 } },
			{ textY: 100, anchor: "end" as const, p3: { x: -5, y: 100 } },
		];
		const out = resolveOutsideLabelCollisions(items, 16);

		const right = out
			.filter((i) => i.anchor === "start")
			.sort((a, b) => a.textY - b.textY);
		expect(right[0].textY).toBe(10);
		expect(right[1].textY).toBe(26);
		expect(right[1].p3.y).toBe(26);

		const left = out.filter((i) => i.anchor === "end");
		expect(left[0].textY).toBe(100);
	});

	it("non tocca le label gia' distanziate", () => {
		const items = [
			{ textY: 10, anchor: "start" as const, p3: { x: 5, y: 10 } },
			{ textY: 40, anchor: "start" as const, p3: { x: 5, y: 40 } },
		];
		const out = resolveOutsideLabelCollisions(items, 16);
		expect(out.map((i) => i.textY).sort((a, b) => a - b)).toEqual([10, 40]);
	});
});
