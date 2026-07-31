// Angolo minimo (in gradi) di uno spicchio pie/donut sotto il quale la sua
// etichetta non viene mostrata, per evitare overlap su spicchi troppo stretti.
export const MIN_PIE_SLICE_LABEL_ANGLE = 31;

// Altezza minima (in px) di una barra sotto la quale il punto-etichetta
// interno viene omesso (dataPoint [-1, -1]) invece di essere disegnato.
export const MIN_BAR_HEIGHT_FOR_LABEL = 16;

// Stessa soglia di MIN_BAR_HEIGHT_FOR_LABEL ma per i segmenti di barre
// stacked. Il valore e' diverso (14 invece di 16) nel codice originale;
// la ragione della differenza non e' documentata, da verificare se si
// interviene su questa soglia in futuro.
export const MIN_STACKED_BAR_HEIGHT_FOR_LABEL = 14;

// Moltiplicatore di `padding` per l'offset verticale (puramente estetico)
// delle label dell'asse X nei grafici con valori negativi, sotto la linea
// dello zero. Usato solo per il posizionamento del testo in axis.tsx: non
// determina la scala dei valori (per quella vedi `halfHeight` in
// generateNegativeDataPaths/generateYAxis e in threshold.tsx).
export const NEGATIVE_CHART_X_AXIS_OFFSET_MULTIPLIER = 3.5;

// Offset orizzontale di default (in px) per i grafici a barre/linee
// orizzontali quando `barOffset` non viene specificato via config: riserva
// spazio a sinistra per le etichette di categoria. Riusato anche in
// axis.tsx per posizionare quelle label in modo coerente con barre/linea.
export const DEFAULT_HORIZONTAL_BAR_OFFSET = 40;
