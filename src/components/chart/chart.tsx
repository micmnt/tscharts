import { type CSSProperties, useId, useMemo, useRef } from "react";

import { ChartProvider } from "../../contexts/chartContext";

import { flattenChildren } from "../../lib/children";
import {
	computeTimeDomain,
	getAxisCount,
	getEffectiveMaxValue,
	getSeriesMissingYAxis,
	getTimeSerieMaxValue,
} from "../../lib/core";
import defaultTheme, { mergeTheme } from "../../lib/defaultTheme";
import { warnDev } from "../../lib/utils";
import type { Serie, ThemeState, TimeSerie } from "../../types";

import "../../styles.css";

import Svg from "../../components/svg/svg";

import XAxis from "../axis/xAxis";
import YAxis from "../axis/yAxis";
import Bar from "../bar/bar";
import Line from "../line/line";

export type ChartProps = {
	elements: Serie[];
	width: number;
	height: number;
	style?: CSSProperties;
	children: React.ReactNode;
	name?: string;
	flatMax?: boolean;
	ariaLabel?: string;

	barWidth?: number | "auto";
	barGroupGap?: number;
	barOffset?: number;

	theme?: Partial<ThemeState>;
	renderer?: "svg" | "canvas";
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
		ariaLabel,
		barWidth,
		barGroupGap,
		barOffset,
		theme,
		renderer = "svg",
	} = props;

	const layoutConfig = useMemo(
		() => ({ barWidth, barGroupGap, barOffset }),
		[barWidth, barGroupGap, barOffset],
	);

	const mergedTheme = useMemo(() => mergeTheme(defaultTheme, theme), [theme]);

	const chartContainerRef = useRef<HTMLDivElement>(null);

	const reactId = useId();
	const chartID = `${reactId}-${name}`;

	const flatChildren = flattenChildren(children);

	const yAxisElements = flatChildren.filter(
		(childEl) => childEl.type === YAxis,
	);
	const yAxisCount = yAxisElements.length;

	const yAxisNames = yAxisElements
		.map((childEl) => childEl.props?.name)
		.filter((name): name is string => Boolean(name));
	for (const serie of getSeriesMissingYAxis(elements, yAxisNames)) {
		warnDev(
			`La serie "${serie.name}" usa l'asse "${serie.axisName ?? serie.name}" che non corrisponde a nessun <YAxis />: verra' disegnata su una scala isolata non mostrata da alcun asse. Aggiungi axisName con il nome di un asse Y esistente.`,
		);
	}

	const horizontal = flatChildren.some(
		(childEl) =>
			(childEl.type === Bar || childEl.type === Line) &&
			childEl.props?.horizontal === true,
	);

	const timeSeriesElements = elements.filter(
		(el): el is TimeSerie => el.type === "line" || el.type === "bar",
	);
	const timeSeriesMaxValue = Math.max(
		...timeSeriesElements.map((timeSerie) =>
			getTimeSerieMaxValue(timeSerie.data),
		),
	);

	const negative = timeSeriesElements
		.flatMap((timeSerieEl) => timeSerieEl.data)
		?.some((el) => el.value < 0);

	const xAxisChild = flatChildren.find((childEl) => childEl.type === XAxis);
	const scaleType: "time" | undefined =
		xAxisChild?.props?.scaleType === "time" ? "time" : undefined;
	const parseDate = xAxisChild?.props?.parseDate as
		| ((date: string) => number | Date)
		| undefined;
	const rawTimeDomain =
		scaleType === "time" ? computeTimeDomain(elements, parseDate) : undefined;
	const timeDomainMin = rawTimeDomain?.[0];
	const timeDomainMax = rawTimeDomain?.[1];

	const yMin = yAxisElements[0]?.props?.min as number | undefined;
	const yMax = yAxisElements[0]?.props?.max as number | undefined;

	const zoomable = yAxisElements[0]?.props?.zoomable === true;
	const onZoomChange = yAxisElements[0]?.props?.onZoomChange as
		| ((domain: [number, number] | null) => void)
		| undefined;
	const zoomStep = yAxisElements[0]?.props?.zoomStep as number | undefined;
	const zoomSnap = yAxisElements[0]?.props?.zoomSnap as number | undefined;
	const yBaseMin = yMin ?? 0;
	const yBaseMax = yMax ?? getEffectiveMaxValue(flatMax, timeSeriesMaxValue);
	const yBaseDomain = useMemo<readonly [number, number] | undefined>(
		() => (zoomable ? [yBaseMin, yBaseMax] : undefined),
		[zoomable, yBaseMin, yBaseMax],
	);

	const timeDomain = useMemo<readonly [number, number] | undefined>(
		() =>
			timeDomainMin !== undefined && timeDomainMax !== undefined
				? [timeDomainMin, timeDomainMax]
				: undefined,
		[timeDomainMin, timeDomainMax],
	);

	const { leftAxisCount, rightAxisCount } = getAxisCount(yAxisCount);

	const initialState = useMemo(
		() => ({
			elements,
			chartID: null,
			svgRef: null,
			hoveredElement: null,
			width,
			height,
			negative,
			horizontal,
			chartXStart: 0,
			chartXEnd: 0,
			chartYEnd: 0,
			chartYMiddle: 0,
			flatMax,
			timeSeriesMaxValue,
			scaleType,
			parseDate,
			timeDomain,
			yMin,
			yMax,
			zoomable,
			yBaseDomain,
		}),
		[
			elements,
			height,
			timeSeriesMaxValue,
			width,
			negative,
			horizontal,
			flatMax,
			scaleType,
			parseDate,
			timeDomain,
			yMin,
			yMax,
			zoomable,
			yBaseDomain,
		],
	);

	return (
		<ChartProvider initialState={initialState} theme={mergedTheme}>
			<div ref={chartContainerRef} className="rootContainer">
				<Svg
					style={style}
					containerRef={chartContainerRef}
					leftAxisCount={leftAxisCount}
					rightAxisCount={rightAxisCount}
					chartID={chartID}
					ariaLabel={ariaLabel}
					layoutConfig={layoutConfig}
					onZoomChange={onZoomChange}
					zoomStep={zoomStep}
					zoomSnap={zoomSnap}
					renderer={renderer}
				>
					{children}
				</Svg>
			</div>
		</ChartProvider>
	);
};

export default Chart;
