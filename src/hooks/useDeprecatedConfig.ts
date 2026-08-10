import { useRef } from "react";
import { warnDev } from "../lib/utils";

// Avvisa (una sola volta per istanza) se il `config` deprecato di Bar/GroupBar
// contiene chiavi ora disponibili come props piatte (M4). L'avviso e'
// once-per-istanza perche' Bar/GroupBar si ri-renderizzano (es. al resize) e
// warnDev non deduplica. Considera solo le chiavi "bar-local" passate in
// `localKeys`: quelle gia' rilocate su <Chart> (M1) o <Axis> (M2) avvisano
// altrove (computeGlobalConfig), quindi non vanno segnalate di nuovo qui.
export const useDeprecatedConfigWarning = (
	config: Record<string, unknown> | undefined,
	localKeys: readonly string[],
	component: string,
	flatHint: string,
) => {
	const warned = useRef(false);

	if (!warned.current && config) {
		const used = localKeys.filter((key) => config[key] !== undefined);
		if (used.length > 0) {
			warnDev(
				`config su <${component}> e' deprecato: usa le props piatte (${flatHint}). Chiavi trovate: ${used.join(", ")}. Rimozione nella 2.0.`,
			);
			warned.current = true;
		}
	}
};
