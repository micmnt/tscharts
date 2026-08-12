export type GlobalConfig = {
	barWidth?: number;
	barGroupGap?: number;
	barOffset?: number;
};

export type ChartLayoutConfig = GlobalConfig;

const LAYOUT_KEYS = [
	"barWidth",
	"barGroupGap",
	"barOffset",
] as const satisfies readonly (keyof ChartLayoutConfig)[];

export const computeGlobalConfig = (
	layoutConfig?: ChartLayoutConfig,
): GlobalConfig => {
	const result: GlobalConfig = {};
	if (layoutConfig) {
		for (const key of LAYOUT_KEYS) {
			const value = layoutConfig[key];
			if (value !== undefined) result[key] = value;
		}
	}
	return result;
};
