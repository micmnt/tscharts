/* React Imports */
import { useEffect, useId } from "react";
/* Context Imports */
import { type CanvasDrawOp, useCanvasLayer } from "../contexts/canvasContext";

// Registra una draw-op nel layer canvas. NO-OP in modalita' SVG (nessun layer
// nel context) e quando `draw` e' null: cosi' <Line>/<Bar> chiamano SEMPRE
// l'hook (regola degli hook) ma in SVG non fanno nulla e restano sul loro ramo
// SVG. La draw-op si ri-registra quando cambia identita' (dati/stile diversi) ->
// il <CanvasSurface> ridipinge.
export function useCanvasMark(draw: CanvasDrawOp | null): void {
	const layer = useCanvasLayer();
	const id = useId();

	useEffect(() => {
		if (!layer || !draw) return;
		layer.register(id, draw);
		return () => layer.unregister(id);
	}, [layer, id, draw]);
}
