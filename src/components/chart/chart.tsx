/* Types Imports */
import { Serie, TimeSerieEl } from "../../types";

/* React Imports */
import { JSX, useEffect, useMemo, useRef, useState } from "react";

/* Core Imports */
import { getAxisCount, getTimeSerieMaxValue } from "../../lib/core";

/* Context Imports */
import { ChartProvider } from "../../contexts/chartContext";

/* Styles Imports */
import "../../styles.css";

/* Components Imports */
import Svg from "../../components/svg/svg";

/* Utils Imports */
import { nanoid } from "nanoid";

type ChartProps = {
  elements: Serie[];
  width: number;
  height: number;
  children: React.ReactNode;
};

const Chart = (props: ChartProps) => {
  const { elements, width, height, children } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [chartID, setChartID] = useState<string | null>(null);

  const normalizedChildren = Array.isArray(children) ? children : [children];
  // Conto il numero di assi in base ai componenti all'interno di Chart che rappresentano un asse Y
  const yAxisCount = (normalizedChildren as JSX.Element[]).filter(
    (childEl) => childEl.props?.type === "yAxis",
  )?.length;

  const timeSeriesElements = elements.filter(
    (el) => el.type === "line" || el.type === "bar",
  );
  const timeSeriesMaxValue = Math.max(
    ...timeSeriesElements.map((timeSerie) =>
      getTimeSerieMaxValue(timeSerie.data as TimeSerieEl[]),
    ),
  );

  const { leftAxisCount, rightAxisCount } = getAxisCount(yAxisCount);

  useEffect(() => {
    setChartID(nanoid());
  }, []);

  const initialState = useMemo(
    () => ({
      elements,
      chartID: null,
      svgRef: null,
      mousePosition: { x: 0, y: 0 },
      tooltipPosition: { x: 0, y: 0 },
      hoveredElement: null,
      width,
      height,
      chartXStart: 0,
      chartXEnd: 0,
      chartYEnd: 0,
      timeSeriesMaxValue,
    }),
    [elements, height, timeSeriesMaxValue, width],
  );

  if (!chartID) return null;

  return (
    <ChartProvider initialState={initialState}>
      <div ref={chartContainerRef} className="rootContainer">
        <Svg
          containerRef={chartContainerRef}
          leftAxisCount={leftAxisCount}
          rightAxisCount={rightAxisCount}
          chartID={chartID}
        >
          {children}
        </Svg>
      </div>
    </ChartProvider>
  );
};

export default Chart;
