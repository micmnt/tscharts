/* Types Imports */
import { ChartState, PieSerieEl, Serie, ThemeState } from "../../types";

/* Context Imports */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";

/* Styles Imports */
import "../../styles.css";
import { ReactNode } from "react";

export type LegendProps = {
  showDots?: boolean;
  height?: number;
  customLabel?: (el: PieSerieEl | Serie) => ReactNode;
  direction?: "horizontal" | "vertical";
};

export const DEFAULT_LEGEND_HEIGHT = 60;

// Funzione che genera la legenda per un grafico di tipo XY
const generateXYChartLenged = (
  timeSeriesElements: Serie[],
  theme: ThemeState | null,
  showDots: boolean,
  customLabel: ((el: PieSerieEl | Serie) => ReactNode) | null,
) => {
  return timeSeriesElements?.map((element, elementIndex) => (
    <div className="legendItemContainer" key={`${element.name}-legend`}>
      {showDots && (
        <div
          className="legendItemCircle"
          style={{
            backgroundColor:
              element.color ?? theme?.seriesColors?.[elementIndex],
          }}
        />
      )}
      {customLabel ? (
        customLabel(element)
      ) : (
        <span className="legendItemText">{element.name}</span>
      )}
    </div>
  ));
};

// Funzione che genera la legenda per un grafico a torta
const generatePieChartLegend = (
  pieSerieElements: PieSerieEl[],
  theme: ThemeState | null,
  showDots: boolean,
  customLabel: ((el: PieSerieEl | Serie) => ReactNode) | null,
) => {
  return pieSerieElements?.map((element, elementIndex) => (
    <div className="legendItemContainer" key={`${element.name}-legend`}>
      {showDots && (
        <div
          className="legendItemCircle"
          style={{
            backgroundColor:
              element.color ?? theme?.seriesColors?.[elementIndex],
          }}
        />
      )}
      {customLabel ? (
        customLabel(element)
      ) : (
        <span className="legendItemText">{element.name}</span>
      )}
    </div>
  ));
};

const Legend = (props: LegendProps) => {
  const {
    showDots = true,
    customLabel = null,
    direction = "horizontal",
    height = DEFAULT_LEGEND_HEIGHT,
  } = props;

  const ctx = useCharts();

  const theme = useChartsTheme();

  if (!theme) return null;

  const { padding } = theme;

  const { elements, chartXStart, chartXEnd, chartYEnd } = ctx as ChartState;

  const legendY = 1.5 * padding + chartYEnd!;
  const legendWidth = chartXEnd! - chartXStart!;

  if (!elements) return null;

  const timeSerieElements = elements.filter((el) => el.type !== "pie");

  const pieSerieElements = elements.filter((el) => el.type === "pie")?.[0]
    ?.data;

  const legendContainerSyle =
    direction === "vertical" ? "legendVerticalContainer" : "legendContainer";

  return (
    <foreignObject
      x={chartXStart}
      y={legendY}
      width={legendWidth > 0 ? legendWidth : 20}
      height={height}
    >
      <div className={legendContainerSyle}>
        {timeSerieElements.length > 0
          ? generateXYChartLenged(
              timeSerieElements,
              theme,
              showDots,
              customLabel,
            )
          : generatePieChartLegend(
              pieSerieElements as PieSerieEl[],
              theme,
              showDots,
              customLabel,
            )}
      </div>
    </foreignObject>
  );
};

export default Legend;
