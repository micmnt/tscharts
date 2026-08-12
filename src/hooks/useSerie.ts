import { useChartsStructural, useChartsTheme } from "../contexts/chartContext";
import { warnDev } from "../lib/utils";
import type { ChartStructuralState, Serie, ThemeState } from "../types";

type UseSerieResult<T extends Serie> = {
	ctx: ChartStructuralState | null;
	theme: ThemeState | null;
	serie: T | undefined;
};

export function useSerie<T extends Serie>(
	name: string,
	guard: (serie: Serie) => serie is T,
	opts: { component: string; serieTypeLabel: string },
): UseSerieResult<T> {
	const ctx = useChartsStructural();
	const theme = useChartsTheme();

	const found = ctx?.elements?.find((el) => el.name === name);
	const serie = found && guard(found) ? found : undefined;

	if (!ctx || !theme) {
		warnDev(
			`<${opts.component} name="${name}" /> deve essere renderizzato dentro <Chart>.`,
		);
	} else if (!serie) {
		warnDev(
			`<${opts.component} name="${name}" />: nessuna serie di tipo ${opts.serieTypeLabel} trovata con questo name.`,
		);
	}

	return { ctx, theme, serie };
}
