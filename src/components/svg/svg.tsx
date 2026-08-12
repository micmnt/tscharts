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
	computeWheelZoom,
	convertToSVGPoint,
	createBandScale,
	getCategorySpacing,
	getChartDimensions,
	getChartTimeScale,
	getChartYScale,
	normalizeTime,
	snapDomain,
} from "../../lib/core";
import {
	type ChartLayoutConfig,
	computeGlobalConfig,
} from "../../lib/globalConfig";
import { isDefined, isTimeSerie } from "../../lib/utils";
import type { Serie } from "../../types";
import CanvasSurface from "../canvas/canvasSurface";
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
	// Config di layout delle barre passata da <Chart>: barWidth/barGroupGap/barOffset.
	layoutConfig?: ChartLayoutConfig;
	// Zoom interattivo Y (S3): callback col dominio corrente (null al reset).
	onZoomChange?: (domain: [number, number] | null) => void;
	// Config del passo di zoom (S3b): fattore per tacca e snap degli estremi.
	zoomStep?: number;
	zoomSnap?: number;
	// Motore di rendering (increment 1 canvas): "canvas" monta un <CanvasSurface>
	// dietro l'<svg>. Default "svg" -> nessun canvas montato (invariante).
	renderer?: "svg" | "canvas";
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
		onZoomChange,
		zoomStep,
		zoomSnap,
		renderer = "svg",
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

	// globalConfig (layout barre) reattivo ai cambi delle props di <Chart>,
	// stabilizzato su una dep-key coi valori primitivi (evita nuove reference).
	const rawGlobalConfig = useMemo(
		() => computeGlobalConfig(layoutConfig),
		[layoutConfig],
	);
	const globalConfigKey = JSON.stringify({
		barWidth: rawGlobalConfig.barWidth,
		barGroupGap: rawGlobalConfig.barGroupGap,
		barOffset: rawGlobalConfig.barOffset,
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

					// Asse tempo (S2b): i punti non sono equispaziati, quindi l'indice
					// e' il punto DATO piu' vicino nel tempo (non un round su band).
					// Stessa getChartTimeScale usata da generatore line e asse.
					const timeScale =
						ctx?.scaleType === "time"
							? getChartTimeScale({
									timeDomain: ctx.timeDomain,
									chartXStart,
									chartXEnd,
									padding: padding ?? 0,
								})
							: null;

					let hoveredIndex: number;
					let center: number;
					let halfWidth: number;

					if (timeScale) {
						const times = serieData.map((d) =>
							normalizeTime(d.date, ctx?.parseDate),
						);
						const mouseTime = timeScale.invert(svgPoint.x);
						hoveredIndex = 0;
						let bestDist = Number.POSITIVE_INFINITY;
						times.forEach((t, i) => {
							const dist = Math.abs(t - mouseTime);
							if (dist < bestDist) {
								bestDist = dist;
								hoveredIndex = i;
							}
						});
						center = timeScale.position(times[hoveredIndex] ?? 0);
						// tolleranza intersect: meta' distanza pixel dal vicino piu'
						// prossimo (i punti tempo non sono equispaziati).
						const neighborGaps = [
							times[hoveredIndex - 1],
							times[hoveredIndex + 1],
						]
							.filter((t): t is number => isDefined(t))
							.map((t) => Math.abs(timeScale.position(t) - center));
						halfWidth = neighborGaps.length
							? Math.min(...neighborGaps) / 2
							: (padding ?? 0);
					} else {
						// Stessa fonte di verita' della centratura label (xAxis.tsx): per
						// i GroupBar l'aggancio dell'hover tiene conto della larghezza
						// dell'intero gruppo, non di una singola barra (R5). Stessa
						// BandScale "centro categoria" di xAxis.tsx: invert per l'indice,
						// position per il centro -> hover e label non divergono (S2a).
						const xSpace = getCategorySpacing(
							ctxElements ?? [],
							ctxGlobalConfig,
							padding ?? 0,
						);
						const xScale = createBandScale({
							start: chartXStart,
							end: chartXEnd,
							count: serieData.length,
							firstOffset: xSpace,
						});
						hoveredIndex = xScale.invert(svgPoint.x);
						// intersect=true (R15): l'hover si attiva solo se il mouse e'
						// dentro i bounds dell'elemento (xSpace - padding/2).
						center = xScale.position(hoveredIndex);
						halfWidth = xSpace - (padding ?? 0) / 2;
					}

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
			ctx?.scaleType,
			ctx?.timeDomain,
			ctx?.parseDate,
		],
	);

	// Zoom rotella (S3): accumulatore CONTINUO del dominio (non snappato),
	// aggiornato in modo sincrono a ogni evento rotella. E' la fonte di verita'
	// interattiva; il context riceve il dominio *snappato* solo per il display.
	// Serve a rendere lo zoom solido in due casi in cui prima "a volte zoomava e
	// a volte no":
	//  (a) piu' eventi rotella arrivano PRIMA del re-render di React: leggendo
	//      ctx.zoomDomain (ancora stantio) il 2o+ evento ripartirebbe dal dominio
	//      vecchio e lo step andrebbe perso. Qui ogni evento legge/scrive il ref
	//      in modo sincrono, quindi gli eventi si accumulano correttamente;
	//  (b) lo snap applicato ad ogni singolo step "ingoia" i delta piccoli
	//      (trackpad -> zoom minimo -> arrotonda allo stesso dominio): tenendo
	//      l'accumulo continuo e snappando solo l'output, lo zoom non si blocca.
	const zoomAccRef = useRef<[number, number] | null>(null);
	// Reset dell'accumulatore quando il dominio viene azzerato dall'esterno
	// (doppio click / reset): il context torna senza zoomDomain, l'accumulo pure.
	if (!ctx?.zoomDomain) zoomAccRef.current = null;
	// Parametri correnti letti dal listener (agganciato una sola volta): un ref
	// aggiornato a ogni render evita di ri-agganciare il listener nativo (che, tra
	// una detach e la successiva attach, potrebbe perdere un evento) e le closure
	// stantie.
	const zoomParamsRef = useRef<{
		baseDomain?: readonly [number, number];
		chartYEnd?: number;
		padding?: number;
		zoomStep?: number;
		zoomSnap?: number;
		svgRef?: SVGSVGElement | null;
		onZoomChange?: (domain: [number, number] | null) => void;
	}>({});
	zoomParamsRef.current = {
		baseDomain: ctx?.yBaseDomain,
		chartYEnd,
		padding,
		zoomStep,
		zoomSnap,
		svgRef,
		onZoomChange,
	};

	// Listener nativo con { passive: false } perche' React registra onWheel come
	// passivo -> preventDefault non fermerebbe lo scroll della pagina. Agganciato
	// UNA volta (dep solo su zoomable/dispatch): tutto il resto viene letto dai
	// ref sopra, sempre aggiornati.
	useEffect(() => {
		const el = rootRef.current;
		if (!el || !ctx?.zoomable || !dispatch) return;

		const onWheel = (event: WheelEvent) => {
			const p = zoomParamsRef.current;
			if (!p.baseDomain) return;
			event.preventDefault();
			const point = convertToSVGPoint(
				p.svgRef ?? el,
				event.clientX,
				event.clientY,
			);
			if (!point) return;
			// parte dall'accumulatore CONTINUO (non dallo snappato mostrato)
			const current = zoomAccRef.current ?? p.baseDomain;
			const value = getChartYScale({
				min: current[0],
				max: current[1],
				chartYEnd: p.chartYEnd ?? 0,
				padding: p.padding ?? 0,
			}).invert(point.y);
			// accumulo continuo, SENZA snap: non si blocca mai
			const next = computeWheelZoom({
				domain: current,
				baseDomain: p.baseDomain,
				value,
				deltaY: event.deltaY,
				zoomStep: p.zoomStep,
			});
			zoomAccRef.current = next; // sincrono: il prossimo evento riparte da qui
			// snap solo sull'output mostrato / notificato
			const display =
				p.zoomSnap && p.zoomSnap > 0
					? snapDomain(next, p.zoomSnap, p.baseDomain)
					: next;
			dispatch({ type: "SET_ZOOM", payload: { zoomDomain: display } });
			p.onZoomChange?.(display);
		};

		el.addEventListener("wheel", onWheel, { passive: false });
		return () => el.removeEventListener("wheel", onWheel);
	}, [ctx?.zoomable, dispatch]);

	const handleDoubleClick = useCallback(() => {
		if (!ctx?.zoomable || !ctx.zoomDomain || !dispatch) return;
		zoomAccRef.current = null;
		dispatch({ type: "CLEAR_ZOOM", payload: {} });
		onZoomChange?.(null);
	}, [ctx?.zoomable, ctx?.zoomDomain, dispatch, onZoomChange]);

	// NB: NON si puo' gatare su chartYEnd > 0 qui: il container prende la sua
	// altezza dall'<svg> che sta dentro, quindi se Svg ritornasse null il
	// container collasserebbe a clientHeight 0 e chartYEnd resterebbe negativo
	// per sempre (deadlock). Le dimensioni negative sono evitate alla radice:
	// initializeChart non propaga chartYEnd <= 0 al context (R18), quindi qui
	// chartYEnd e' 0 (stato iniziale) finche' il container non e' misurato.
	if (!height) return null;

	const viewBox = `0 0 ${width} ${height + legendHeight}`;

	const svgEl = (
		<svg
			style={style}
			ref={rootRef}
			viewBox={viewBox}
			width={width}
			height={height + legendHeight}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			onDoubleClick={handleDoubleClick}
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

	// Modalita' canvas (increment 1): un <CanvasSurface> dietro l'<svg>, stessa
	// dimensione. Le marche (Line) registrano draw-op e rendono null nell'svg;
	// assi/legenda/tooltip restano nell'svg sopra e gestiscono gli eventi.
	// In "svg" (default) NIENTE di tutto questo: l'svg viene ritornato tale e
	// quale (invariante: SVG esclude completamente il canvas).
	if (renderer === "canvas") {
		return (
			<CanvasSurface width={width ?? 0} height={(height ?? 0) + legendHeight}>
				{svgEl}
			</CanvasSurface>
		);
	}

	return svgEl;
};

export default Svg;
