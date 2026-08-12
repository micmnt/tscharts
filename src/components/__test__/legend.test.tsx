// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Bar from "../bar/bar";
import Chart from "../chart/chart";
import Legend from "../legend/legend";
import Line from "../line/line";

const dataPoints = ["a", "b", "c"];
const bar = (name: string) => ({
	name,
	type: "bar" as const,
	data: dataPoints.map((d, i) => ({ date: d, value: 10 + i * 5 })),
});
const line = (name: string) => ({
	name,
	type: "line" as const,
	data: dataPoints.map((d, i) => ({ date: d, value: 5 + i })),
});

describe("Legend", () => {
	it("mostra il nome di ogni serie con il relativo pallino colore", async () => {
		const { container } = render(
			<Chart
				width={600}
				height={400}
				elements={[bar("vendite"), line("costi")]}
			>
				<YAxis name="vendite" />
				<Bar name="vendite" />
				<Line name="costi" />
				<Legend />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
		await waitFor(() =>
			expect(container.querySelector(".legendItemText")).toBeTruthy(),
		);
		const names = Array.from(container.querySelectorAll(".legendItemText")).map(
			(n) => n.textContent,
		);
		expect(names).toContain("vendite");
		expect(names).toContain("costi");
		// un pallino colore per voce
		expect(container.querySelectorAll(".legendItemCircle").length).toBe(
			names.length,
		);
	});
});
