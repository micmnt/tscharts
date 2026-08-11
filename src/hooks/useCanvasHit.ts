/* React Imports */
import { useEffect, useId } from "react";
/* Context Imports */
import {
	type CanvasHitRegion,
	useCanvasLayer,
} from "../contexts/canvasContext";

// Registra le hit-region di una marca (Bar) nel layer canvas. NO-OP in modalita'
// SVG (nessun layer) e quando `regions` e' null. Compagno di useCanvasMark: la
// draw-op disegna, le hit-region rendono click/drag intercettabili via
// isPointInPath dal <CanvasSurface>.
export function useCanvasHit(regions: CanvasHitRegion[] | null): void {
	const layer = useCanvasLayer();
	const id = useId();

	useEffect(() => {
		if (!layer || !regions) return;
		layer.registerHit(id, regions);
		return () => layer.unregisterHit(id);
	}, [layer, id, regions]);
}
