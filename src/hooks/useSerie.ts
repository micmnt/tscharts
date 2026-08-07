import { useChartsStructural, useChartsTheme } from "../contexts/chartContext";
import { warnDev } from "../lib/utils";
import type { ChartStructuralState, Serie, ThemeState } from "../types";

type UseSerieResult<T extends Serie> = {
	ctx: ChartStructuralState | null;
	theme: ThemeState | null;
	serie: T | undefined;
};

// Lookup condiviso dai componenti-serie (Bar, Line, GroupBar, Pie, Donut,
// AngleDonut, Threshold): risolve ctx + theme + la serie con quel `name`,
// ristretta al tipo atteso dal `guard`, ed emette in dev l'avviso giusto se il
// componente e' fuori da <Chart> o se la serie non esiste.
//
// Ritorna i singoli valori STABILI (ctx/theme dai context hook, serie da
// elements.find), non un oggetto memoizzato: cosi' i componenti possono usarli
// come dipendenze delle proprie useMemo senza invalidarle ad ogni render.
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
