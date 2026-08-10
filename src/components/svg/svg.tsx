/* Types Imports */
import {
	type CSSProperties,
	type JSX,
	type MouseEvent,
	type MouseEventHandler,
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
/* Context Imports */
import {
	ChartMouseContext,
	useChartsDispatch,
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";
import { flattenChildren } from "../../lib/children";
/* Core Imports */
import {
	convertToSVGPoint,
	getCategorySpacing,
	getChartDimensions,
} from "../../lib/core";
import {
	type ChartLayoutConfig,
	computeGlobalConfig,
} from "../../lib/globalConfig";
import { isDefined, isTimeSerie } from "../../lib/utils";
import type { Serie } from "../../types";
import Legend, { DEFAULT_LEGEND_HEIGHT } from "../legend/legend";
import Tooltip from "../tooltip/tooltip";

export type SVGProps = {
	children: ReactNode;
	containerRef: RefObject<HTMLDivElement | null>;
	chartID: string | null;
	style?: CSSProperties;
	leftAxisCount?: number;
	rightAxisCount?: number;
	ariaLabel?: string;
	// Config di layout delle barre passata da <Chart> (M1): ha precedenza sul
	// config (deprecato) dei children in computeGlobalConfig.
	layoutConfig?: ChartLayoutConfig;
};

const getDefaultAriaLabel = (elements?: Serie[]) => {
	if (!elements || elements.length === 0) return "Grafico";

	const seriesNames = elements.map((el) => el.name).join(", ");
	return `Grafico con ${elements.length} serie: ${seriesNames}`;
};

// Funzione che calcola l'altezza della legenda
const getLegendHeight = (children: JSX.Element[]) => {
	/* Verifico che esista un elemento Legend (per riferimento al componente: da
	   v1.0 legendType e' opzionale, quindi non e' piu' un marcatore affidabile). */
	const legend = children.find((childEl) => childEl.type === Legend);

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
		layoutConfig,
	} = props;

	const rootRef = useRef<SVGSVGElement>(null);

	const ctx = useChartsStructural();
	const dispatch = useChartsDispatch();
	const theme = useChartsTheme();

	const { padding } = theme ?? {};

	// Posizione del mouse e visibilita' del tooltip: state LOCALE (R17), non nel
	// reducer -> a ogni pixel si ri-renderizza solo questo Svg (cheap, calcoli
	// memoizzati sotto) e il Tooltip che consuma ChartMouseContext, non
	// ChartProvider ne' Line/Axis.
	const [mousePosition, setMousePosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [tooltipVisible, setTooltipVisible] = useState(false);

	// Value del ChartMouseContext: reference stabile finche' mouse/visibilita'
	// non cambiano, cosi' un re-render di Svg per altri motivi non ri-renderizza
	// il Tooltip inutilmente.
	const mouseValue = useMemo(
		() => ({ mousePosition, tooltipVisible }),
		[mousePosition, tooltipVisible],
	);

	// Appiattito (scende in Fragment e .map) prima dell'ispezione: legenda e
	// config generati dinamicamente vengono comunque trovati (R6). Memoizzati su
	// children: Svg si ri-renderizza a ogni movimento del mouse (R17) ma questi
	// calcoli non rigirano se i children non cambiano.
	const flatChildren = useMemo(() => flattenChildren(children), [children]);

	const legendHeight = useMemo(
		() => getLegendHeight(flatChildren),
		[flatChildren],
	);

	// globalConfig reattivo ai cambi runtime dei config (R13): stabilizzato su
	// una dep-key che considera solo i valori primitivi + la PRESENZA delle
	// funzioni, non la loro identita' (decisione A di R3).
	const rawGlobalConfig = useMemo(
		() => computeGlobalConfig(flatChildren, layoutConfig),
		[flatChildren, layoutConfig],
	);
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
			// Con un container non ancora misurato (clientHeight 0) chartYEnd
			// sarebbe negativo (R18): non propago dimensioni invalide al context,
			// altrimenti gli elementi verrebbero disegnati con height negativa. Il
			// ResizeObserver richiama initializeChart quando il container ha
			// dimensioni reali.
			if (chartYEnd <= 0 || chartXEnd <= 0) return;
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

	// Il <Tooltip> tra i children (R7): axis.tsx usa la sua presenza per gli
	// hover-rect; qui ne leggiamo anche la prop `intersect` (R15) per decidere
	// come agganciare l'hover.
	const tooltipChild = useMemo(
		() => flatChildren.find((child) => child.type === Tooltip),
		[flatChildren],
	);
	const hasTooltip = !!tooltipChild;
	const intersect = tooltipChild?.props?.intersect === true;
	useEffect(() => {
		if (dispatch) {
			dispatch({ type: "SET_HAS_TOOLTIP", payload: { hasTooltip } });
		}
	}, [dispatch, hasTooltip]);

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
		// Nasconde il tooltip (R17): state locale, nessun dispatch al reducer.
		setTooltipVisible(false);
	};

	const handleMouseMove: MouseEventHandler<SVGSVGElement> = useCallback(
		(event: MouseEvent) => {
			const { clientX, clientY } = event;
			if (
				svgRef &&
				dispatch &&
				chartXStart !== undefined &&
				chartXEnd !== undefined &&
				chartYEnd !== undefined
			) {
				const svgPoint = convertToSVGPoint(svgRef, clientX, clientY) ?? {
					x: 0,
					y: 0,
				};

				// Posizione del mouse: state LOCALE (R17), non nel reducer. Il
				// Tooltip la consuma via ChartMouseContext e calcola la propria
				// posizione. Un solo convertToSVGPoint per movimento.
				setMousePosition(svgPoint);

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
					// intersect=true (R15): l'hover si attiva solo se il mouse e'
					// dentro i bounds dell'elemento. La mezza-larghezza dell'elemento
					// (barra o gruppo) e' xSpace - padding/2 (deriva da
					// getCategorySpacing). Con intersect=false e' sempre attivo
					// (prossimita', comportamento storico).
					const center = chartXStart + xSpace + hoveredIndex * xInterval;
					const halfWidth = xSpace - (padding ?? 0) / 2;
					const isOverElement =
						!intersect || Math.abs(svgPoint.x - center) <= halfWidth;

					setTooltipVisible(isOverElement);

					if (
						isOverElement &&
						hoveredIndex >= 0 &&
						hoveredIndex < serieData.length
					) {
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
				} else {
					// Grafici horizontal / senza serie hoverabile: intersect non si
					// applica, il tooltip resta visibile durante l'hover come prima.
					setTooltipVisible(true);
				}
			}
		},
		[
			svgRef,
			dispatch,
			chartXStart,
			chartXEnd,
			chartYEnd,
			ctxHorizontal,
			hoverableSerie,
			ctxElements,
			ctxGlobalConfig,
			padding,
			intersect,
		],
	);

	// NB: NON si puo' gatare su chartYEnd > 0 qui: il container prende la sua
	// altezza dall'<svg> che sta dentro, quindi se Svg ritornasse null il
	// container collasserebbe a clientHeight 0 e chartYEnd resterebbe negativo
	// per sempre (deadlock). Le dimensioni negative sono evitate alla radice:
	// initializeChart non propaga chartYEnd <= 0 al context (R18), quindi qui
	// chartYEnd e' 0 (stato iniziale) finche' il container non e' misurato.
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
			{/* Lo stato del mouse e' fornito ai children via context locale (R17):
			    quando cambia, si ri-renderizza solo chi lo consuma (il Tooltip). */}
			<ChartMouseContext.Provider value={mouseValue}>
				{children}
			</ChartMouseContext.Provider>
		</svg>
	);
};

export default Svg;
