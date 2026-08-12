import { useEffect, useId } from "react";
import { type CanvasDrawOp, useCanvasLayer } from "../contexts/canvasContext";

export function useCanvasMark(draw: CanvasDrawOp | null): void {
	const layer = useCanvasLayer();
	const id = useId();

	useEffect(() => {
		if (!layer || !draw) return;
		layer.register(id, draw);
		return () => layer.unregister(id);
	}, [layer, id, draw]);
}
