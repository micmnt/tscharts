// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import YAxis from "../axis/yAxis";
import Chart from "../chart/chart";
import Line from "../line/line";

const makeData = (n: number) =>
	Array.from({ length: n }, (_, i) => ({
		date: String(i),
		value: 20 + (i % 10),
	}));

const elements = (n: number) => [
	{ name: "s", type: "line" as const, uom: "", data: makeData(n) },
];

describe("renderer canvas (increment 1) — invariante e modalita'", () => {
	it("renderer='svg' (default): NESSUN <canvas>, Line rende SVG", async () => {
		const N = 10;
		const { container } = render(
			<Chart width={600} height={300} elements={elements(N)}>
				<YAxis name="s" showLine />
				<Line name="s" showDots />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("path")).toBeTruthy());
		expect(container.querySelector("canvas")).toBeNull();
		// Line SVG presente: N dot + il path linea
		expect(container.querySelectorAll("circle").length).toBe(N);
		expect(container.querySelector("path")).toBeTruthy();
	});

	it("renderer='canvas': c'e' un <canvas>, Line NON emette marche SVG", async () => {
		const N = 10;
		const { container } = render(
			<Chart width={600} height={300} elements={elements(N)} renderer="canvas">
				<YAxis name="s" showLine />
				<Line name="s" showDots />
			</Chart>,
		);
		// il canvas viene montato
		await waitFor(() => expect(container.querySelector("canvas")).toBeTruthy());
		// l'svg (assi) resta presente sopra
		expect(container.querySelector("svg")).toBeTruthy();
		// ma le marche della Line sono sul bitmap, non nel DOM: niente <circle>
		expect(container.querySelectorAll("circle").length).toBe(0);
	});

	it("il canvas e' dietro e non intercetta gli eventi (pointer-events:none)", async () => {
		const { container } = render(
			<Chart width={600} height={300} elements={elements(5)} renderer="canvas">
				<YAxis name="s" showLine />
				<Line name="s" />
			</Chart>,
		);
		await waitFor(() => expect(container.querySelector("canvas")).toBeTruthy());
		const canvas = container.querySelector("canvas") as HTMLCanvasElement;
		expect(canvas.style.pointerEvents).toBe("none");
		expect(canvas.style.position).toBe("absolute");
	});
});
