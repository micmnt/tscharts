import {
	Controls,
	Description,
	Primary,
	Stories,
	Subtitle,
	Title,
} from "@storybook/addon-docs/blocks";
import type { Preview } from "@storybook/react";

const preview: Preview = {
	tags: ["autodocs"],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		options: {
			storySort: {
				order: ["Introduction", "Migrazione", "*", "Changelog"],
			},
		},
		docs: {
			// Template autodocs: l'esempio di utilizzo (Description) va SOTTO il
			// grafico (Primary) e SOPRA le proprietà (Controls). Le pagine MDX
			// custom (bar, line, ...) non usano questo template.
			page: () => (
				<>
					<Title />
					<Subtitle />
					<Primary />
					<Description />
					<Controls />
					<Stories />
				</>
			),
		},
	},
};

export default preview;
