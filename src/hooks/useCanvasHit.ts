import { useEffect, useId } from "react";
import {
	type CanvasHitRegion,
	useCanvasLayer,
} from "../contexts/canvasContext";

export function useCanvasHit(regions: CanvasHitRegion[] | null): void {
	const layer = useCanvasLayer();
	const id = useId();

	useEffect(() => {
		if (!layer || !regions) return;
		layer.registerHit(id, regions);
		return () => layer.unregisterHit(id);
	}, [layer, id, regions]);
}
