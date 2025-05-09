/* Types Imports */
import {
	type JSX,
	type MouseEvent,
	type MouseEventHandler,
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
} from "react";

/* Core Imports */
import {
	calculateTooltipPosition,
	convertToSVGPoint,
	getChartDimensions,
} from "../../lib/core";

/* Context Imports */
import {
	useCharts,
	useChartsDispatch,
	useChartsTheme,
} from "../../contexts/chartContext";
import { isDefined } from "../../lib/utils";
import { DEFAULT_LEGEND_HEIGHT } from "../legend/legend";

type SVGProps = {
	children: ReactNode;
	containerRef: RefObject<HTMLDivElement | null>;
	chartID: string | null;
	leftAxisCount?: number;
	rightAxisCount?: number;
};

// Funzione che prende tutte le props di config degli elementi grafici e le setta nel context globale
const computeConfigs = (children: JSX.Element[]) => {
	const elementsWithConfig = children.filter(
		(childEl) => childEl.props?.config,
	);

	if (elementsWithConfig.length <= 0) return {};

	const globalConfig = elementsWithConfig.reduce((acc, el) => {
		const elConfig = el.props.config;
		const newAcc = {
			...acc,
			...elConfig,
		};

		return newAcc;
	}, {});

	return globalConfig;
};

// Funzione che calcola ricava l'altezza della legenda
const getLegendHeight = (children: JSX.Element[]) => {
	/* Verfico che esista un elemento Legend */
	const legend = children.find(
		(childEl) =>
			childEl.props?.legendType !== null &&
			childEl.props?.legendType !== undefined,
	);

	if (!legend) return 0;

	/* Se l'elemento Legend esiste prendo la sua altezza */
	const legendHeight = legend.props?.height
		? legend?.props?.height
		: DEFAULT_LEGEND_HEIGHT;

	return legendHeight;
};

const Svg = (props: SVGProps) => {
	const { children, containerRef, leftAxisCount, rightAxisCount, chartID } =
		props;

	const rootRef = useRef<SVGSVGElement>(null);

	const ctx = useCharts();
	const dispatch = useChartsDispatch();
	const theme = useChartsTheme();

	const { padding } = theme ?? {};

	const normalizedChildren = Array.isArray(children) ? children : [children];

	const legendHeight = getLegendHeight(normalizedChildren);

	const globalConfig = useRef(computeConfigs(normalizedChildren));

	// Funzione che inizializza le dimensioni del grafico svg
	const intializeChart = useCallback(() => {
		if (
			dispatch &&
			rootRef.current &&
			containerRef.current &&
			isDefined(padding) &&
			isDefined(leftAxisCount) &&
			isDefined(rightAxisCount)
		) {
			const { chartXStart, chartXEnd, chartYEnd } = getChartDimensions(
				padding as number,
				containerRef.current.clientWidth,
				containerRef.current.clientHeight,
				leftAxisCount as number,
				rightAxisCount as number,
				legendHeight,
			);
			dispatch({
				type: "INITIALIZE",
				payload: {
					svgRef: rootRef.current,
					width: containerRef.current.clientWidth,
					chartXStart,
					chartXEnd,
					chartYEnd,
					chartID,
					globalConfig: globalConfig.current,
				},
			});
		}
	}, [
		dispatch,
		containerRef,
		padding,
		rightAxisCount,
		leftAxisCount,
		chartID,
		legendHeight,
	]);

	useEffect(() => {
		intializeChart();
		window.addEventListener("resize", () => intializeChart());
		return () => window.removeEventListener("resize", () => intializeChart());
	}, [intializeChart]);

	const { svgRef, chartXStart, chartXEnd, chartYEnd, width, height } =
		ctx ?? {};

	const handleMouseLeave = () => {
		const tooltipElement = document.getElementById(`cts-tooltip-${chartID}`);
		if (tooltipElement) {
			tooltipElement.style.display = "none";
		}
	};

	const handleMouseMove: MouseEventHandler<SVGSVGElement> = useCallback(
		(event: MouseEvent) => {
			const tooltipElement = document.getElementById(`cts-tooltip-${chartID}`);
			if (tooltipElement?.style.display === "none") {
				tooltipElement.style.display = "block";
			}
			const { clientX, clientY } = event;
			if (
				svgRef &&
				tooltipElement &&
				dispatch &&
				chartXStart !== undefined &&
				chartXEnd !== undefined &&
				chartYEnd !== undefined
			) {
				const svgPoint = convertToSVGPoint(svgRef, clientX, clientY) ?? {
					x: 0,
					y: 0,
				};

				const tooltipPosition = calculateTooltipPosition(
					tooltipElement,
					svgPoint,
					chartXStart,
					chartXEnd,
					chartYEnd,
				);

				dispatch({
					type: "SET_TOOLTIP_POSITION",
					payload: { mousePosition: svgPoint, tooltipPosition },
				});
			}
		},
		[svgRef, dispatch, chartXStart, chartXEnd, chartYEnd, chartID],
	);

	if (!height) return null;

	const viewBox = `0 0 ${width} ${height + legendHeight}`;

	return (
		<svg
			ref={rootRef}
			viewBox={viewBox}
			width={width}
			height={height + legendHeight}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
		>
			<title>{chartID}</title>
			{children}
		</svg>
	);
};

export default Svg;
