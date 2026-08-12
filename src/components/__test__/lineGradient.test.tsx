// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Chart from "../chart/chart";
import Line from "../line/line";

const dataPoints = ["a", "b", "c", "d"];
const elements = [
	{
		name: "v",
		type: "line" as const,
		uom: "€",
		data: dataPoints.map((d, i) => ({ date: d, value: 40 + i * 25 })),
	},
];

const renderLine = (lineProps: Record<string, unknown>) =>
	render(
		<Chart width={480} height={300} elements={elements}>
			<YAxis name="v" showLine />
			<Line name="v" {...lineProps} />
			<XAxis dataPoints={dataPoints} showLine />
		</Chart>,
	);

describe("Line fillGradient — area sfumata", () => {
	it("rende un linearGradient (opaco -> trasparente) e un path area con url()", async () => {
		const { container } = renderLine({ fillGradient: true, fill: "#6366f1" });
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());

		const grad = container.querySelector("linearGradient");
		expect(grad, "linearGradient presente").toBeTruthy();

		expect(grad?.getAttribute("y1")).toBe("0");
		expect(grad?.getAttribute("y2")).toBe("1");

		const stops = grad?.querySelectorAll("stop") ?? [];
		expect(stops.length).toBe(2);
		expect(Number(stops[0].getAttribute("stop-opacity"))).toBeCloseTo(0.3, 6);
		expect(Number(stops[1].getAttribute("stop-opacity"))).toBe(0);
		expect(stops[0].getAttribute("stop-color")).toBe("#6366f1");

		const areaPath = Array.from(container.querySelectorAll("path")).find((p) =>
			(p.getAttribute("fill") ?? "").startsWith("url(#"),
		);
		expect(areaPath, "path area con fill=url()").toBeTruthy();

		expect(areaPath?.getAttribute("d")).toMatch(/Z$/);
	});

	it("senza fillGradient non c'e' alcun gradiente", async () => {
		const { container } = renderLine({});
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		expect(container.querySelector("linearGradient")).toBeNull();
	});

	it("fillOpacity controlla l'opacita' in cima al gradiente", async () => {
		const { container } = renderLine({ fillGradient: true, fillOpacity: 0.6 });
		await waitFor(() =>
			expect(container.querySelector("linearGradient")).toBeTruthy(),
		);
		const stops = container.querySelectorAll("linearGradient stop");
		expect(Number(stops[0].getAttribute("stop-opacity"))).toBeCloseTo(0.6, 6);
	});
});
