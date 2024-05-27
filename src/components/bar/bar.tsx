/* Types Imports */
import { ThemeState, TimeSerieEl } from "../../types";

/* Context Imports */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";

/* Core Imports */
import { generateDataPaths, generateStackedDataPaths } from "../../lib/core";
import { nanoid } from "nanoid";

export type BarProps = {
  name: string;
  stacked?: boolean;
  showLabels?: boolean;
  config?: {
    barWidth?: number;
  };
};

const Bar = (props: BarProps) => {
  const { name, config, stacked = false, showLabels = false } = props;

  const ctx = useCharts();

  const theme = useChartsTheme() as ThemeState;

  if (!ctx || !theme) return null;

  const { elements } = ctx;

  const { padding } = theme;

  const { barWidth = padding } = config || {};

  const serieElement = elements?.find((el) => el.name === name);

  if (!serieElement) return null;

  const { paths, dataPoints } = stacked
    ? generateStackedDataPaths(serieElement, { ...ctx, padding, barWidth }) ??
      {}
    : generateDataPaths(serieElement, { ...ctx, padding, barWidth }, "bar") ??
      {};

  const serieIndex = elements?.findIndex((el) => el.name === serieElement.name);

  const serieColor =
    serieElement.color ??
    theme.seriesColors?.[serieIndex ?? 0] ??
    theme.seriesColors?.[0];

  const barPoints = dataPoints?.get(serieElement.name) ?? [];

  if (!paths) return null;

  return (
    <>
      {paths.map((p) => (
        <path key={`${p}-${nanoid()}`} d={p} fill={serieColor} />
      ))}
      {showLabels &&
        barPoints
          .map((point: [x: number, y: number], dataPointIndex: number) =>
            point[0] > -1 ? (
              <text
                textAnchor="middle"
                fontSize={12}
                fontWeight="bold"
                fill="white"
                key={`${serieElement.name}-${point[0]}-${point[1]}-${nanoid()}`}
                x={point[0]}
                y={point[1]}
              >
                {serieElement.format
                  ? serieElement.format(
                      (serieElement?.data as TimeSerieEl[])?.[dataPointIndex]
                        ?.value,
                    )
                  : (serieElement?.data as TimeSerieEl[])?.[dataPointIndex]
                      ?.value}
              </text>
            ) : null,
          )
          .filter((el: [x: number, y: number]) => el !== null)}
    </>
  );
};

export default Bar;
