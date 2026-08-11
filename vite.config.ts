import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
export default defineConfig({
	build: {
		lib: {
			// Entry multiplo: il base (index) e il layer di trasformazione dati
			// (transform), esposto come subpath separato `tscharts/transform` cosi'
			// da non pesare sul bundle base (T1).
			entry: {
				index: "./src/index.ts",
				transform: "./src/transform.ts",
			},
			name: "tscharts", // Sets the name of the generated library.
			fileName: (format, entryName) => `${entryName}.${format}.js`, // es. index.es.js / transform.es.js
			formats: ["es"],
			cssFileName: "style",
		},
		rolldownOptions: {
			external: [
				"react",
				"react-dom",
				"react/jsx-runtime",
				"react/jsx-dev-runtime",
			], // Defines external dependencies for Rollup bundling.
		},
		sourcemap: true, // Generates source maps for debugging.
		emptyOutDir: true, // Clears the output directory before building.
	},
	plugins: [
		dts({
			insertTypesEntry: true,
			outDir: "./dist",
			entryRoot: "src",
			include: ["src"],
			tsconfigPath: "./tsconfig.json",
			exclude: ["**/*.css", "src/**/__docs__", "src/**/__test__"],
			beforeWriteFile: (filePath, content) => ({
				filePath: filePath.replace("/dist/src/", "/dist/"),
				content,
			}),
		}),
	], // Uses the 'vite-plugin-dts' plugin for generating TypeScript declaration files (d.ts).
});
