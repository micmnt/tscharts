import { describe, expect, it } from "vitest";
import { computeGlobalConfig } from "../globalConfig";

describe("computeGlobalConfig", () => {
	it("copia le chiavi di layout impostate", () => {
		expect(
			computeGlobalConfig({ barWidth: 40, barGroupGap: 8, barOffset: 2 }),
		).toEqual({ barWidth: 40, barGroupGap: 8, barOffset: 2 });
	});

	it("senza layoutConfig ritorna un oggetto vuoto", () => {
		expect(computeGlobalConfig()).toEqual({});
		expect(computeGlobalConfig(undefined)).toEqual({});
	});

	it("ignora le chiavi undefined (non le mette nel risultato)", () => {
		expect(
			computeGlobalConfig({
				barWidth: 40,
				barGroupGap: undefined,
				barOffset: undefined,
			}),
		).toEqual({ barWidth: 40 });
	});
});
