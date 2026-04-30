import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
export default defineConfig({
	build: {
		lib: {
			entry: "./src/index.ts", // Specifies the entry point for building the library.
			name: "vite-react-ts-button", // Sets the name of the generated library.
			fileName: (format) => `index.${format}.js`, // Generates the output file name based on the format.
			formats: ["es"],
			cssFileName: "style",
		},
		rolldownOptions: {
			external: [
				"react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime"
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
