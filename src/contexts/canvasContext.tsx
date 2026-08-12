import { createContext, useContext } from "react";

export type CanvasDrawOp = (g: CanvasRenderingContext2D) => void;

export type CanvasHitRegion = {
	d: string;
	onClick?: () => void;
	onPointerDown?: (event: PointerEvent) => void;
};

export type CanvasLayer = {
	register: (id: string, draw: CanvasDrawOp) => void;
	unregister: (id: string) => void;
	registerHit: (id: string, regions: CanvasHitRegion[]) => void;
	unregisterHit: (id: string) => void;
	hitTest: (x: number, y: number) => CanvasHitRegion | null;
};

export const CanvasLayerContext = createContext<CanvasLayer | null>(null);

export function useCanvasLayer() {
	return useContext(CanvasLayerContext);
}
