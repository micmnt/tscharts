/* Types Imports */

/* React Imports */
import { type JSX, useEffect, useMemo, useRef, useState } from "react";
/* Context Imports */
import { ChartProvider } from "../../contexts/chartContext";

/* Core Imports */
import { getAxisCount, getTimeSerieMaxValue } from "../../lib/core";
import type { Serie, TimeSerieEl } from "../../types";

/* Styles Imports */
import "../../styles.css";

/* Utils Imports */
import { nanoid } from "nanoid";
/* Components Imports */
import Svg from "../../components/svg/svg";

type ChartProps = {
	elements: Serie[];
	width: number;
	height: number;
	style?: any;
	children: React.ReactNode;
	name?: string;
	flatMax?: boolean;
};

const Chart = (props: ChartProps) => {
	const {
		elements,
		width,
		height,
		children,
		style,
		name = "chart",
		flatMax = true,
	} = props;

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

	// Controllo se nelle serie da graficare ci sono elementi con valore negativo
	const negative = timeSeriesElements
		.flatMap((timeSerieEl) => timeSerieEl.data as TimeSerieEl[])
		?.some((el) => el.value < 0);

	const { leftAxisCount, rightAxisCount } = getAxisCount(yAxisCount);

	useEffect(() => {
		setChartID(`${nanoid()}-${name}`);
	}, [name]);

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
			negative,
			chartXStart: 0,
			chartXEnd: 0,
			chartYEnd: 0,
			chartYMiddle: 0,
			flatMax,
			timeSeriesMaxValue,
		}),
		[elements, height, timeSeriesMaxValue, width, negative, flatMax],
	);

	if (!chartID) return null;

	return (
		<ChartProvider initialState={initialState}>
			<div ref={chartContainerRef} className="rootContainer">
				<Svg
					style={style}
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
