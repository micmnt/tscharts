// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import type { Serie } from "../../types";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Chart from "../chart/chart";
import GroupBar from "../groupBar/groupBar";

const dataPoints = ["a", "b", "c"];
const groupSerie = (name: string, base: number): Serie => ({
	name,
	type: "group-bar",
	axisName: "vendite",
	data: dataPoints.map((d, i) => ({ date: d, value: base + i * 4 })),
});

const barCount = (c: HTMLElement) =>
	Array.from(c.querySelectorAll("path")).filter((p) => {
		const fill = p.getAttribute("fill");
		return fill && fill !== "none";
	}).length;

describe("GroupBar", () => {
	it("due serie affiancate raddoppiano le barre rispetto a una", async () => {
		const one = render(
			<Chart width={500} height={400} elements={[groupSerie("A", 10)]}>
				<YAxis name="vendite" />
				<GroupBar name="A" />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
		await waitFor(() =>
			expect(one.container.querySelector("path")).toBeTruthy(),
		);
		const barsOne = barCount(one.container);

		const two = render(
			<Chart
				width={500}
				height={400}
				elements={[groupSerie("A", 10), groupSerie("B", 6)]}
			>
				<YAxis name="vendite" />
				<GroupBar name="A" />
				<GroupBar name="B" />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
		await waitFor(() =>
			expect(two.container.querySelector("path")).toBeTruthy(),
		);
		const barsTwo = barCount(two.container);

		expect(barsOne).toBe(dataPoints.length);
		expect(barsTwo).toBe(dataPoints.length * 2);
	});
});
