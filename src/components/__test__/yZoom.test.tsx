// @vitest-environment jsdom
import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Chart from "../chart/chart";
import Line from "../line/line";

// jsdom non implementa la geometria SVG: mock di createSVGPoint/getScreenCTM con
// mapping identita' (svgPoint = coordinate client), cosi' convertToSVGPoint
// funziona e la rotella puo' calcolare il valore sotto il cursore.
beforeAll(() => {
	// biome-ignore lint/suspicious/noExplicitAny: mock jsdom
	(SVGSVGElement.prototype as any).createSVGPoint = () => {
		const pt = {
			x: 0,
			y: 0,
			matrixTransform() {
				return { x: pt.x, y: pt.y };
			},
		};
		return pt;
	};
	// biome-ignore lint/suspicious/noExplicitAny: mock jsdom
	(SVGSVGElement.prototype as any).getScreenCTM = () => ({
		inverse: () => ({}),
	});
});

const dataPoints = ["a", "b", "c"];
const elements = [
	{
		name: "v",
		type: "line" as const,
		uom: "€",
		data: [
			{ date: "a", value: 30 },
			{ date: "b", value: 50 },
			{ date: "c", value: 70 },
		],
	},
];

const dotYs = (c: HTMLElement) =>
	Array.from(c.querySelectorAll("circle")).map((el) =>
		Number(el.getAttribute("cy")),
	);

describe("S3 — zoom interattivo Y (rotella)", () => {
	it("rotella zooma il dominio e riposiziona; doppio click resetta", async () => {
		const onZoomChange = vi.fn();
		const { container } = render(
			<Chart width={520} height={400} elements={elements}>
				<YAxis name="v" zoomable onZoomChange={onZoomChange} showLine />
				<Line name="v" showDots />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("circle")).toBeTruthy());

		const svg = container.querySelector("svg") as SVGSVGElement;
		const before = dotYs(container);

		// rotella verso l'alto (deltaY < 0) = zoom IN attorno al centro
		fireEvent.wheel(svg, { clientX: 250, clientY: 200, deltaY: -240 });

		// onZoomChange chiamato con un dominio piu' STRETTO del base [0, ~100]
		expect(onZoomChange).toHaveBeenCalled();
		const zoomed = onZoomChange.mock.calls.at(-1)?.[0] as [number, number];
		expect(zoomed[1] - zoomed[0]).toBeLessThan(100);
		console.log(
			"[S3 proof] dominio dopo zoom:",
			zoomed.map((n) => n.toFixed(1)).join(" .. "),
		);

		// i punti si sono riposizionati
		await waitFor(() => {
			const after = dotYs(container);
			expect(after).not.toEqual(before);
		});

		// doppio click -> reset
		fireEvent.doubleClick(svg);
		expect(onZoomChange.mock.calls.at(-1)?.[0]).toBeNull();

		await waitFor(() => {
			const reset = dotYs(container);
			reset.forEach((y, i) => expect(y).toBeCloseTo(before[i], 3));
		});
	});

	it("zoomSnap arrotonda il dominio a interi", async () => {
		const onZoomChange = vi.fn();
		const { container } = render(
			<Chart width={520} height={400} elements={elements}>
				<YAxis
					name="v"
					zoomable
					zoomSnap={1}
					onZoomChange={onZoomChange}
					showLine
				/>
				<Line name="v" showDots />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("circle")).toBeTruthy());
		const svg = container.querySelector("svg") as SVGSVGElement;

		fireEvent.wheel(svg, { clientX: 250, clientY: 180, deltaY: -200 });

		const zoomed = onZoomChange.mock.calls.at(-1)?.[0] as [number, number];
		expect(Number.isInteger(zoomed[0])).toBe(true);
		expect(Number.isInteger(zoomed[1])).toBe(true);
	});
});
