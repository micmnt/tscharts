// @vitest-environment jsdom
import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Serie } from "../../types";
import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Bar from "../bar/bar";
import Chart from "../chart/chart";
import Tooltip, {
	type TooltipProps,
	type TooltipRenderProps,
} from "../tooltip/tooltip";

const CHART_WIDTH = 600;
const CHART_HEIGHT = 400;
const TOOLTIP_WIDTH = 260;
const TOOLTIP_HEIGHT = 200;

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

	Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
		configurable: true,
		get: () => TOOLTIP_WIDTH,
	});
	Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
		configurable: true,
		get: () => TOOLTIP_HEIGHT,
	});
});

const dataPoints = ["a", "b", "c"];
const elements: Serie[] = [
	{
		name: "vendite",
		type: "bar",
		axisName: "vendite",
		uom: "€",
		color: "#123456",
		format: (value: number) => `${value} €`,
		data: [
			{ date: "a", value: 11 },
			{ date: "b", value: 22 },
			{ date: "c", value: 33 },
		],
	},
];

const tooltipEl = (c: HTMLElement) =>
	c.querySelector('[id^="cts-tooltip-"]') as HTMLElement | null;

const renderChart = (tooltipProps: Partial<TooltipProps> = {}) => {
	const view = render(
		<Chart width={CHART_WIDTH} height={CHART_HEIGHT} elements={elements}>
			<YAxis name="vendite" />
			<Bar name="vendite" />
			<XAxis dataPoints={dataPoints} />
			<Tooltip width={TOOLTIP_WIDTH} {...tooltipProps} />
		</Chart>,
	);

	const root = view.container.querySelector(".rootContainer") as HTMLElement;
	root.getBoundingClientRect = () =>
		({
			left: 0,
			top: 0,
			right: CHART_WIDTH,
			bottom: CHART_HEIGHT,
			width: CHART_WIDTH,
			height: CHART_HEIGHT,
			x: 0,
			y: 0,
		}) as DOMRect;

	return view;
};

const translationOf = (el: HTMLElement) => {
	const match = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(
		el.style.transform,
	);
	return { x: Number(match?.[1]), y: Number(match?.[2]) };
};

describe("Tooltip", () => {
	it("assente a riposo, visibile con la serie in hover", async () => {
		const { container } = renderChart();

		expect(tooltipEl(container)).toBeNull();

		const svg = container.querySelector("svg") as SVGSVGElement;
		fireEvent.mouseMove(svg, { clientX: 300, clientY: 200 });

		await waitFor(() => expect(tooltipEl(container)).toBeTruthy());
		expect(tooltipEl(container)?.textContent).toContain("vendite");
	});

	it("vive fuori dall'<svg>, cosi' il viewport non puo' tagliarlo", async () => {
		const { container } = renderChart();

		const svg = container.querySelector("svg") as SVGSVGElement;
		fireEvent.mouseMove(svg, { clientX: 300, clientY: 200 });

		await waitFor(() => expect(tooltipEl(container)).toBeTruthy());

		expect(container.querySelector('svg [id^="cts-tooltip-"]')).toBeNull();
		expect(
			container.querySelector('foreignObject[id^="cts-tooltip-"]'),
		).toBeNull();
		expect(tooltipEl(container)?.parentElement).toBe(
			container.querySelector(".rootContainer"),
		);
	});

	it("sui bordi resta interamente dentro il contenitore", async () => {
		const { container } = renderChart();
		const svg = container.querySelector("svg") as SVGSVGElement;

		const corners = [
			{ clientX: 590, clientY: 10 },
			{ clientX: 10, clientY: 390 },
			{ clientX: 590, clientY: 390 },
			{ clientX: 10, clientY: 10 },
		];

		for (const corner of corners) {
			fireEvent.mouseMove(svg, corner);

			await waitFor(() => expect(tooltipEl(container)).toBeTruthy());
			const position = translationOf(tooltipEl(container) as HTMLElement);

			expect(position.x).toBeGreaterThanOrEqual(0);
			expect(position.y).toBeGreaterThanOrEqual(0);
			expect(position.x + TOOLTIP_WIDTH).toBeLessThanOrEqual(CHART_WIDTH);
			expect(position.y + TOOLTIP_HEIGHT).toBeLessThanOrEqual(CHART_HEIGHT);
		}
	});
});

describe("Tooltip — render prop", () => {
	it("sostituisce l'intero riquadro, non solo le righe", async () => {
		const { container } = renderChart({
			render: () => <div data-testid="custom">tooltip mio</div>,
		});

		const svg = container.querySelector("svg") as SVGSVGElement;
		fireEvent.mouseMove(svg, { clientX: 300, clientY: 200 });

		await waitFor(() => expect(tooltipEl(container)).toBeTruthy());

		expect(container.querySelector('[data-testid="custom"]')).toBeTruthy();
		expect(container.querySelector(".tooltipContainer")).toBeNull();
		expect(container.querySelector(".tooltipTitle")).toBeNull();
		expect(container.querySelector(".tooltipFooter")).toBeNull();
	});

	it("riceve etichetta, indice e righe gia' risolte", async () => {
		let received: TooltipRenderProps | null = null;

		const { container } = renderChart({
			render: (renderProps) => {
				received = renderProps;
				return <div>tooltip mio</div>;
			},
		});

		const svg = container.querySelector("svg") as SVGSVGElement;
		fireEvent.mouseMove(svg, { clientX: 300, clientY: 200 });

		await waitFor(() => expect(received).not.toBeNull());

		const props = received as unknown as TooltipRenderProps;
		expect(props.label).toBe("b");
		expect(props.index).toBe(1);
		expect(props.series).toHaveLength(1);
		expect(props.series[0]).toMatchObject({
			name: "vendite",
			value: 22,
			formatted: "22 €",
			color: "#123456",
		});
		expect(props.series[0].serie).toBe(elements[0]);
	});

	it("senza width esplicita il riquadro prende la larghezza del contenuto", async () => {
		const { container } = renderChart({
			width: undefined,
			render: () => <div>tooltip mio</div>,
		});

		const svg = container.querySelector("svg") as SVGSVGElement;
		fireEvent.mouseMove(svg, { clientX: 300, clientY: 200 });

		await waitFor(() => expect(tooltipEl(container)).toBeTruthy());

		expect(tooltipEl(container)?.style.width).toBe("");
	});
});

describe("Tooltip — customElement", () => {
	it("non emette il warning di React sulle key", async () => {
		const errors: string[] = [];
		const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
			errors.push(args.map(String).join(" "));
		});

		const { container } = renderChart({
			customElement: ({ name, value }) => <div>{`${name} ${value}`}</div>,
		});

		const svg = container.querySelector("svg") as SVGSVGElement;
		fireEvent.mouseMove(svg, { clientX: 300, clientY: 200 });

		await waitFor(() => expect(tooltipEl(container)).toBeTruthy());
		spy.mockRestore();

		expect(errors.filter((error) => error.includes("key"))).toEqual([]);
		expect(tooltipEl(container)?.textContent).toContain("vendite 22");
	});
});
