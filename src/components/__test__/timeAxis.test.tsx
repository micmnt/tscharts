// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Chart from "../chart/chart";
import Line from "../line/line";
import Tooltip from "../tooltip/tooltip";

const parseDate = (d: string) => new Date(d).getTime();

// campionamento irregolare: 1 giorno, poi 29 giorni
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

		// x dei tick dell'asse (label = data grezza)
		const tickX = dates.map(
			(d) => textsByContent(container, (t) => t === d)[0],
		);
		// cx dei pallini della line
		const dotCx = Array.from(container.querySelectorAll("circle")).map((c) =>
			Number(c.getAttribute("cx")),
		);

		// asse e line usano la STESSA scala tempo -> tick e punti allineati
		dates.forEach((_, i) => {
			expect(tickX[i]).toBeCloseTo(dotCx[i], 6);
		});

		// spaziatura proporzionale al tempo: gap 1->2 (29gg) >> gap 0->1 (1gg)
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
		const fmt = (t: number) => `T${t}`; // formatter identificabile
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
		// equispaziati: i due gap sono uguali
		expect(tickX[1] - tickX[0]).toBeCloseTo(tickX[2] - tickX[1], 6);
	});
});
