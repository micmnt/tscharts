// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Bar from "../bar/bar";
import Chart from "../chart/chart";
import Line from "../line/line";
import Tooltip from "../tooltip/tooltip";

const parseDate = (d: string) => new Date(d).getTime();

const dates = ["2024-01-01", "2024-01-02", "2024-01-31"];
const elements = [
	{
		name: "s",
		type: "line" as const,
		uom: "€",
		data: dates.map((date, i) => ({ date, value: 100 + i * 20 })),
	},
];

const textsByContent = (c: HTMLElement, match: (t: string) => boolean) =>
	Array.from(c.querySelectorAll("text"))
		.filter((t) => match(t.textContent ?? ""))
		.map((t) => Number(t.getAttribute("x")));

describe("asse tempo — tick e allineamento asse↔line", () => {
	it('ticks="data": i tick dell\'asse coincidono con i punti line e sono proporzionali al tempo', async () => {
		const { container } = render(
			<Chart width={640} height={400} elements={elements}>
				<YAxis name="s" showLine />
				<Line name="s" showDots />
				<XAxis scaleType="time" parseDate={parseDate} showLine showLabels />
				<Tooltip />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("circle")).toBeTruthy());

		const tickX = dates.map(
			(d) => textsByContent(container, (t) => t === d)[0],
		);

		const dotCx = Array.from(container.querySelectorAll("circle")).map((c) =>
			Number(c.getAttribute("cx")),
		);

		dates.forEach((_, i) => {
			expect(tickX[i]).toBeCloseTo(dotCx[i], 6);
		});

		const gap01 = tickX[1] - tickX[0];
		const gap12 = tickX[2] - tickX[1];
		console.log(
			"[S2b e2e] tickX:",
			tickX.map((x) => x.toFixed(1)).join(", "),
			"| gap01:",
			gap01.toFixed(1),
			"gap12:",
			gap12.toFixed(1),
		);
		expect(gap12).toBeGreaterThan(gap01 * 20);
	});

	it("ticks={N}: N tick equispaziati nel dominio", async () => {
		const fmt = (t: number) => `T${t}`;
		const { container } = render(
			<Chart width={640} height={400} elements={elements}>
				<YAxis name="s" showLine />
				<Line name="s" showDots />
				<XAxis
					scaleType="time"
					parseDate={parseDate}
					ticks={3}
					tickFormat={fmt}
					showLine
					showLabels
				/>
				<Tooltip />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("circle")).toBeTruthy());

		const tickX = textsByContent(container, (t) => t.startsWith("T")).sort(
			(a, b) => a - b,
		);
		expect(tickX.length).toBe(3);

		expect(tickX[1] - tickX[0]).toBeCloseTo(tickX[2] - tickX[1], 6);
	});
});

const barWidth = 20;

const barElements = [
	{
		name: "s",
		type: "bar" as const,
		uom: "€",
		data: dates.map((date, i) => ({ date, value: 100 + i * 20 })),
	},
];

const barCentersOf = (c: HTMLElement) =>
	Array.from(c.querySelectorAll("path"))
		.map((p) => p.getAttribute("d") ?? "")
		.filter((d) => /^M [\d.]+ [\d.]+ V [\d.]+ H [\d.]+ V [\d.]+ Z$/.test(d))
		.map((d) => Number(d.split(" ")[1]) + barWidth / 2);

describe("asse tempo — barre", () => {
	it("le barre si posizionano nel tempo e restano centrate sui tick", async () => {
		const { container } = render(
			<Chart
				width={640}
				height={400}
				elements={barElements}
				barWidth={barWidth}
			>
				<YAxis name="s" showLine />
				<Bar name="s" />
				<XAxis scaleType="time" parseDate={parseDate} showLine showLabels />
				<Tooltip />
			</Chart>,
		);
		await waitFor(() =>
			expect(barCentersOf(container).length).toBe(dates.length),
		);

		const tickX = dates.map(
			(d) => textsByContent(container, (t) => t === d)[0],
		);
		const centers = barCentersOf(container);

		dates.forEach((_, i) => {
			expect(centers[i]).toBeCloseTo(tickX[i], 6);
		});

		const gap01 = centers[1] - centers[0];
		const gap12 = centers[2] - centers[1];
		expect(gap12).toBeGreaterThan(gap01 * 20);
	});

	it("senza scaleType le barre restano equidistanti (band)", async () => {
		const { container } = render(
			<Chart
				width={640}
				height={400}
				elements={barElements}
				barWidth={barWidth}
			>
				<YAxis name="s" showLine />
				<Bar name="s" />
				<XAxis dataPoints={dates} showLine showLabels />
				<Tooltip />
			</Chart>,
		);
		await waitFor(() =>
			expect(barCentersOf(container).length).toBe(dates.length),
		);

		const centers = barCentersOf(container);
		expect(centers[1] - centers[0]).toBeCloseTo(centers[2] - centers[1], 9);
	});
});
