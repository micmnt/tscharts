import { describe, expect, it } from "vitest";
import { getCategorySpacing } from "../core";

const padding = 20;

describe("getCategorySpacing", () => {
	it("bar semplice senza barWidth: ritorna padding", () => {
		const bar = { name: "a", type: "bar", data: [] };
		expect(getCategorySpacing([bar], undefined, padding)).toBe(padding);
	});

	it("bar semplice con barWidth: (barWidth + padding) / 2", () => {
		const bar = { name: "a", type: "bar", data: [] };
		expect(getCategorySpacing([bar], { barWidth: 30 }, padding)).toBe(
			(30 + padding) / 2,
		);
	});

	it("group-bar: e' centrato sull'intero gruppo, non su una singola barra", () => {
		const a = { name: "a", type: "group-bar", data: [] };
		const b = { name: "b", type: "group-bar", data: [] };
		const globalConfig = { barWidth: 15, barGroupGap: 5 };

		const spacing = getCategorySpacing([a, b], globalConfig, padding);

		const slotCount = 2;
		const groupWidth = slotCount * 15 + (slotCount - 1) * 5;
		expect(spacing).toBe(padding / 2 + groupWidth / 2);

		const singleBarFormula = (15 + padding) / 2;
		expect(spacing).not.toBe(singleBarFormula);
	});

	it("group-bar stacked: le serie con lo stesso stackedName contano come un solo slot", () => {
		const a = { name: "a", type: "group-bar", stackedName: "s1", data: [] };
		const b = { name: "b", type: "group-bar", stackedName: "s1", data: [] };
		const c = { name: "c", type: "group-bar", data: [] };
		const globalConfig = { barWidth: 15, barGroupGap: 5 };

		const spacing = getCategorySpacing([a, b, c], globalConfig, padding);

		const slotCount = 2;
		const groupWidth = slotCount * 15 + (slotCount - 1) * 5;
		expect(spacing).toBe(padding / 2 + groupWidth / 2);
	});

	it("le serie non group-bar (es. line) non contano come slot del gruppo", () => {
		const a = { name: "a", type: "group-bar", data: [] };
		const line = { name: "l", type: "line", data: [] };
		const globalConfig = { barWidth: 15, barGroupGap: 5 };

		const spacing = getCategorySpacing([a, line], globalConfig, padding);

		const slotCount = 1;
		const groupWidth = slotCount * 15 + (slotCount - 1) * 5;
		expect(spacing).toBe(padding / 2 + groupWidth / 2);
	});
});
