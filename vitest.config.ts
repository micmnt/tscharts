import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Environment di default node (i test in lib/ sono puri). I test dei
		// componenti dichiarano `// @vitest-environment jsdom` in testa.
		environment: "node",
		include: ["src/**/__test__/**/*.test.{ts,tsx}"],
		// Mocka le dimensioni del container (jsdom le dà 0), condizionale cosi'
		// e' innocuo per i test node.
		setupFiles: ["./src/test-setup.ts"],
	},
});
