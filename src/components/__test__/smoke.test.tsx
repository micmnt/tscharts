// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { Serie } from "../../types";
import AngleDonut from "../angleDonut/angleDonut";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Bar from "../bar/bar";
import Chart from "../chart/chart";
import Donut from "../donut/donut";
import GroupBar from "../groupBar/groupBar";
import Line from "../line/line";
import Pie from "../pie/pie";
import Threshold from "../threshold/threshold";

afterEach(cleanup);

// Renderizza il grafico, aspetta che i path compaiano (il disegno avviene dopo
// il dispatch INITIALIZE nell'effect) e verifica lo smoke: c'e' output SVG e
// nessun path malformato (NaN/Infinity nell'attributo d).
const expectRendersCleanly = async (ui: ReactElement) => {
	const { container } = render(ui);

	await waitFor(() => {
		expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
	});

	const ds = [...container.querySelectorAll("path")].map(
		(p) => p.getAttribute("d") ?? "",
	);
	for (const d of ds) {
		expect(d).not.toContain("NaN");
		expect(d).not.toContain("Infinity");
	}
	return container;
};

const dataPoints = ["a", "b", "c"];

describe("smoke: ogni famiglia di grafico monta e produce output valido", () => {
	it("bar", async () => {
		const elements: Serie[] = [
			{
				name: "vendite",
				type: "bar",
				data: [
					{ date: "a", value: 10 },
					{ date: "b", value: 40 },
					{ date: "c", value: 25 },
				],
			},
		];
		await expectRendersCleanly(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="vendite" showName />
				<Bar name="vendite" showLabels />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
	});

	it("line", async () => {
		const elements: Serie[] = [
			{
				name: "temp",
				type: "line",
				data: [
					{ date: "a", value: 18 },
					{ date: "b", value: 22 },
					{ date: "c", value: 19 },
				],
			},
		];
		await expectRendersCleanly(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="temp" showName />
				<Line name="temp" showDots showLabels />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
	});

	it("bar-stacked", async () => {
		const elements: Serie[] = [
			{
				name: "a1",
				type: "bar-stacked",
				data: [
					{ date: "a", value: 10 },
					{ date: "b", value: 20 },
					{ date: "c", value: 15 },
				],
			},
			{
				name: "a2",
				type: "bar-stacked",
				data: [
					{ date: "a", value: 5 },
					{ date: "b", value: 8 },
					{ date: "c", value: 12 },
				],
			},
		];
		await expectRendersCleanly(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="a1" showName />
				<Bar name="a1" stacked />
				<Bar name="a2" stacked />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
	});

	it("group-bar", async () => {
		const elements: Serie[] = [
			{
				name: "prodotto A",
				type: "group-bar",
				axisName: "vendite",
				data: [
					{ date: "a", value: 12 },
					{ date: "b", value: 18 },
					{ date: "c", value: 9 },
				],
			},
			{
				name: "prodotto B",
				type: "group-bar",
				axisName: "vendite",
				data: [
					{ date: "a", value: 8 },
					{ date: "b", value: 14 },
					{ date: "c", value: 16 },
				],
			},
		];
		await expectRendersCleanly(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="vendite" showName />
				<GroupBar name="prodotto A" showLabels />
				<GroupBar name="prodotto B" showLabels />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
	});

	it("pie", async () => {
		const elements: Serie[] = [
			{
				name: "fette",
				type: "pie",
				labels: [{ name: "x", value: "10" }],
				data: [
					{ name: "x", value: 10 },
					{ name: "y", value: 30 },
					{ name: "z", value: 20 },
				],
			},
		];
		await expectRendersCleanly(
			<Chart width={600} height={400} elements={elements}>
				<Pie name="fette" />
			</Chart>,
		);
	});

	it("donut", async () => {
		const elements: Serie[] = [
			{
				name: "fette",
				type: "donut",
				data: [
					{ name: "x", value: 10 },
					{ name: "y", value: 30 },
					{ name: "z", value: 20 },
				],
			},
		];
		await expectRendersCleanly(
			<Chart width={600} height={400} elements={elements}>
				<Donut name="fette" config={{ innerRadius: 20 }} />
			</Chart>,
		);
	});

	it("angle-donut", async () => {
		const elements: Serie[] = [
			{
				name: "kpi",
				type: "angle-donut",
				data: [
					{ name: "a", value: 30, maxValue: 100 },
					{ name: "b", value: 60, maxValue: 100 },
				],
			},
		];
		await expectRendersCleanly(
			<Chart width={600} height={400} elements={elements}>
				<AngleDonut name="kpi" config={{ innerRadius: 15, showTrack: true }} />
			</Chart>,
		);
	});

	it("threshold (con serie di riferimento)", async () => {
		const elements: Serie[] = [
			{
				name: "vendite",
				type: "bar",
				axisName: "vendite",
				data: [
					{ date: "a", value: 10 },
					{ date: "b", value: 40 },
					{ date: "c", value: 25 },
				],
			},
			{ name: "soglia", type: "threshold", axisName: "vendite", data: 30 },
		];
		await expectRendersCleanly(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="vendite" showName />
				<Bar name="vendite" />
				<Threshold name="soglia" axisName="vendite" showLabel />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
	});

	it("negative (barre con valori negativi)", async () => {
		const elements: Serie[] = [
			{
				name: "saldo",
				type: "bar",
				data: [
					{ date: "a", value: -15 },
					{ date: "b", value: 20 },
					{ date: "c", value: -5 },
				],
			},
		];
		await expectRendersCleanly(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="saldo" showName />
				<Bar name="saldo" showLabels />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
	});

	it("horizontal (barre orizzontali)", async () => {
		const elements: Serie[] = [
			{
				name: "vendite",
				type: "bar",
				data: [
					{ date: "a", value: 10 },
					{ date: "b", value: 40 },
					{ date: "c", value: 25 },
				],
			},
		];
		await expectRendersCleanly(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="vendite" showName />
				<Bar name="vendite" horizontal />
				<XAxis dataPoints={dataPoints} horizontal />
			</Chart>,
		);
	});
});
