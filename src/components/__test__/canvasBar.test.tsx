// @vitest-environment jsdom
import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Bar from "../bar/bar";
import Chart from "../chart/chart";

// jsdom non ha Path2D ne' un context 2D reale: li stubbo cosi' il CanvasSurface
// puo' fare hit-test. isPointInPath ritorna sempre true -> hitTest prende
// l'ULTIMA region (topmost) = l'ultima barra: sufficiente a provare il wiring
// click -> hitTest -> onBarClick(data[i]).
beforeAll(() => {
	(globalThis as any).Path2D = class {
		d: string;
		constructor(d: string) {
			this.d = d;
		}
	};
	const fakeCtx = new Proxy(
		{},
		{
			get(_t, prop) {
				if (prop === "isPointInPath") return () => true;
				return () => {};
			},
			set() {
				return true;
			},
		},
	);
	(HTMLCanvasElement.prototype as any).getContext = () => fakeCtx;
	// geometria svg (identita') per convertToSVGPoint
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
const data = [
	{ date: "a", value: 10 },
	{ date: "b", value: 20 },
	{ date: "c", value: 30 },
];
const elements = [{ name: "s", type: "bar" as const, uom: "", data }];

describe("renderer canvas — Bar (increment 2)", () => {
	it("svg: barre visibili; canvas con onBarClick: rect a11y INVISIBILI + canvas", async () => {
		const svg = render(
			<Chart width={600} height={300} elements={elements}>
				<YAxis name="s" showLine />
				<Bar name="s" onBarClick={() => {}} />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() =>
			expect(svg.container.querySelector('[role="button"]')).toBeTruthy(),
		);
		const svgBars = svg.container.querySelectorAll('[role="button"]');
		expect(svgBars.length).toBe(3);
		expect(svgBars[0].getAttribute("fill")).not.toBe("none"); // barre visibili
		expect(svg.container.querySelector("canvas")).toBeNull();

		// canvas + onBarClick: rect focusabili per a11y, ma INVISIBILI (fill none,
		// pointer-events none: mouse/touch passa al canvas).
		const cvs = render(
			<Chart width={600} height={300} elements={elements} renderer="canvas">
				<YAxis name="s" showLine />
				<Bar name="s" onBarClick={() => {}} />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() =>
			expect(cvs.container.querySelector("canvas")).toBeTruthy(),
		);
		const a11yBars = cvs.container.querySelectorAll('[role="button"]');
		expect(a11yBars.length).toBe(3);
		expect(a11yBars[0].getAttribute("fill")).toBe("none");
		expect((a11yBars[0] as SVGElement).style.pointerEvents).toBe("none");
	});

	it("canvas SENZA onBarClick: nessun nodo barra (0 DOM)", async () => {
		const { container } = render(
			<Chart width={600} height={300} elements={elements} renderer="canvas">
				<YAxis name="s" showLine />
				<Bar name="s" />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("canvas")).toBeTruthy());
		expect(container.querySelectorAll('[role="button"]').length).toBe(0);
	});

	it("canvas: tastiera (Enter) su una barra a11y scatta onBarClick", async () => {
		const onBarClick = vi.fn();
		const { container } = render(
			<Chart width={600} height={300} elements={elements} renderer="canvas">
				<YAxis name="s" showLine />
				<Bar name="s" onBarClick={onBarClick} />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() =>
			expect(container.querySelector('[role="button"]')).toBeTruthy(),
		);
		const bars = container.querySelectorAll('[role="button"]');
		fireEvent.keyDown(bars[1], { key: "Enter" });
		expect(onBarClick).toHaveBeenCalledWith(data[1]);
	});

	it("canvas: touch-action:none sul wrapper solo con barre draggabili", async () => {
		const draggable = render(
			<Chart width={600} height={300} elements={elements} renderer="canvas">
				<YAxis name="s" showLine />
				<Bar name="s" onBarDrag={() => {}} />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() => {
			const canvas = draggable.container.querySelector("canvas");
			expect((canvas?.parentElement as HTMLElement)?.style.touchAction).toBe(
				"none",
			);
		});

		// solo click (non draggabile): il wrapper resta scrollabile
		const clickOnly = render(
			<Chart width={600} height={300} elements={elements} renderer="canvas">
				<YAxis name="s" showLine />
				<Bar name="s" onBarClick={() => {}} />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() =>
			expect(clickOnly.container.querySelector("canvas")).toBeTruthy(),
		);
		const wrapper = clickOnly.container.querySelector("canvas")
			?.parentElement as HTMLElement;
		expect(wrapper.style.touchAction).not.toBe("none");
	});

	it("canvas: click su una barra scatta onBarClick (hit-test via isPointInPath)", async () => {
		const onBarClick = vi.fn();
		const { container } = render(
			<Chart width={600} height={300} elements={elements} renderer="canvas">
				<YAxis name="s" showLine />
				<Bar name="s" onBarClick={onBarClick} />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("canvas")).toBeTruthy());
		const svg = container.querySelector("svg") as SVGSVGElement;
		// il click sull'svg bolla sul div wrapper -> hit-test -> ultima barra
		fireEvent.click(svg, { clientX: 100, clientY: 100 });
		expect(onBarClick).toHaveBeenCalledTimes(1);
		expect(onBarClick).toHaveBeenCalledWith(data[2]);
	});
});
