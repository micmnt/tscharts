import { getChartTimeScale } from "../../../lib/core";
import { warnDev } from "../../../lib/utils";
import type { XAxisProps } from "../axisProps";
import { useAxisBase } from "../useAxisBase";
import CategoryXAxis from "./categoryXAxis";
import HorizontalXAxis from "./horizontalXAxis";
import TimeXAxis from "./timeXAxis";

export type { XAxisProps } from "../axisProps";

const XAxis = (props: XAxisProps) => {
	const { horizontal = false } = props;

	const { ctx, theme } = useAxisBase();

	if (!ctx || !theme) {
		warnDev("<XAxis /> deve essere renderizzato dentro <Chart>.");
		return null;
	}

	if (horizontal) return <HorizontalXAxis {...props} />;

	const timeScale =
		ctx.scaleType === "time"
			? getChartTimeScale({ ...ctx, padding: theme.padding })
			: null;

	if (timeScale) return <TimeXAxis {...props} />;

	return <CategoryXAxis {...props} />;
};

export default XAxis;
