// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import type { Serie } from "../../types";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Bar from "../bar/bar";
import Chart from "../chart/chart";
import Threshold from "../threshold/threshold";

const dataPoints = ["a", "b", "c"];
// valori barra (10/40/25) e soglia 33: 33 non e' un valore barra ne' un tick
// tondo, quindi la sua comparsa come testo prova la label della soglia.
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
	{ name: "soglia", type: "threshold", axisName: "vendite", data: 33 },
];

describe("Threshold", () => {
	it("disegna la linea di soglia e, con showLabel, la label del valore", async () => {
		const { container } = render(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="vendite" showLine />
				<Bar name="vendite" />
				<Threshold name="soglia" axisName="vendite" showLabel />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		// la label della soglia (33) e' presente
		expect(container.textContent).toContain("33");
	});
});
