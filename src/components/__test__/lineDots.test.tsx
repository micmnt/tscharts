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

	describe("renderDot", () => {
		it("showDots -> renderDot sostituisce i <circle> alla posizione esatta", async () => {
			const N = 5;
			const data = makeData(N);
			const { container } = render(
				<Chart
					width={600}
					height={300}
					elements={[{ name: "s", type: "line", uom: "", data }]}
				>
					<YAxis name="s" showLine />
					<Line
						name="s"
						showDots
						renderDot={({ x, y, index }) => (
							<rect
								data-testid="dot"
								data-i={index}
								x={x}
								y={y}
								width={4}
								height={4}
							/>
						)}
					/>
				</Chart>,
			);
			await waitFor(() =>
				expect(container.querySelector('[data-testid="dot"]')).toBeTruthy(),
			);
			// nessun cerchio standard, N marche custom
			expect(container.querySelectorAll("circle").length).toBe(0);
			expect(container.querySelectorAll('[data-testid="dot"]').length).toBe(N);
			// la marca custom sta esattamente sul dot standard: confronto la x/y con
			// quella che avrebbe reso <circle> (stessa Line senza renderDot).
			const ref = render(
				<Chart
					width={600}
					height={300}
					elements={[{ name: "s", type: "line", uom: "", data }]}
				>
					<YAxis name="s" showLine />
					<Line name="s" showDots />
				</Chart>,
			);
			await waitFor(() =>
				expect(ref.container.querySelector("circle")).toBeTruthy(),
			);
			const circles = Array.from(ref.container.querySelectorAll("circle"));
			const dots = Array.from(
				container.querySelectorAll('[data-testid="dot"]'),
			);
			dots.forEach((dot, i) => {
				expect(Number(dot.getAttribute("x"))).toBeCloseTo(
					Number(circles[i].getAttribute("cx")),
					3,
				);
				expect(Number(dot.getAttribute("y"))).toBeCloseTo(
					Number(circles[i].getAttribute("cy")),
					3,
				);
			});
		});

		it("senza showDots -> renderDot solo sul punto in hover", async () => {
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
					<Line
						name="s"
						renderDot={({ x, y, hovered }) =>
							hovered ? <rect data-testid="dot" x={x} y={y} /> : null
						}
					/>
					<XAxis dataPoints={dataPoints} showLine />
				</Chart>,
			);
			await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
			// a riposo nessuna marca
			expect(container.querySelectorAll('[data-testid="dot"]').length).toBe(0);
			const svg = container.querySelector("svg") as SVGSVGElement;
			fireEvent.mouseMove(svg, { clientX: 300, clientY: 150 });
			await waitFor(() =>
				expect(container.querySelectorAll('[data-testid="dot"]').length).toBe(
					1,
				),
			);
		});
	});
});
