import { describe, expect, it } from "vitest";
import { calculateTooltipPosition } from "../core";

const chartXStart = 0;
const chartXEnd = 400;
const chartYEnd = 300;
const w = 150;
const h = 160;

describe("calculateTooltipPosition (pura, R7)", () => {
	it("mouse nella meta' SINISTRA: il tooltip va a destra del cursore (+50)", () => {
		const pos = calculateTooltipPosition(
			{ x: 50, y: 50 },
			chartXStart,
			chartXEnd,
			chartYEnd,
			w,
			h,
		);
		expect(pos.x).toBe(50 + 50);
	});

	it("mouse nella meta' DESTRA: il tooltip va a sinistra del cursore (- larghezza - 50)", () => {
		const pos = calculateTooltipPosition(
			{ x: 350, y: 50 },
			chartXStart,
			chartXEnd,
			chartYEnd,
			w,
			h,
		);
		expect(pos.x).toBe(350 - w - 50);
	});

	it("mouse in ALTO: il tooltip scende (+10)", () => {
		const pos = calculateTooltipPosition(
			{ x: 50, y: 20 },
			chartXStart,
			chartXEnd,
			chartYEnd,
			w,
			h,
		);
		expect(pos.y).toBe(20 + 10);
	});

	it("mouse in BASSO: il tooltip sale (- 20 - altezza/2)", () => {
		const pos = calculateTooltipPosition(
			{ x: 50, y: 250 },
			chartXStart,
			chartXEnd,
			chartYEnd,
			w,
			h,
		);
		expect(pos.y).toBe(250 - 20 - h / 2);
	});

	it("clampa x a 0 quando il calcolo andrebbe negativo", () => {
		const pos = calculateTooltipPosition(
			{ x: 200, y: 50 },
			chartXStart,
			chartXEnd,
			chartYEnd,
			250,
			h,
		);
		expect(pos.x).toBe(0);
	});
});
