import { describe, expect, it } from "vitest";
import { isDefined } from "../utils";

describe("isDefined", () => {
	it("ritorna true per valori definiti, inclusi i falsy come 0 e stringa vuota", () => {
		expect(isDefined(0)).toBe(true);
		expect(isDefined("")).toBe(true);
	});

	it("ritorna false per null e undefined", () => {
		expect(isDefined(null)).toBe(false);
		expect(isDefined(undefined)).toBe(false);
	});
});
