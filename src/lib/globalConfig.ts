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

// Estrae dai config dei children le 6 chiavi del canale trasversale, fondendole
// in un unico GlobalConfig. Avvisa in dev (warnDev) se due componenti impostano
// la stessa chiave primitiva con valori diversi: prima vinceva silenziosamente
// l'ultimo.
export const computeGlobalConfig = (children: JSX.Element[]): GlobalConfig => {
	const result: GlobalConfig = {};

	for (const child of children) {
		const config = child?.props?.config;
		if (!config) continue;

		for (const key of GLOBAL_CONFIG_KEYS) {
			const value = config[key];
			if (value === undefined) continue;

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

	return result;
};
