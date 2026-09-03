import { describe, expect, it } from "vitest";
import { calculateTooltipPosition } from "../core";

const bounds = { width: 400, height: 300 };
const tooltip = { width: 150, height: 160 };
const gap = 16;

const place = (
	pointer: { x: number; y: number },
	size = tooltip,
	box = bounds,
) => calculateTooltipPosition({ pointer, tooltip: size, bounds: box });

describe("calculateTooltipPosition", () => {
	it("con spazio disponibile sta a destra e sotto il cursore", () => {
		const pos = place({ x: 50, y: 50 });

		expect(pos.x).toBe(50 + gap);
		expect(pos.y).toBe(50 + gap);
	});

	it("ribalta a sinistra quando a destra non c'e' spazio", () => {
		const pos = place({ x: 380, y: 50 });

		expect(pos.x).toBe(380 - gap - tooltip.width);
	});

	it("ribalta sopra quando sotto non c'e' spazio", () => {
		const pos = place({ x: 50, y: 280 });

		expect(pos.y).toBe(280 - gap - tooltip.height);
	});

	it("non ribalta prima del necessario: il lato dipende dallo spazio, non da meta' grafico", () => {
		const pos = place({ x: 220, y: 50 });

		expect(pos.x).toBe(220 + gap);
	});

	it("resta dentro il contenitore su tutto il perimetro", () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 400, y: 0 },
			{ x: 0, y: 300 },
			{ x: 400, y: 300 },
			{ x: 200, y: 150 },
			{ x: 399, y: 299 },
		];

		for (const point of points) {
			const pos = place(point);

			expect(pos.x).toBeGreaterThanOrEqual(0);
			expect(pos.y).toBeGreaterThanOrEqual(0);
			expect(pos.x + tooltip.width).toBeLessThanOrEqual(bounds.width);
			expect(pos.y + tooltip.height).toBeLessThanOrEqual(bounds.height);
		}
	});

	it("tooltip piu' grande del contenitore: lo ancora all'angolo invece di sforare", () => {
		const pos = place({ x: 200, y: 150 }, { width: 500, height: 400 });

		expect(pos).toEqual({ x: 0, y: 0 });
	});
});
