// @vitest-environment jsdom
import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import type { Serie } from "../../types";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Bar from "../bar/bar";
import Chart from "../chart/chart";

const dataPoints = ["a", "b", "c"];
const data = [
	{ date: "a", value: 10 },
	{ date: "b", value: 40 },
	{ date: "c", value: 25 },
];
const elements: Serie[] = [
	{ name: "vendite", type: "bar", axisName: "vendite", data },
];

describe("Bar — interazioni (SVG)", () => {
	it("onBarClick scatta col dato della barra cliccata", async () => {
		const onBarClick = vi.fn();
		const { container } = render(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="vendite" />
				<Bar name="vendite" onBarClick={onBarClick} />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
		await waitFor(() =>
			expect(container.querySelector('[role="button"]')).toBeTruthy(),
		);
		const bars = container.querySelectorAll('[role="button"]');
		expect(bars.length).toBe(data.length);
		fireEvent.click(bars[1]);
		expect(onBarClick).toHaveBeenCalledWith(data[1]);
	});

	it("showLabels disegna il valore di ogni barra", async () => {
		const { container } = render(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="vendite" />
				<Bar name="vendite" showLabels />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		const texts = Array.from(container.querySelectorAll("text")).map(
			(t) => t.textContent,
		);
		expect(texts).toContain("40");
		expect(texts).toContain("25");
	});

	it("onBarDrag emette un nuovo valore trascinando la barra verso l'alto", async () => {
		const onBarDrag = vi.fn();
		const { container } = render(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="vendite" />
				<Bar name="vendite" onBarClick={() => {}} onBarDrag={onBarDrag} />
				<XAxis dataPoints={dataPoints} />
			</Chart>,
		);
		await waitFor(() =>
			expect(container.querySelector('[role="button"]')).toBeTruthy(),
		);
		const bar = container.querySelectorAll('[role="button"]')[1];
		fireEvent.pointerDown(bar, { clientY: 300 });
		window.dispatchEvent(new MouseEvent("pointermove", { clientY: 250 }));
		window.dispatchEvent(new MouseEvent("pointerup", { clientY: 250 }));
		expect(onBarDrag).toHaveBeenCalled();
		const payload = onBarDrag.mock.calls.at(-1)?.[0];
		expect(payload.index).toBe(1);
		expect(payload.previousValue).toBe(40);
		expect(payload.value).toBeGreaterThan(40);
	});
});
