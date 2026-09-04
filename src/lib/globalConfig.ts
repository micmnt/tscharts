export type GlobalConfig = {
	barWidth?: number | "auto";
	barGroupGap?: number;
	barOffset?: number;
};

export type ChartLayoutConfig = GlobalConfig;

export const computeGlobalConfig = (
	layoutConfig?: ChartLayoutConfig,
): GlobalConfig => {
	const result: GlobalConfig = {};
	if (!layoutConfig) return result;

	if (layoutConfig.barWidth !== undefined)
		result.barWidth = layoutConfig.barWidth;
	if (layoutConfig.barGroupGap !== undefined)
		result.barGroupGap = layoutConfig.barGroupGap;
	if (layoutConfig.barOffset !== undefined)
		result.barOffset = layoutConfig.barOffset;

	return result;
};
