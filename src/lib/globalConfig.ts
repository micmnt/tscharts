// Config di layout condivisa da tutte le serie: vive come props di <Chart>
// (barWidth/barGroupGap/barOffset). E' il "canale trasversale" con cui la
// larghezza/spaziatura/offset delle barre raggiunge Bar/GroupBar/Axis e le
// funzioni core (una barra sola non decide la larghezza di tutte le barre).
export type GlobalConfig = {
	barWidth?: number;
	barGroupGap?: number;
	barOffset?: number;
};

// Alias storico: le props di layout di <Chart> coincidono con GlobalConfig.
export type ChartLayoutConfig = GlobalConfig;

const LAYOUT_KEYS = [
	"barWidth",
	"barGroupGap",
	"barOffset",
] as const satisfies readonly (keyof ChartLayoutConfig)[];

// Costruisce il GlobalConfig dalle props di layout di <Chart>. Le chiavi non
// impostate restano undefined (i componenti applicano i propri default).
export const computeGlobalConfig = (
	layoutConfig?: ChartLayoutConfig,
): GlobalConfig => {
	const result: GlobalConfig = {};
	if (layoutConfig) {
		for (const key of LAYOUT_KEYS) {
			const value = layoutConfig[key];
			if (value !== undefined) result[key] = value;
		}
	}
	return result;
};
