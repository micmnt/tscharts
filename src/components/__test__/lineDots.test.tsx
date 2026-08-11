// @vitest-environment jsdom
import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it } from "vitest";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Chart from "../chart/chart";
import Line from "../line/line";

// jsdom non implementa la geometria SVG: mock identita' di createSVGPoint/
// getScreenCTM cosi' convertToSVGPoint funziona e l'hover trova il punto.
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

// Regressione: senza showDots la linea NON deve emettere un <circle> per punto.
// Prima ne rendeva N (r=0, invisibili) solo per far crescere quello in hover ->
// costo DOM O(N) inutile (a 10k+ punti fino al crash della pagina).
const makeData = (n: number) =>
	Array.from({ length: n }, (_, i) => ({
		date: String(i),
		value: 20 + (i % 10),
	}));

describe("Line — dot O(1) senza showDots", () => {
	it("showDots=false -> nessun <circle> (a riposo)", async () => {
		const N = 40;
		const { container } = render(
			<Chart
				width={600}
				height={300}
				elements={[{ name: "s", type: "line", uom: "", data: makeData(N) }]}
			>
				<YAxis name="s" showLine />
				<Line name="s" showDots={false} />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		expect(container.querySelectorAll("circle").length).toBe(0);
	});

	it("showDots=true -> N <circle> (invariato)", async () => {
		const N = 40;
		const { container } = render(
			<Chart
				width={600}
				height={300}
				elements={[{ name: "s", type: "line", uom: "", data: makeData(N) }]}
			>
				<YAxis name="s" showLine />
				<Line name="s" showDots />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		expect(container.querySelectorAll("circle").length).toBe(N);
	});

	it("showDots=false -> l'hover mostra UN solo dot (r=7)", async () => {
		const dataPoints = ["a", "b", "c", "d"];
		const { container } = render(
			<Chart
				width={600}
				height={300}
				elements={[
					{
						name: "s",
						type: "line",
						uom: "",
						data: dataPoints.map((d, i) => ({ date: d, value: 20 + i * 10 })),
					},
				]}
			>
				<YAxis name="s" showLine />
				<Line name="s" showDots={false} />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		const svg = container.querySelector("svg") as SVGSVGElement;
		// muovo il mouse sul grafico -> un elemento va in hover
		fireEvent.mouseMove(svg, { clientX: 300, clientY: 150 });
		await waitFor(() => {
			const circles = container.querySelectorAll("circle");
			expect(circles.length).toBe(1);
			expect(Number(circles[0].getAttribute("r"))).toBe(7);
		});
	});
});
