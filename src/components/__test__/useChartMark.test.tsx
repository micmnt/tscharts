// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { useChartMark } from "../../hooks/useChartMark";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Chart from "../chart/chart";
import Line from "../line/line";

const dataPoints = ["a", "b", "c", "d"];
const data = dataPoints.map((d, i) => ({ date: d, value: 20 + i * 20 }));
const elements = [{ name: "s", type: "line" as const, uom: "", data }];

// Marca custom di test: un <circle> per punto posizionato con x/y dell'hook.
const CustomDots = ({ name }: { name: string }) => {
	const mark = useChartMark(name);
	if (!mark?.serie) return null;
	return (
		<>
			{mark.serie.data.map((d, i) => (
				<circle
					key={`${d.date}`}
					data-testid="custom"
					cx={mark.x(i)}
					cy={mark.y(d.value)}
					r={2}
				/>
			))}
		</>
	);
};

const cyOf = (nodes: Element[]) =>
	nodes.map((n) => Number(n.getAttribute("cy")));

describe("useChartMark", () => {
	it("y(value) posiziona come i dot della <Line> (stesso sistema di coordinate)", async () => {
		const { container } = render(
			<Chart width={600} height={320} elements={elements}>
				<YAxis name="s" showLine />
				<Line name="s" showDots />
				<CustomDots name="s" />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() =>
			expect(container.querySelector('[data-testid="custom"]')).toBeTruthy(),
		);
		const lineDots = Array.from(
			container.querySelectorAll("circle:not([data-testid])"),
		);
		const customDots = Array.from(
			container.querySelectorAll('[data-testid="custom"]'),
		);
		expect(customDots.length).toBe(data.length);
		expect(lineDots.length).toBe(data.length);
		// X e Y identici punto per punto: x/y sono allineati ai dot della Line.
		const cxOf = (nodes: Element[]) =>
			nodes.map((n) => Number(n.getAttribute("cx")));
		const lineCy = cyOf(lineDots);
		const customCy = cyOf(customDots);
		const lineCx = cxOf(lineDots);
		const customCx = cxOf(customDots);
		customCy.forEach((cy, i) => {
			expect(cy).toBeCloseTo(lineCy[i], 3);
			expect(customCx[i]).toBeCloseTo(lineCx[i], 3);
		});
	});

	it("espone serie, colore, scaleType e x crescente entro i bordi", async () => {
		let captured: ReturnType<typeof useChartMark> = null;
		const Probe = () => {
			captured = useChartMark("s");
			return null;
		};
		const { container } = render(
			<Chart width={600} height={320} elements={elements}>
				<YAxis name="s" showLine />
				<Line name="s" />
				<Probe />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() => {
			expect(container.querySelector("svg")).toBeTruthy();
			expect(captured).not.toBeNull();
		});
		const mark = captured as NonNullable<typeof captured>;
		expect(mark.serie?.name).toBe("s");
		expect(typeof mark.color).toBe("string");
		expect(mark.scaleType).toBe("band");
		expect(mark.horizontal).toBe(false);
		// x crescente e dentro [chartXStart, chartXEnd]
		const xs = data.map((_, i) => mark.x(i));
		for (let i = 1; i < xs.length; i++)
			expect(xs[i]).toBeGreaterThan(xs[i - 1]);
		expect(xs[0]).toBeGreaterThanOrEqual(mark.dimensions.chartXStart);
		expect(xs[xs.length - 1]).toBeLessThanOrEqual(mark.dimensions.chartXEnd);
	});

	it("ritorna null fuori da <Chart>", () => {
		let captured: ReturnType<typeof useChartMark> = undefined as never;
		const Probe = () => {
			captured = useChartMark();
			return null;
		};
		render(<Probe />);
		expect(captured).toBeNull();
	});

	it("negativo: point().y allineato ai dot della Line negativa", async () => {
		const negData = [
			{ date: "a", value: 30 },
			{ date: "b", value: -20 },
			{ date: "c", value: 40 },
		];
		const CustomY = ({ name }: { name: string }) => {
			const mark = useChartMark(name);
			if (!mark?.serie) return null;
			return (
				<>
					{mark.serie.data.map((d, i) => {
						const p = mark.point(i, d.value);
						return (
							<circle
								key={d.date}
								data-testid="custom"
								cx={p.x}
								cy={p.y}
								r={2}
							/>
						);
					})}
				</>
			);
		};
		const { container } = render(
			<Chart
				width={600}
				height={320}
				elements={[{ name: "s", type: "line", uom: "", data: negData }]}
			>
				<YAxis name="s" showLine />
				<Line name="s" showDots />
				<CustomY name="s" />
				<XAxis dataPoints={["a", "b", "c"]} showLine />
			</Chart>,
		);
		await waitFor(() =>
			expect(container.querySelector('[data-testid="custom"]')).toBeTruthy(),
		);
		const lineDots = Array.from(
			container.querySelectorAll("circle:not([data-testid])"),
		);
		const custom = Array.from(
			container.querySelectorAll('[data-testid="custom"]'),
		);
		custom.forEach((c, i) => {
			// X e Y: la marca (point) cade esattamente sul dot della Line negativa.
			expect(Number(c.getAttribute("cx"))).toBeCloseTo(
				Number(lineDots[i].getAttribute("cx")),
				3,
			);
			expect(Number(c.getAttribute("cy"))).toBeCloseTo(
				Number(lineDots[i].getAttribute("cy")),
				3,
			);
		});
	});

	it("orizzontale: point().x allineato ai dot della Line orizzontale", async () => {
		const CustomX = ({ name }: { name: string }) => {
			const mark = useChartMark(name);
			if (!mark?.serie) return null;
			return (
				<>
					{mark.serie.data.map((d, i) => {
						const p = mark.point(i, d.value);
						return (
							<circle
								key={d.date}
								data-testid="custom"
								cx={p.x}
								cy={p.y}
								r={2}
							/>
						);
					})}
				</>
			);
		};
		const { container } = render(
			<Chart width={600} height={320} elements={elements}>
				<YAxis name="s" showLine />
				<Line name="s" horizontal showDots />
				<CustomX name="s" />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() =>
			expect(container.querySelector('[data-testid="custom"]')).toBeTruthy(),
		);
		const lineDots = Array.from(
			container.querySelectorAll("circle:not([data-testid])"),
		);
		const custom = Array.from(
			container.querySelectorAll('[data-testid="custom"]'),
		);
		expect(custom.length).toBe(data.length);
		custom.forEach((c, i) => {
			expect(Number(c.getAttribute("cx"))).toBeCloseTo(
				Number(lineDots[i].getAttribute("cx")),
				3,
			);
		});
	});

	it("isCanvas riflette il renderer", async () => {
		const marks: Record<string, boolean> = {};
		const Probe = ({ tag }: { tag: string }) => {
			const m = useChartMark("s");
			if (m) marks[tag] = m.isCanvas;
			return null;
		};
		render(
			<Chart width={600} height={320} elements={elements}>
				<YAxis name="s" showLine />
				<Line name="s" />
				<Probe tag="svg" />
			</Chart>,
		);
		render(
			<Chart width={600} height={320} elements={elements} renderer="canvas">
				<YAxis name="s" showLine />
				<Line name="s" />
				<Probe tag="canvas" />
			</Chart>,
		);
		await waitFor(() => {
			expect(marks.svg).toBe(false);
			expect(marks.canvas).toBe(true);
		});
	});
});
