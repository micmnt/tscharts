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

// Scala lineare generica: mappa un valore continuo dal dominio [d0,d1] al range
// pixel [r0,r1]. E' il primitivo condiviso da tutte le scale continue della
// libreria: la scala tempo (createTimeScale) e la scala dei valori Y
// (getChartYScale) sono entrambe scale lineari, cambiano solo cosa rappresenta
// il dominio (istante / valore) e i nomi.
export type LinearScale = {
	// px corrispondente a un valore del dominio.
	scale: (value: number) => number;
	// valore corrispondente a una coordinata px (inverso di scale).
	invert: (px: number) => number;
	// N valori equispaziati nel dominio [min, max] (estremi inclusi).
	ticks: (count: number) => number[];
	domain: readonly [number, number];
};

export const createLinearScale = ({
	domain,
	range,
}: {
	domain: readonly [number, number];
	range: readonly [number, number];
}): LinearScale => {
	const [d0, d1] = domain;
	const [r0, r1] = range;
	// dominio degenere (estremi uguali) -> span 1 per non dividere per zero;
	// tutti i valori finiscono su r0.
	const dspan = d1 - d0 || 1;
	const rspan = r1 - r0;

	return {
		domain,
		scale: (value: number) => r0 + ((value - d0) / dspan) * rspan,
		invert: (px: number) => d0 + ((px - r0) / (rspan || 1)) * dspan,
		ticks: (count: number) => {
			const n = Math.max(1, Math.floor(count));
			if (n === 1) return [d0];
			return Array.from({ length: n }, (_, i) => d0 + (dspan * i) / (n - 1));
		},
	};
};

// Scala "time": una LinearScale il cui dominio e' il tempo (ms epoch). E' cio'
// che rende la spaziatura proporzionale al tempo e non all'indice (S2b).
// `position` e' l'alias di `scale` (il valore mappato e' un istante).
export type TimeScale = {
	position: (time: number) => number;
	invert: (x: number) => number;
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
	const lin = createLinearScale({ domain, range });
	return {
		domain: lin.domain,
		position: lin.scale,
		invert: lin.invert,
		ticks: lin.ticks,
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

// Scala dei VALORI dell'asse Y (grafico verticale, non-negativo). Riproduce
// esattamente il posizionamento storico: con min=0 (default) `scale(v)` equivale
// a `chartYEnd - getValuePosition(max, v, chartYEnd - padding)` (byte-identico).
// `min`/`max` custom (S1b-B) restringono il dominio; i valori fuori vengono
// CLAMPati ai bordi (no-op col dominio di default, dove ogni valore <= max).
// I grafici negativi/stacked-negativi NON usano questa scala: hanno un dominio
// simmetrico attorno a zero, gestito a parte.
// Arrotonda gli estremi di un dominio al multiplo `snap`, restando dentro il
// dominio base e mantenendo almeno un multiplo di ampiezza. Se lo snap
// degenererebbe il dominio, ritorna quello invariato. Estratto (S3b) per essere
// applicato all'OUTPUT dello zoom senza "ingoiare" i delta piccoli: l'accumulo
// interno resta continuo, lo snap tocca solo cio' che si mostra.
export const snapDomain = (
	domain: readonly [number, number],
	snap: number,
	baseDomain: readonly [number, number],
): [number, number] => {
	if (!snap || snap <= 0) return [domain[0], domain[1]];
	const [baseMin, baseMax] = baseDomain;
	let min = Math.round(domain[0] / snap) * snap;
	let max = Math.round(domain[1] / snap) * snap;
	if (max - min < snap) max = min + snap;
	min = Math.max(baseMin, min);
	max = Math.min(baseMax, max);
	return max > min ? [min, max] : [domain[0], domain[1]];
};

// Zoom rotella (S3): dato il dominio corrente, il dominio base (limite), il
// valore sotto il cursore e il delta della rotella, calcola il nuovo dominio.
// - deltaY > 0 (giu') -> zoom out; < 0 (su') -> zoom in.
// - il valore sotto il cursore resta ancorato allo stesso punto (zoom "focale");
// - lo span e' clampato tra minSpan (max zoom-in) e il baseSpan (max zoom-out);
// - il dominio e' clampato dentro baseDomain (niente pan nel vuoto).
export const computeWheelZoom = ({
	domain,
	baseDomain,
	value,
	deltaY,
	zoomStep = 1.15,
	minSpanRatio = 0.02,
	snap,
}: {
	domain: readonly [number, number];
	baseDomain: readonly [number, number];
	value: number;
	deltaY: number;
	// Fattore di zoom per "tacca" di rotella: una tacca standard (deltaY~=100)
	// applica esattamente `zoomStep`. Piu' alto = zoom piu' aggressivo.
	zoomStep?: number;
	minSpanRatio?: number;
	// Se >0, arrotonda gli estremi del dominio al multiplo indicato (via i
	// decimali "sporchi"); resta dentro il base e lo span minimo.
	snap?: number;
}): [number, number] => {
	const [cMin, cMax] = domain;
	const [baseMin, baseMax] = baseDomain;
	const span = cMax - cMin;
	const baseSpan = baseMax - baseMin || 1;

	// deltaY > 0 (rotella giu') -> factor > 1 -> span cresce (zoom out); su' -> in.
	const factor = zoomStep ** (deltaY / 100);
	const minSpan = baseSpan * minSpanRatio;
	const newSpan = Math.min(baseSpan, Math.max(minSpan, span * factor));

	// mantiene `value` alla stessa frazione del dominio (zoom focale sul cursore)
	const frac = span === 0 ? 0.5 : (value - cMin) / span;
	let newMin = value - frac * newSpan;
	let newMax = newMin + newSpan;

	// clamp dentro il dominio base
	if (newMin < baseMin) {
		newMin = baseMin;
		newMax = baseMin + newSpan;
	} else if (newMax > baseMax) {
		newMax = baseMax;
		newMin = baseMax - newSpan;
	}

	// snap: estremi al multiplo di `snap`, restando dentro il base. Se lo snap
	// degenererebbe il dominio (span < snap vicino a un bordo) lo lascio invariato.
	if (snap && snap > 0) {
		let sMin = Math.round(newMin / snap) * snap;
		let sMax = Math.round(newMax / snap) * snap;
		if (sMax - sMin < snap) sMax = sMin + snap;
		sMin = Math.max(baseMin, sMin);
		sMax = Math.min(baseMax, sMax);
		if (sMax > sMin) {
			newMin = sMin;
			newMax = sMax;
		}
	}

	return [newMin, newMax];
};

export const getChartYScale = ({
	min = 0,
	max,
	chartYEnd,
	padding,
}: {
	min?: number;
	max: number;
	chartYEnd: number;
	padding: number;
}): LinearScale => {
	const span = max - min || 1;
	const dim = chartYEnd - padding || 1;
	const clamp = (v: number) => (v < min ? min : v > max ? max : v);

	return {
		domain: [min, max],
		// `dim * (v - min) / span` = getValuePosition(span, v-min, dim); con min=0
		// e' identico a getValuePosition(max, v, dim). serieY = chartYEnd - quello.
		scale: (value: number) => chartYEnd - (dim * (clamp(value) - min)) / span,
		invert: (px: number) => min + ((chartYEnd - px) * span) / dim,
		ticks: (count: number) => {
			const n = Math.max(1, Math.floor(count));
			if (n === 1) return [min];
			return Array.from({ length: n }, (_, i) => min + (span * i) / (n - 1));
		},
	};
};
