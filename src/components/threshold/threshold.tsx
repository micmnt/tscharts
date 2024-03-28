/* Types Imports */
import { ChartState, ThemeState } from "../../types";

/* Core Imports */
import { getValuePosition } from "../../lib/core";

/* Context Imports */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";
import { isDefined } from "../../lib/utils";

type ThresholdProps = {
  name: string;
  dashed?: boolean;
  type?: "vertical" | "horizontal";
  showLabel?: boolean;
};
const Threshold = (props: ThresholdProps) => {
  const theme = useChartsTheme() as ThemeState;
  const ctx = useCharts() as ChartState;

  const {
    dashed = false,
    type = "horizontal",
    name,
    showLabel = false,
  } = props;

  const { chartXStart, chartXEnd, chartYEnd, timeSeriesMaxValue, elements } =
    ctx;

  const thresholdElement = elements?.find((el) => el.name === name);

  if (!thresholdElement) return null;

  const thresholdValue = thresholdElement.data as number;

  if (!isDefined(thresholdValue)) return null;

  const { padding } = theme;

  const position = getValuePosition(
    timeSeriesMaxValue!,
    thresholdValue,
    chartYEnd! - padding,
  );

  const svgValue = chartYEnd! - position;

  const textY =
    svgValue - padding / 2 < padding
      ? svgValue + padding
      : svgValue - padding / 2;

  const path =
    type === "vertical"
      ? `M ${svgValue} ${chartYEnd} V ${0}`
      : `M ${chartXStart} ${svgValue} H ${chartXEnd}`;

  return (
    <>
      <path
        d={path}
        strokeDasharray={dashed ? theme.threshold?.dash : 0}
        strokeLinecap="round"
        strokeWidth={theme.threshold?.size}
        stroke={thresholdElement.color ?? theme.seriesColors?.[1]}
      />
      {showLabel && (
        <text
          textAnchor="end"
          x={chartXEnd! - padding}
          y={textY}
          fontSize={theme.threshold?.textSize}
          fontWeight={600}
          fill={thresholdElement.color}
        >
          {thresholdElement.format
            ? thresholdElement.format(thresholdValue)
            : thresholdValue}
        </text>
      )}
    </>
  );
};

export default Threshold;
