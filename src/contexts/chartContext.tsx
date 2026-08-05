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
// Due context separati al posto di un unico ChartContext: i componenti che
// consumano solo ChartStructuralContext non si ri-renderizzano quando cambia
// solo lo stato interattivo (mousePosition/tooltipPosition/hoveredElement),
// che oggi cambia ad ogni mousemove. Il dispatch resta condiviso: e' gia'
// stabile per riferimento (garanzia di useReducer), non ha mai causato
// re-render di suo, quindi non serve splittarlo.
export const ChartStructuralContext =
	createContext<ChartStructuralState | null>(null);
export const ChartInteractiveContext =
	createContext<ChartInteractiveState | null>(null);
export const ChartDispatchContext = createContext<Dispatch<{
	type: string;
	payload: ChartState;
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
			},
		});
	}, [
		initialState.elements,
		initialState.negative,
		initialState.horizontal,
		initialState.flatMax,
		initialState.timeSeriesMaxValue,
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
		],
	);

	const interactive: ChartInteractiveState = useMemo(
		() => ({
			mousePosition: chart.mousePosition,
			tooltipPosition: chart.tooltipPosition,
			hoveredElement: chart.hoveredElement,
		}),
		[chart.mousePosition, chart.tooltipPosition, chart.hoveredElement],
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
			const {
				svgRef,
				width,
				chartXStart,
				chartXEnd,
				chartYEnd,
				chartYMiddle,
				chartID,
			} = action.payload;
			return {
				...chart,
				svgRef,
				width,
				chartXStart,
				chartXEnd,
				chartYMiddle,
				chartYEnd,
				chartID,
			};
		}
		case "UPDATE_GLOBAL_CONFIG": {
			const { globalConfig } = action.payload;
			// no-op se la reference non e' cambiata: evita re-render inutili.
			if (chart.globalConfig === globalConfig) return chart;
			return { ...chart, globalConfig };
		}
		case "SET_HOVER_ELEMENT": {
			const { hoveredElement } = action.payload ?? {};
			return {
				...chart,
				hoveredElement,
			};
		}
		case "SET_TOOLTIP_POSITION": {
			const { mousePosition, tooltipPosition } = action.payload ?? {};
			return {
				...chart,
				tooltipPosition,
				mousePosition,
			};
		}
		case "SYNC_PROPS": {
			const { elements, negative, horizontal, flatMax, timeSeriesMaxValue } =
				action.payload;

			return {
				...chart,
				elements,
				negative,
				horizontal,
				flatMax,
				timeSeriesMaxValue,
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

export function useChartsDispatch() {
	return useContext(ChartDispatchContext);
}

export function useChartsTheme() {
	return useContext(ChartThemeContext);
}
