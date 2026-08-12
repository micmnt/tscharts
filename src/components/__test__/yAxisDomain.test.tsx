// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Chart from "../chart/chart";
import Line from "../line/line";

const dataPoints = ["a", "b", "c"];
const elements = [
	{
		name: "vendite",
		type: "line" as const,
		uom: "€",
		data: [
			{ date: "a", value: 98 },
			{ date: "b", value: 100 },
			{ date: "c", value: 102 },
		],
	},
];

const yAxisTexts = (c: HTMLElement) =>
	Array.from(c.querySelectorAll("text"))
		.map((t) => Number(t.textContent))
		.filter((n) => Number.isFinite(n));

describe("yDomain e2e — <YAxis min max> restringe l'asse", () => {
	it("i tick dell'asse Y coprono [min, max] invece di [0, auto]", async () => {
		const { container } = render(
			<Chart width={520} height={400} elements={elements}>
				<YAxis name="vendite" min={98} max={102} showLine />
				<Line name="vendite" showDots />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());

		const nums = yAxisTexts(container);
		const maxTick = Math.max(...nums);
		const minTick = Math.min(...nums);

		expect(maxTick).toBeCloseTo(102, 6);

		expect(minTick).toBeGreaterThanOrEqual(98 - 1e-6);
	});
});
