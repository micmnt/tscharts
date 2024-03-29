/* Context Imports */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";

/* Core Imports */
import { generatePiePaths } from "../../lib/core";
import { PieSerieEl } from "../../types";

export type PieProps = {
  name: string;
};

const Pie = (props: PieProps) => {
  const { name } = props;

  const ctx = useCharts();

  const theme = useChartsTheme();

  if (!ctx || !theme) return null;

  const { elements } = ctx;

  const { padding } = theme;

  if (!elements) return null;

  const serieElement = elements.find((el) => el.name === name);

  if (!serieElement) return null;

  const { paths, dataPoints } = generatePiePaths(serieElement, {
    ...ctx,
    padding,
  });

  const serieLabels = serieElement.labels ?? [];

  const serieData = serieElement.data as PieSerieEl[];

  const slicesColors = serieData.map(
    (el, elIndex) => el.color ?? theme.seriesColors?.[elIndex],
  );

  const slices = paths.map((path, pathIndex) => (
    <path
      d={path}
      fill={slicesColors[pathIndex]}
      key={path}
      shapeRendering="geometricPosition"
    />
  ));
  const labels = serieLabels.map((label) => (
    <text
      textAnchor="middle"
      fontSize={14}
      fontWeight="bold"
      fill={"white"}
      key={label.name}
      x={dataPoints.get(label.name)?.x}
      y={dataPoints.get(label.name)?.y}
    >
      {label.value}
    </text>
  ));

  return [...slices, ...labels];
};

export default Pie;
