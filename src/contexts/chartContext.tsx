/* Types Imports */

/* React Imports */
import {
	createContext,
	type Dispatch,
	type ReactNode,
	useContext,
	useEffect,
	useReducer,
} from "react";
/* Theme Imports */
import defaultTheme from "../lib/defaultTheme";
import type { ChartState, ThemeState } from "../types";

type ChartProviderProps = {
	children: ReactNode;
	initialState: ChartState;
	theme?: ThemeState;
};

export const ChartThemeContext = createContext<ThemeState | null>(null);
export const ChartContext = createContext<ChartState | null>(null);
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
				flatMax: initialState.flatMax,
				timeSeriesMaxValue: initialState.timeSeriesMaxValue,
			},
		});
	}, [
		initialState.elements,
		initialState.negative,
		initialState.flatMax,
		initialState.timeSeriesMaxValue,
	]);

	if (!(chart && dispatch)) return null;

	return (
		<ChartThemeContext.Provider value={theme}>
			<ChartDispatchContext.Provider value={dispatch}>
				<ChartContext.Provider value={chart}>{children}</ChartContext.Provider>
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
				globalConfig,
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
				globalConfig,
			};
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
			const { elements, negative, flatMax, timeSeriesMaxValue } =
				action.payload;

			return {
				...chart,
				elements,
				negative,
				flatMax,
				timeSeriesMaxValue,
			};
		}
		default: {
			return chart;
		}
	}
}

export function useCharts() {
	return useContext(ChartContext);
}

export function useChartsDispatch() {
	return useContext(ChartDispatchContext);
}

export function useChartsTheme() {
	return useContext(ChartThemeContext);
}
