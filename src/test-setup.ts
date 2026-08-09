// Setup dei test (vitest). Gira per tutti i file, ma i mock DOM si applicano
// solo quando c'e' un DOM (test dei componenti con `// @vitest-environment
// jsdom`): nei test node HTMLElement non esiste e il blocco viene saltato.
if (typeof HTMLElement !== "undefined") {
	// jsdom non calcola il layout: clientWidth/clientHeight sono sempre 0. Con
	// dimensioni 0, getChartDimensions produrrebbe un chartYEnd negativo e
	// initializeChart non propagherebbe le dimensioni (R18), quindi il chart non
	// disegnerebbe nulla. Forniamo dimensioni fisse plausibili al container.
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
