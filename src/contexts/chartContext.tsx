import {
	createContext,
	type Dispatch,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useReducer,
} from "react";

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

export const ChartStructuralContext =
	createContext<ChartStructuralState | null>(null);
export const ChartInteractiveContext =
	createContext<ChartInteractiveState | null>(null);
export const ChartMouseContext = createContext<ChartMouseState | null>(null);
export const ChartDispatchContext = createContext<Dispatch<{
	type: string;

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
			return { ...chart, ...action.payload };
		}
		case "UPDATE_GLOBAL_CONFIG": {
			const { globalConfig } = action.payload;

			if (chart.globalConfig === globalConfig) return chart;
			return { ...chart, globalConfig };
		}
		case "SET_HOVER_ELEMENT": {
			const { hoveredElement } = action.payload ?? {};

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
