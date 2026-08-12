// solo quando c'e' un DOM (test dei componenti con `// @vitest-environment

if (typeof HTMLElement !== "undefined") {
	Object.defineProperty(HTMLElement.prototype, "clientWidth", {
		configurable: true,
		get() {
			return 600;
		},
	});
	Object.defineProperty(HTMLElement.prototype, "clientHeight", {
		configurable: true,
		get() {
			return 400;
		},
	});
}
