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
/* Context Imports */
import {
	useChartsDispatch,
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";
/* Core Imports */
import {
	calculateTooltipPosition,
	convertToSVGPoint,
	getCategorySpacing,
	getChartDimensions,
} from "../../lib/core";
import { computeGlobalConfig } from "../../lib/globalConfig";
import { isDefined, isTimeSerie } from "../../lib/utils";
import type { Serie } from "../../types";
import { DEFAULT_LEGEND_HEIGHT } from "../legend/legend";

export type SVGProps = {
	children: ReactNode;
	containerRef: RefObject<HTMLDivElement | null>;
	chartID: string | null;
	style?: any;
	leftAxisCount?: number;
	rightAxisCount?: number;
	ariaLabel?: string;
};

const getDefaultAriaLabel = (elements?: Serie[]) => {
	if (!elements || elements.length === 0) return "Grafico";

	const seriesNames = elements.map((el) => el.name).join(", ");
	return `Grafico con ${elements.length} serie: ${seriesNames}`;
};

// Funzione che calcola l'altezza della legenda
const getLegendHeight = (children: JSX.Element[]) => {
	/* Verifico che esista un elemento Legend */
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
	const {
		children,
		containerRef,
		leftAxisCount,
		rightAxisCount,
		chartID,
		style,
		ariaLabel,
	} = props;

	const rootRef = useRef<SVGSVGElement>(null);

	const ctx = useChartsStructural();
	const dispatch = useChartsDispatch();
	const theme = useChartsTheme();

	const { padding } = theme ?? {};

	const normalizedChildren = Array.isArray(children) ? children : [children];

	const legendHeight = getLegendHeight(normalizedChildren);

	// globalConfig reattivo ai cambi runtime dei config (R13): ricalcolato ad
	// ogni render (cheap) ma stabilizzato su una dep-key. La key considera solo
	// i valori primitivi + la PRESENZA delle funzioni, non la loro identita'
	// (decisione A di R3): cambia solo quando cambia qualcosa che conta, evitando
	// dispatch inutili da callback inline. La memoization e' manuale (durante il
	// render, pattern React) per non ricreare la reference ad ogni render.
	const rawGlobalConfig = computeGlobalConfig(normalizedChildren.flat());
	const globalConfigKey = JSON.stringify({
		barWidth: rawGlobalConfig.barWidth,
		barGroupGap: rawGlobalConfig.barGroupGap,
		barOffset: rawGlobalConfig.barOffset,
		selectedColor: rawGlobalConfig.selectedColor,
		selectedValue: rawGlobalConfig.selectedValue,
		hasBarClickAction: typeof rawGlobalConfig.barClickAction === "function",
	});
	const globalConfigStore = useRef({
		key: globalConfigKey,
		value: rawGlobalConfig,
	});
	if (globalConfigStore.current.key !== globalConfigKey) {
		globalConfigStore.current = {
			key: globalConfigKey,
			value: rawGlobalConfig,
		};
	}
	const globalConfig = globalConfigStore.current.value;

	// Funzione che inizializza le dimensioni del grafico svg
	const initializeChart = useCallback(() => {
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
					chartYMiddle: (chartYEnd + 2 * padding) / 2,
					chartID,
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
		initializeChart();

		// ResizeObserver sul container: reagisce anche ai cambi di layout (es.
		// una sidebar che collassa), non solo al resize della finestra (R5).
		// Fallback a window.resize dove ResizeObserver non e' disponibile
		// (SSR / jsdom).
		const container = containerRef.current;
		if (!container || typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", initializeChart);
			return () => window.removeEventListener("resize", initializeChart);
		}

		const observer = new ResizeObserver(() => initializeChart());
		observer.observe(container);
		return () => observer.disconnect();
	}, [initializeChart, containerRef]);

	// Propaga globalConfig al context quando cambia (R13): separato da
	// INITIALIZE (che gestisce solo le dimensioni) cosi' i cambi runtime dei
	// config si riflettono su Axis/hover senza aspettare un mount/resize.
	useEffect(() => {
		if (dispatch) {
			dispatch({
				type: "UPDATE_GLOBAL_CONFIG",
				payload: { globalConfig },
			});
		}
	}, [dispatch, globalConfig]);

	const { svgRef, chartXStart, chartXEnd, chartYEnd, width, height } =
		ctx ?? {};

	const {
		elements: ctxElements,
		globalConfig: ctxGlobalConfig,
		horizontal: ctxHorizontal,
	} = ctx ?? {};

	// Serie di riferimento per il calcolo dell'hover: deve avere data come
	// TimeSerieEl[] (bar/line/bar-stacked/group-bar), non un valore singolo
	// come threshold o un array di forma diversa come pie.
	const hoverableSerie = ctxElements?.find(isTimeSerie);

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

				// Calcolo l'elemento in hover dalla posizione X del mouse. Solo per
				// grafici NON orizzontali: nei grafici horizontal e' Axis (nel suo
				// ramo xAxis horizontal) a gestire l'hover correttamente in base
				// alla posizione Y, tramite i propri onMouseEnter sulle righe -
				// ricalcolarlo qui duplicherebbe quella logica e, siccome mousemove
				// scatta ad ogni pixel, sovrascriverebbe il valore corretto con uno
				// sbagliato calcolato sull'asse sbagliato.
				if (!ctxHorizontal && hoverableSerie) {
					const serieData = hoverableSerie.data;
					const xInterval = (chartXEnd - chartXStart) / (serieData.length || 1);
					// Stessa fonte di verita' della centratura label (axis.tsx): per
					// i GroupBar l'aggancio dell'hover tiene conto della larghezza
					// dell'intero gruppo, non di una singola barra (R5).
					const xSpace = getCategorySpacing(
						ctxElements ?? [],
						ctxGlobalConfig,
						padding ?? 0,
					);
					const hoveredIndex = Math.round(
						(svgPoint.x - chartXStart - xSpace) / xInterval,
					);
					if (hoveredIndex >= 0 && hoveredIndex < serieData.length) {
						const el = serieData[hoveredIndex];
						if (el) {
							dispatch({
								type: "SET_HOVER_ELEMENT",
								payload: {
									hoveredElement: {
										elementIndex: hoveredIndex,
										label: el.date,
									},
								},
							});
						}
					}
				}
			}
		},
		[
			svgRef,
			dispatch,
			chartXStart,
			chartXEnd,
			chartYEnd,
			chartID,
			ctxHorizontal,
			hoverableSerie,
			ctxElements,
			ctxGlobalConfig,
			padding,
		],
	);

	if (!height) return null;

	const viewBox = `0 0 ${width} ${height + legendHeight}`;

	return (
		<svg
			style={style}
			ref={rootRef}
			viewBox={viewBox}
			width={width}
			height={height + legendHeight}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			role="img"
			aria-label={ariaLabel ?? getDefaultAriaLabel(ctxElements)}
		>
			{children}
		</svg>
	);
};

export default Svg;
