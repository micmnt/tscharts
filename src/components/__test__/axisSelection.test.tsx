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
const elements: Serie[] = [
	{
		name: "vendite",
		type: "bar",
		axisName: "vendite",
		data: dataPoints.map((d, i) => ({ date: d, value: 10 + i * 10 })),
	},
];

describe("XAxis — selezione e click sulle label", () => {
	it("selectedValue evidenzia la categoria (label in grassetto)", async () => {
		const { container } = render(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="vendite" />
				<Bar name="vendite" />
				<XAxis
					dataPoints={dataPoints}
					selectedValue="b"
					selectedColor="#6366f1"
				/>
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("text")).toBeTruthy());
		const labels = Array.from(container.querySelectorAll("text"));
		const selected = labels.find((t) => t.textContent === "b");
		const other = labels.find((t) => t.textContent === "a");
		expect(selected?.getAttribute("font-weight")).toBe("700");
		expect(other?.getAttribute("font-weight")).not.toBe("700");
	});

	it("onLabelClick scatta con (label, index) al click sulla label (verticale)", async () => {
		const onLabelClick = vi.fn();
		const { container } = render(
			<Chart width={600} height={400} elements={elements}>
				<YAxis name="vendite" />
				<Bar name="vendite" />
				<XAxis dataPoints={dataPoints} onLabelClick={onLabelClick} />
			</Chart>,
		);
		await waitFor(() =>
			expect(container.querySelector('[role="button"]')).toBeTruthy(),
		);
		const target = container.querySelector(
			'[role="button"][aria-label="b"]',
		) as Element;
		expect(target).toBeTruthy();
		fireEvent.click(target);
		expect(onLabelClick).toHaveBeenCalledWith("b", 1);
	});
});
