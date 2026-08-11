/* React Imports */
import { createContext, useContext } from "react";

// Una draw-op: disegna una marca sul context 2D condiviso. Il canvas e' UN solo
// nodo DOM, quindi in modalita' canvas le marche (Line/Bar) NON emettono
// elementi SVG: registrano qui la propria funzione di disegno e il
// <CanvasSurface> le ridipinge tutte su un unico bitmap.
export type CanvasDrawOp = (g: CanvasRenderingContext2D) => void;

// Una zona cliccabile: la marca (Bar) fornisce la STESSA stringa path `d` usata
// per il disegno; il Path2D per l'hit-test (isPointInPath) si costruisce lazy,
// cosi' in render (e in jsdom, che non ha Path2D) non serve. onClick/
// onPointerDown sono le callback della marca (increment 2: click/drag barra).
export type CanvasHitRegion = {
	d: string;
	onClick?: () => void;
	onPointerDown?: (event: PointerEvent) => void;
};

export type CanvasLayer = {
	register: (id: string, draw: CanvasDrawOp) => void;
	unregister: (id: string) => void;
	// Hit-region per un'intera marca (tutte le barre di una serie sotto un id).
	registerHit: (id: string, regions: CanvasHitRegion[]) => void;
	unregisterHit: (id: string) => void;
	// Ritorna la region sotto il punto (in px logici) o null. Topmost vince.
	hitTest: (x: number, y: number) => CanvasHitRegion | null;
};

// null = modalita' SVG (nessun canvas montato): le marche prendono il ramo SVG
// di sempre, byte-identico. Il provider e' presente SOLO con
// <Chart renderer="canvas">. E' l'interruttore dell'invariante "SVG esclude
// completamente il canvas".
export const CanvasLayerContext = createContext<CanvasLayer | null>(null);

export function useCanvasLayer() {
	return useContext(CanvasLayerContext);
}
