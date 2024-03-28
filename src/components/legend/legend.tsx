/* Types Imports */
import { ChartState, PieSerieEl, Serie, ThemeState } from "../../types";

/* Context Imports */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";

/* Styles Imports */
import "../../components/styles.css";
import { ReactNode } from "react";

type LegendProps = {
  showDots?: boolean;
  customLabel?: (el: PieSerieEl | Serie) => ReactNode;
};

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
  const { showDots = true, customLabel = null } = props;

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

  return (
    <foreignObject
      x={chartXStart}
      y={legendY}
      width={legendWidth > 0 ? legendWidth : 20}
      height={60}
    >
      <div className="legendContainer">
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
