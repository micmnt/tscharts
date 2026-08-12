import { useChartsStructural, useChartsTheme } from "../contexts/chartContext";
import type { ChartStructuralState, Serie, ThemeState } from "../types";

type UseSerieResult<T extends Serie> = {
	ctx: ChartStructuralState | null;
	theme: ThemeState | null;
	serie: T | undefined;
};

export function useSerie<T extends Serie>(
	name: string,
	guard: (serie: Serie) => serie is T,
): UseSerieResult<T> {
	const ctx = useChartsStructural();
	const theme = useChartsTheme();

	const found = ctx?.elements?.find((el) => el.name === name);
	const serie = found && guard(found) ? found : undefined;

	return { ctx, theme, serie };
}
