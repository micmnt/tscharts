import type { JSX } from "react";
import { warnDev } from "./utils";

// Il "canale trasversale" con cui alcune proprieta' definite sul `config` di
// Bar/GroupBar arrivano a componenti che non sono la serie stessa (Axis, Svg)
// e alle funzioni core. Sono le uniche 6 chiavi effettivamente lette da
// globalConfig: tutte le altre chiavi del config (radius, labelSize...) restano
// lette dal componente dal proprio config. Tipizzarle esplicitamente (invece
// del vecchio sacco {[key: string]: number|string|fn}) rende il contratto
// chiaro ed elimina i cast a valle (R3).
export type GlobalConfig = {
	barWidth?: number;
	barGroupGap?: number;
	barOffset?: number;
	selectedColor?: string;
	selectedValue?: string;
	barClickAction?: (value: unknown) => void;
};

// Le chiavi primitive concorrono al check collisioni; barClickAction no (le
// funzioni "collidono" spesso solo per reference diversa, non per intento).
const PRIMITIVE_KEYS = [
	"barWidth",
	"barGroupGap",
	"barOffset",
	"selectedColor",
	"selectedValue",
] as const;

const GLOBAL_CONFIG_KEYS = [
	...PRIMITIVE_KEYS,
	"barClickAction",
] as const satisfies readonly (keyof GlobalConfig)[];

// Config di layout condivisa da tutte le serie: dalla v1.0 vive come props di
// <Chart> (M1), non piu' sul config della singola serie. E' il sottoinsieme del
// canale trasversale che non ha senso per-serie (una barra sola non decide la
// larghezza di tutte le barre del grafico).
export type ChartLayoutConfig = Pick<
	GlobalConfig,
	"barWidth" | "barGroupGap" | "barOffset"
>;

const LAYOUT_KEYS = [
	"barWidth",
	"barGroupGap",
	"barOffset",
] as const satisfies readonly (keyof ChartLayoutConfig)[];

// Chiavi del config della serie promosse a props di un altro componente (v1.0):
// restano accettate qui per retrocompatibilita' ma avvisano (rimozione in 2.0).
// M1 -> props di <Chart>; M2 -> props di <Axis>. barClickAction NON e' qui: e'
// dual-use (click barra + click label), la sua deprecation e' rimandata a M4.
const DEPRECATED_CONFIG_KEYS: Partial<Record<keyof GlobalConfig, string>> = {
	barWidth: "prop di <Chart> (es. <Chart barWidth={...} />)",
	barGroupGap: "prop di <Chart> (es. <Chart barGroupGap={...} />)",
	barOffset: "prop di <Chart> (es. <Chart barOffset={...} />)",
	selectedValue: "prop di <Axis> (es. <Axis selectedValue={...} />)",
	selectedColor: "prop di <Axis> (es. <Axis selectedColor={...} />)",
};

// Estrae dai config dei children le 6 chiavi del canale trasversale, fondendole
// in un unico GlobalConfig. Avvisa in dev (warnDev) se due componenti impostano
// la stessa chiave primitiva con valori diversi: prima vinceva silenziosamente
// l'ultimo.
//
// `layoutConfig` sono le props di layout di <Chart> (M1): hanno la PRECEDENZA
// sul config dei children, che resta accettato per retrocompatibilita' ma e'
// deprecato (warnDev) e verra' rimosso nella 2.0.
export const computeGlobalConfig = (
	children: JSX.Element[],
	layoutConfig?: ChartLayoutConfig,
): GlobalConfig => {
	const result: GlobalConfig = {};

	for (const child of children) {
		const config = child?.props?.config;
		if (!config) continue;

		for (const key of GLOBAL_CONFIG_KEYS) {
			const value = config[key];
			if (value === undefined) continue;

			// Chiave promossa a prop di un altro componente (M1/M2): resta
			// funzionante (estratta qui) ma avvisa.
			const deprecationTarget = DEPRECATED_CONFIG_KEYS[key];
			if (deprecationTarget) {
				warnDev(
					`config.${key} su Bar/GroupBar e' deprecato: passalo come ${deprecationTarget}. Il supporto sul config verra' rimosso nella 2.0.`,
				);
			}

			const existing = result[key];
			if (
				existing !== undefined &&
				existing !== value &&
				(PRIMITIVE_KEYS as readonly string[]).includes(key)
			) {
				warnDev(
					`config.${key} impostato con valori diversi da piu' componenti: ${JSON.stringify(existing)} verra' sovrascritto da ${JSON.stringify(value)}.`,
				);
			}

			// key e' una chiave nota di GlobalConfig; value proviene da props
			// (any), quindi l'assegnazione e' sicura per costruzione.
			(result as Record<string, unknown>)[key] = value;
		}
	}

	// Le props di layout di <Chart> vincono sul config deprecato dei children.
	if (layoutConfig) {
		for (const key of LAYOUT_KEYS) {
			const value = layoutConfig[key];
			if (value !== undefined) result[key] = value;
		}
	}

	return result;
};
