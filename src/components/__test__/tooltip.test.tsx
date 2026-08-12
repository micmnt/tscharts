// @vitest-environment jsdom
import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it } from "vitest";
import type { Serie } from "../../types";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Bar from "../bar/bar";
import Chart from "../chart/chart";
import Tooltip from "../tooltip/tooltip";

beforeAll(() => {
	(SVGSVGElement.prototype as any).createSVGPoint = () => {
		const pt = {
			x: 0,
			y: 0,
			matrixTransform() {
				return { x: pt.x, y: pt.y };
			},
		};
		return pt;
	};
	(SVGSVGElement.prototype as any).getScreenCTM = () => ({
		inverse: () => ({}),
	});
});

const dataPoints = ["a", "b", "c"];
const elements: Serie[] = [
	{
		name: "vendite",
		type: "bar",
		axisName: "vendite",
		uom: "€",
		data: [
			{ date: "a", value: 11 },
			{ date: "b", value: 22 },
			{ date: "c", value: 33 },
		],
	},
];

const tooltipEl = (c: HTMLElement) =>
	c.querySelector('[id^="cts-tooltip-"]') as HTMLElement | null;

describe("Tooltip", () => {
	it("nascosto a riposo, visibile con la serie in hover", async () => {
		const { container } = render(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="vendite" />
				<Bar name="vendite" />
				<XAxis dataPoints={dataPoints} />
				<Tooltip />
			</Chart>,
		);
		await waitFor(() => expect(tooltipEl(container)).toBeTruthy());
		expect(tooltipEl(container)?.style.display).toBe("none");

		const svg = container.querySelector("svg") as SVGSVGElement;
		fireEvent.mouseMove(svg, { clientX: 300, clientY: 200 });

		await waitFor(() =>
			expect(tooltipEl(container)?.style.display).toBe("block"),
		);
		expect(tooltipEl(container)?.textContent).toContain("vendite");
	});
});
