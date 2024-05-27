/* Types Imports */
import { TimeSerieEl } from "../../types";

/* Core Imports */
import { generateDataPaths } from "../../lib/core";

/*  */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";
import { nanoid } from "nanoid";

export type LineProps = {
  name: string;
  hideLine?: boolean;
  showDots?: boolean;
  labelYOffset?: number;
  labelSize?: number;
  dashed?: boolean;
  showLabels?: boolean;
};

const Line = (props: LineProps) => {
  const {
    name,
    dashed = false,
    showDots = false,
    showLabels = false,
    labelYOffset = 0,
    hideLine = false,
    labelSize = 12,
  } = props;

  const ctx = useCharts();

  const theme = useChartsTheme();

  if (!ctx || !theme) return null;

  const { hoveredElement, elements } = ctx;

  const { padding } = theme;

  if (!elements) return null;

  const serieElement = elements.find((el) => el.name === name);

  if (!serieElement) return null;

  const { paths, dataPoints } =
    generateDataPaths(serieElement, { ...ctx, padding }, "line") ?? {};

  const linePath = paths?.join() ?? "";

  const linePoints = dataPoints?.get(serieElement.name) ?? [];

  const serieIndex = elements.findIndex((el) => el.name === serieElement.name);

  const serieColor =
    serieElement.color ??
    theme?.seriesColors?.[serieIndex] ??
    theme?.seriesColors?.[0];

  const dotRadius = showDots ? 3 : 0;

  const labelYSpacing = padding / 2 + labelYOffset;

  return (
    <>
      {!hideLine && (
        <path
          strokeLinecap="round"
          strokeDasharray={dashed ? theme.threshold?.dash : 0}
          strokeLinejoin="round"
          d={linePath}
          strokeWidth={theme?.line?.size}
          fill="none"
          stroke={serieColor}
        />
      )}
      {showLabels &&
        linePoints.map(
          (point: [x: number, y: number], dataPointIndex: number) => (
            <text
              textAnchor="middle"
              fontSize={labelSize}
              fontWeight="bold"
              fill={serieColor}
              key={`${serieElement.name}-${point[0]}-${point[1]}-${nanoid()}`}
              x={point[0]}
              y={point[1] - labelYSpacing}
            >
              {serieElement.format
                ? serieElement.format(
                    (serieElement?.data as TimeSerieEl[])?.[dataPointIndex]
                      ?.value,
                  )
                : (serieElement?.data as TimeSerieEl[])?.[dataPointIndex]
                    ?.value}
            </text>
          ),
        )}
      {!hideLine &&
        linePoints
          .filter((el: [x: number, y: number]) => el.length > 0)
          .map((point: [x: number, y: number], dataPointIndex: number) => (
            <circle
              key={`${serieElement.name}-${point[0]}-${point[1]}-${nanoid()}`}
              cx={point[0]}
              cy={point[1]}
              r={
                hoveredElement?.elementIndex === dataPointIndex ? 7 : dotRadius
              }
              fillOpacity={0.7}
              fill={serieColor}
              stroke={serieColor}
              strokeWidth={2}
            />
          ))}
    </>
  );
};

export default Line;
