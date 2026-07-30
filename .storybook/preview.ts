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
				order: ["Introduction", "*"],
			},
		},
	},
};

export default preview;
