import type { ThemeState } from "../types";

const deepFreeze = <T>(obj: T): T => {
	for (const value of Object.values(obj as Record<string, unknown>)) {
		if (value && typeof value === "object") deepFreeze(value);
	}
	return Object.freeze(obj);
};

const seriesColors = ["#3376bd", "#edae49", "#e63946", "#0079bc"];

const defaultTheme: ThemeState = deepFreeze({
	padding: 25,
	yInterval: 5,
	grid: {
		color: "#e3e3e3",
		size: 1,
		dashed: false,
	},
	line: {
		size: 3,
	},
	legend: {
		textColor: "#4f4f4f",
		textSize: 12,
	},
	axis: {
		color: "#e3e3e3",
		labelColor: "#4f4f4f",
		titleColor: "#4f4f4f",
		size: 2,
		labelSize: 12,
		titleSize: 12,
	},
	threshold: {
		size: 2,
		dash: 15,
		textSize: 12,
	},
	tooltip: {
		grid: {
			color: "#4f4f4f",
			size: 1,
		},
	},
	seriesColors,
});

export const mergeTheme = (
	base: ThemeState,
	override?: Partial<ThemeState>,
): ThemeState => {
	if (!override) return base;
	return {
		...base,
		...override,
		grid: { ...base.grid, ...override.grid },
		line: { ...base.line, ...override.line },
		legend: { ...base.legend, ...override.legend },
		threshold: { ...base.threshold, ...override.threshold },
		axis: { ...base.axis, ...override.axis },
		tooltip: {
			...base.tooltip,
			...override.tooltip,
			grid: { ...base.tooltip?.grid, ...override.tooltip?.grid },
		},
		seriesColors: override.seriesColors ?? base.seriesColors,
	};
};

export default defaultTheme;
