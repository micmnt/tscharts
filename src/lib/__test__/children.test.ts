import { createElement, Fragment } from "react";
import { describe, expect, it } from "vitest";
import { flattenChildren } from "../children";

const Axis = (_props: { type?: string; name?: string }) => null;
const Bar = (_props: { name?: string }) => null;

const yAxis = (name: string) => createElement(Axis, { type: "yAxis", name });
const bar = (name: string) => createElement(Bar, { name });

const countYAxes = (flat: ReturnType<typeof flattenChildren>) =>
	flat.filter((el) => el.props?.type === "yAxis").length;

describe("flattenChildren", () => {
	it("elementi diretti: restano cosi' come sono", () => {
		const flat = flattenChildren([yAxis("a"), yAxis("b"), bar("a")]);
		expect(flat).toHaveLength(3);
		expect(countYAxes(flat)).toBe(2);
	});

	it("scende dentro i Fragment", () => {
		const fragment = createElement(Fragment, null, yAxis("a"), yAxis("b"));
		const flat = flattenChildren([fragment, bar("a")]);
		expect(countYAxes(flat)).toBe(2);
	});

	it("appiattisce gli array (es. da .map)", () => {
		const mapped = ["a", "b"].map((name) => yAxis(name));
		const flat = flattenChildren([mapped, bar("a")]);
		expect(countYAxes(flat)).toBe(2);
	});

	it("gestisce combinazioni annidate (Fragment che contiene un .map)", () => {
		const inner = createElement(
			Fragment,
			null,
			["a", "b", "c"].map((name) => yAxis(name)),
		);
		const flat = flattenChildren([inner, bar("a")]);
		expect(countYAxes(flat)).toBe(3);
	});

	it("ignora i figli non-elementi (stringhe, null, boolean)", () => {
		const flat = flattenChildren([yAxis("a"), null, "testo", false, bar("a")]);
		expect(flat).toHaveLength(2);
	});

	it("un singolo child (non array) e' gestito", () => {
		const flat = flattenChildren(yAxis("solo"));
		expect(flat).toHaveLength(1);
		expect(countYAxes(flat)).toBe(1);
	});
});
