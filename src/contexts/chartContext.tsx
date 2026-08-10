/* Types Imports */

/* React Imports */
import {
	createContext,
	type Dispatch,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useReducer,
} from "react";
/* Theme Imports */
import defaultTheme from "../lib/defaultTheme";
import type {
	ChartInteractiveState,
	ChartMouseState,
	ChartState,
	ChartStructuralState,
	ThemeState,
} from "../types";

type ChartProviderProps = {
	children: ReactNode;
	initialState: ChartState;
	theme?: ThemeState;
};

export const ChartThemeContext = createContext<ThemeState | null>(null);
// Context separati per non ri-renderizzare chi non serve:
// - ChartStructuralContext: dati che cambiano di rado (dimensioni, elementi...).
// - ChartInteractiveContext: hoveredElement, cambia solo al cambio categoria.
// - ChartMouseContext (R17): posizione del mouse + visibilita' tooltip, cambia
//   a ogni pixel. Fornito da <Svg> con state LOCALE (non dal reducer), cosi'
//   ChartProvider non gira a ogni movimento; lo consuma solo il Tooltip.
// Il dispatch resta condiviso: e' gia' stabile per riferimento (useReducer).
export const ChartStructuralContext =
	createContext<ChartStructuralState | null>(null);
export const ChartInteractiveContext =
	createContext<ChartInteractiveState | null>(null);
export const ChartMouseContext = createContext<ChartMouseState | null>(null);
export const ChartDispatchContext = createContext<Dispatch<{
	type: string;
	// Partial: quasi tutte le azioni dispatchano solo il sottoinsieme di campi
	// che cambiano (es. SET_HOVER_ELEMENT solo hoveredElement). Con le dimensioni
	// ora non-opzionali (R9), un payload tipizzato ChartState pieno costringerebbe
	// ogni dispatch a fornire tutte le dimensioni.
	payload: Partial<ChartState>;
}> | null>(null);

export function ChartProvider(props: Readonly<ChartProviderProps>) {
	const { children, initialState, theme = defaultTheme } = props;

	const [chart, dispatch] = useReducer(chartReducer, initialState);

	useEffect(() => {
		dispatch({
			type: "SYNC_PROPS",
			payload: {
				elements: initialState.elements,
				negative: initialState.negative,
				horizontal: initialState.horizontal,
				flatMax: initialState.flatMax,
				timeSeriesMaxValue: initialState.timeSeriesMaxValue,
				scaleType: initialState.scaleType,
				parseDate: initialState.parseDate,
				timeDomain: initialState.timeDomain,
				yMin: initialState.yMin,
				yMax: initialState.yMax,
				zoomable: initialState.zoomable,
				yBaseDomain: initialState.yBaseDomain,
			},
		});
	}, [
		initialState.elements,
		initialState.negative,
		initialState.horizontal,
		initialState.flatMax,
		initialState.timeSeriesMaxValue,
		initialState.scaleType,
		initialState.parseDate,
		initialState.timeDomain,
		initialState.yMin,
		initialState.yMax,
		initialState.zoomable,
		initialState.yBaseDomain,
	]);

	// Slice memoizzate: cambiano riferimento solo quando cambia uno dei loro
	// campi, non ad ogni dispatch qualsiasi (es. un SET_TOOLTIP_POSITION non
	// tocca nessuno dei campi di `structural`, quindi la sua reference resta
	// stabile e i consumer di ChartStructuralContext non si ri-renderizzano).
	const structural: ChartStructuralState = useMemo(
		() => ({
			elements: chart.elements,
			svgRef: chart.svgRef,
			width: chart.width,
			height: chart.height,
			chartXStart: chart.chartXStart,
			chartXEnd: chart.chartXEnd,
			chartYEnd: chart.chartYEnd,
			chartYMiddle: chart.chartYMiddle,
			negative: chart.negative,
			horizontal: chart.horizontal,
			flatMax: chart.flatMax,
			timeSeriesMaxValue: chart.timeSeriesMaxValue,
			chartID: chart.chartID,
			globalConfig: chart.globalConfig,
			hasTooltip: chart.hasTooltip,
			scaleType: chart.scaleType,
			parseDate: chart.parseDate,
			timeDomain: chart.timeDomain,
			// yMin/yMax EFFETTIVI: lo zoom interattivo (zoomDomain) vince sul
			// dominio statico da props (S3). I generatori leggono ctx.yMin/yMax e
			// seguono lo zoom senza modifiche.
			yMin: chart.zoomDomain ? chart.zoomDomain[0] : chart.yMin,
			yMax: chart.zoomDomain ? chart.zoomDomain[1] : chart.yMax,
			zoomable: chart.zoomable,
			yBaseDomain: chart.yBaseDomain,
			zoomDomain: chart.zoomDomain,
		}),
		[
			chart.elements,
			chart.svgRef,
			chart.width,
			chart.height,
			chart.chartXStart,
			chart.chartXEnd,
			chart.chartYEnd,
			chart.chartYMiddle,
			chart.negative,
			chart.horizontal,
			chart.flatMax,
			chart.timeSeriesMaxValue,
			chart.chartID,
			chart.globalConfig,
			chart.hasTooltip,
			chart.scaleType,
			chart.parseDate,
			chart.timeDomain,
			chart.yMin,
			chart.yMax,
			chart.zoomable,
			chart.yBaseDomain,
			chart.zoomDomain,
		],
	);

	const interactive: ChartInteractiveState = useMemo(
		() => ({
			hoveredElement: chart.hoveredElement,
		}),
		[chart.hoveredElement],
	);

	if (!(chart && dispatch)) return null;

	return (
		<ChartThemeContext.Provider value={theme}>
			<ChartDispatchContext.Provider value={dispatch}>
				<ChartStructuralContext.Provider value={structural}>
					<ChartInteractiveContext.Provider value={interactive}>
						{children}
					</ChartInteractiveContext.Provider>
				</ChartStructuralContext.Provider>
			</ChartDispatchContext.Provider>
		</ChartThemeContext.Provider>
	);
}

