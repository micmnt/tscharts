// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import AngleDonut from "../angleDonut/angleDonut";
import Chart from "../chart/chart";
import Donut from "../donut/donut";
import Pie from "../pie/pie";

const pieData = [
	{ name: "x", value: 10 },
	{ name: "y", value: 30 },
	{ name: "z", value: 20 },
];

describe("Pie / Donut / AngleDonut", () => {
	it("Pie: una fetta (path) per dato", async () => {
		const { container } = render(
			<Chart
				width={400}
				height={400}
				elements={[{ name: "fette", type: "pie", data: pieData }]}
			>
				<Pie name="fette" />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		expect(container.querySelectorAll("path").length).toBe(pieData.length);
	});

	it("Pie: labelPosition outside rende label esterne con leader line", async () => {
		const { container } = render(
			<Chart
				width={500}
				height={400}
				elements={[
					{
						name: "fette",
						type: "pie",
						data: pieData,
						labels: pieData.map((d) => ({ name: d.name, value: d.name })),
					},
				]}
			>
				<Pie name="fette" config={{ labelPosition: "outside" }} />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		expect(container.querySelectorAll("polyline").length).toBe(pieData.length);
	});

	it("Donut: una fetta per dato e centerElement mostra il testo centrale", async () => {
		const { container } = render(
			<Chart
				width={400}
				height={400}
				elements={[{ name: "fette", type: "donut", data: pieData }]}
			>
				<Donut
					name="fette"
					config={{
						innerRadius: 60,
						centerElement: { value: "60%", label: "totale" },
					}}
				/>
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		expect(container.querySelectorAll("path").length).toBe(pieData.length);
		expect(container.textContent).toContain("60%");
		expect(container.textContent).toContain("totale");
	});

	it("Donut: centerElement.badge mostra il badge trend al centro", async () => {
		const { container } = render(
			<Chart
				width={400}
				height={400}
				elements={[{ name: "fette", type: "donut", data: pieData }]}
			>
				<Donut
					name="fette"
					config={{
						innerRadius: 60,
						centerElement: {
							value: "330",
							badge: { text: "83,33%", trend: "up" },
						},
					}}
				/>
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		expect(container.textContent).toContain("83,33%");
		expect(container.textContent).toContain("↗");
	});

	it("Donut: labelPosition outside rende label esterne con leader line", async () => {
		const { container } = render(
			<Chart
				width={500}
				height={300}
				elements={[
					{
						name: "fette",
						type: "donut",
						data: pieData,
						labels: pieData.map((d) => ({ name: d.name, value: d.name })),
					},
				]}
			>
				<Donut
					name="fette"
					config={{ innerRadius: 50, labelPosition: "outside" }}
				/>
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		expect(container.querySelectorAll("polyline").length).toBe(pieData.length);
	});

	it("AngleDonut: con showTrack ogni arco ha traccia + valore (2 path per dato)", async () => {
		const data = [
			{ name: "a", value: 30, maxValue: 100 },
			{ name: "b", value: 60, maxValue: 100 },
		];
		const { container } = render(
			<Chart
				width={400}
				height={400}
				elements={[{ name: "kpi", type: "angle-donut", data }]}
			>
				<AngleDonut name="kpi" config={{ innerRadius: 15, showTrack: true }} />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		expect(container.querySelectorAll("path").length).toBe(data.length * 2);
	});
});
