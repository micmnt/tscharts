// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Chart from "../chart/chart";
import Line from "../line/line";

const dataPoints = ["a", "b", "c", "d"];

const makeChart = (values: number[]) =>
	render(
		<Chart
			width={480}
			height={300}
			elements={[
				{
					name: "v",
					type: "line",
					uom: "€",
					data: dataPoints.map((d, i) => ({ date: d, value: values[i] })),
				},
			]}
		>
			<YAxis name="v" showLine />
			<Line name="v" fill="#6366f1" fillOpacity={0.3} />
			<XAxis dataPoints={dataPoints} showLine />
		</Chart>,
	);

// baseline = y dell'ultima coppia prima di "Z" nel path area (M .. L xn base L x0 base Z)
const areaBaseline = (d: string): number => {
	const toks = d.trim().split(/\s+/);
	const zi = toks.indexOf("Z");
	return Number(toks[zi - 1]);
};

const areaOf = (c: HTMLElement) =>
	Array.from(c.querySelectorAll("path")).find(
		(p) => (p.getAttribute("fill") ?? "") === "#6366f1",
	);

describe("Area chart — fill solido diventa area vera", () => {
	it("il fill solido rende un path area chiuso; la linea non e' piu' riempita", async () => {
		const { container } = makeChart([40, 65, 50, 90]);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());

		const area = areaOf(container);
		expect(area, "path area con fill solido").toBeTruthy();
		expect(area?.getAttribute("fill-opacity")).toBe("0.3");
		expect(area?.getAttribute("d")).toMatch(/Z$/); // chiuso alla baseline

		// la linea (stroke) non ha piu' fill (niente riempimento nero di default)
		const strokePath = Array.from(container.querySelectorAll("path")).find(
			(p) => p.getAttribute("stroke") && p.getAttribute("fill") === "none",
		);
		expect(strokePath, "linea con fill=none").toBeTruthy();
	});

	it("area negativa: la baseline e' la linea dello zero (piu' in alto del fondo)", async () => {
		const pos = makeChart([40, 65, 50, 90]); // tutti positivi
		const neg = makeChart([40, -30, 50, -20]); // misti -> grafico negativo
		await waitFor(() =>
			expect(pos.container.querySelector("path")).toBeTruthy(),
		);
		await waitFor(() =>
			expect(neg.container.querySelector("path")).toBeTruthy(),
		);

		const posBase = areaBaseline(
			areaOf(pos.container)?.getAttribute("d") ?? "",
		);
		const negBase = areaBaseline(
			areaOf(neg.container)?.getAttribute("d") ?? "",
		);

		// nel grafico negativo lo zero e' a meta' canvas -> baseline piu' in alto
		// (y minore) rispetto al caso positivo dove la baseline e' il fondo.
		expect(negBase).toBeLessThan(posBase);
	});
});