function chartReducer(
	chart: ChartState,
	action: { type: string; payload: Partial<ChartState> },
): ChartState {
	switch (action.type) {
		case "INITIALIZE": {
			// Spread del payload sopra chart: chart (ChartState) fornisce tutti i
			// campi required, il payload (Partial) sovrascrive solo quelli
			// dell'INITIALIZE (dimensioni, svgRef, chartID). Evita di riassegnare
			// dimensioni `number | undefined` a un ChartState con dimensioni
			// non-opzionali (R9).
			return { ...chart, ...action.payload };
		}
		case "UPDATE_GLOBAL_CONFIG": {
			const { globalConfig } = action.payload;
			// no-op se la reference non e' cambiata: evita re-render inutili.
			if (chart.globalConfig === globalConfig) return chart;
			return { ...chart, globalConfig };
		}
		case "SET_HOVER_ELEMENT": {
			const { hoveredElement } = action.payload ?? {};
			// Guard (R17): il mousemove dispatcha questa azione a ogni pixel, ma la
			// categoria in hover cambia di rado. Se e' la stessa, ritorno lo stesso
			// stato -> useReducer fa bail-out (nessun re-render di ChartProvider ne'
			// dei consumatori di hoveredElement, cioe' Line/Axis).
			if (
				chart.hoveredElement?.elementIndex === hoveredElement?.elementIndex &&
				chart.hoveredElement?.label === hoveredElement?.label
			) {
				return chart;
			}
			return {
				...chart,
				hoveredElement,
			};
		}
		case "SET_HAS_TOOLTIP": {
			const { hasTooltip } = action.payload ?? {};
			if (chart.hasTooltip === hasTooltip) return chart;
			return { ...chart, hasTooltip };
		}
		// Zoom interattivo Y (S3): SET_ZOOM imposta il dominio corrente (rotella),
		// CLEAR_ZOOM lo azzera (doppio click -> torna a yBaseDomain). Distinti da
		// SYNC_PROPS di proposito: lo zoom NON si resetta a ogni sync dei props.
		case "SET_ZOOM": {
			const { zoomDomain } = action.payload ?? {};
			if (chart.zoomDomain === zoomDomain) return chart;
			return { ...chart, zoomDomain };
		}
		case "CLEAR_ZOOM": {
			if (!chart.zoomDomain) return chart;
			return { ...chart, zoomDomain: null };
		}
		case "SYNC_PROPS": {
			const {
				elements,
				negative,
				horizontal,
				flatMax,
				timeSeriesMaxValue,
				scaleType,
				parseDate,
				timeDomain,
				yMin,
				yMax,
				zoomable,
				yBaseDomain,
			} = action.payload;

			// zoomDomain NON e' qui: e' stato interattivo, non deriva dai props.
			return {
				...chart,
				elements,
				negative,
				horizontal,
				flatMax,
				timeSeriesMaxValue,
				scaleType,
				parseDate,
				timeDomain,
				yMin,
				yMax,
				zoomable,
				yBaseDomain,
			};
		}
		default: {
			return chart;
		}
	}
}

export function useChartsStructural() {
	return useContext(ChartStructuralContext);
}

export function useChartsInteractive() {
	return useContext(ChartInteractiveContext);
}

export function useChartsMouse() {
	return useContext(ChartMouseContext);
}

export function useChartsDispatch() {
	return useContext(ChartDispatchContext);
}

export function useChartsTheme() {
	return useContext(ChartThemeContext);
}
