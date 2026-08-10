// Scala "band": mappa l'indice di una categoria a una coordinata pixel con
// passo costante. Incapsula l'aritmetica X finora ripetuta a mano nei
// generatori (`step * index + base`) e il suo inverso usato dall'hover
// (`round((x - base) / step)`). Poiche' `position` e `invert` nascono dalla
// stessa coppia `step`/`base`, non possono piu' divergere (prima erano scritti
// in file diversi). E' anche il punto di sostituzione per una futura scala
// temporale (S2): cambia l'implementazione di position/invert, non i chiamanti.
//
// NB: i vari chiamanti hanno offset di partenza diversi (barra = padding/2,
// linea = padding/2 + xSpacing, centro categoria = getCategorySpacing): la
// scala li incapsula tramite `firstOffset`, non li unifica. L'unificazione e'
// un cambio di comportamento e non fa parte di questo refactor.
export type BandScale = {
	// Coordinata (px) della categoria i-esima.
	position: (index: number) => number;
	// Indice piu' vicino a una coordinata x (inverso di position).
	invert: (x: number) => number;
	// Passo tra due categorie consecutive (ex `xAxisInterval`).
	step: number;
	// Coordinata della categoria 0 (`start + firstOffset`).
	base: number;
};

export const createBandScale = ({
	start,
	end,
	count,
	firstOffset = 0,
}: {
	start: number;
	end: number;
	count: number;
	firstOffset?: number;
}): BandScale => {
	// `count || 1` evita la divisione per zero; con count 0 la scala non viene
	// comunque interrogata (nessun elemento da mappare).
	const step = (end - start) / (count || 1);
	const base = start + firstOffset;

	return {
		step,
		base,
		position: (index: number) => step * index + base,
		invert: (x: number) => Math.round((x - base) / step),
	};
};

// Scala "time": mappa un istante (ms epoch) a una coordinata pixel con un
// mapping lineare dominio->range. Stessa forma di BandScale (position/invert),
// ma il dominio e' continuo (tempo) invece che l'indice di categoria: e' cio'
// che rende la spaziatura proporzionale al tempo e non all'indice (S2b). I
// tick sono N istanti equispaziati nel dominio.
export type TimeScale = {
	// Coordinata (px) di un istante.
	position: (time: number) => number;
	// Istante corrispondente a una coordinata x (inverso di position).
	invert: (x: number) => number;
	// N istanti equispaziati nel dominio [min, max] (estremi inclusi).
	ticks: (count: number) => number[];
	domain: readonly [number, number];
};

export const createTimeScale = ({
	domain,
	range,
}: {
	domain: readonly [number, number];
	range: readonly [number, number];
}): TimeScale => {
	const [d0, d1] = domain;
	const [r0, r1] = range;
	// dominio degenere (un solo punto, o date tutte uguali) -> span 1 per non
	// dividere per zero; tutti i punti finiscono su r0.
	const span = d1 - d0 || 1;
	const rspan = r1 - r0;

	return {
		domain,
		position: (time: number) => r0 + ((time - d0) / span) * rspan,
		invert: (x: number) => d0 + ((x - r0) / (rspan || 1)) * span,
		ticks: (count: number) => {
			const n = Math.max(1, Math.floor(count));
			if (n === 1) return [d0];
			return Array.from({ length: n }, (_, i) => d0 + (span * i) / (n - 1));
		},
	};
};

// Fonte UNICA della scala temporale del grafico: costruita da dominio
// (ctx.timeDomain, gia' calcolato da <Chart> via parseDate) e range in pixel
// [chartXStart + padding, chartXEnd - padding]. Generatore line, asse e hover
// la ottengono da qui, cosi' non possono divergere (stesso principio di S2a).
// Ritorna null se non c'e' un dominio tempo (scaleType != "time").
export const getChartTimeScale = (ctx: {
	timeDomain?: readonly [number, number];
	chartXStart: number;
	chartXEnd: number;
	padding: number;
}): TimeScale | null => {
	if (!ctx.timeDomain) return null;
	return createTimeScale({
		domain: ctx.timeDomain,
		range: [ctx.chartXStart + ctx.padding, ctx.chartXEnd - ctx.padding],
	});
};
