import {
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	type CanvasDrawOp,
	type CanvasHitRegion,
	type CanvasLayer,
	CanvasLayerContext,
} from "../../contexts/canvasContext";
import { useChartsStructural } from "../../contexts/chartContext";
import { setupHiDPI } from "../../lib/canvas/paint";
import { convertToSVGPoint } from "../../lib/core";

type CanvasSurfaceProps = {
	width: number;
	height: number;
	children: ReactNode;
};

const CanvasSurface = (props: CanvasSurfaceProps) => {
	const { width, height, children } = props;

	const ctx = useChartsStructural();

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const opsRef = useRef<Map<string, CanvasDrawOp>>(new Map());
	const hitsRef = useRef<Map<string, CanvasHitRegion[]>>(new Map());
	const hitCtxRef = useRef<CanvasRenderingContext2D | null>(null);
	const rafRef = useRef<number | null>(null);
	const dprRef = useRef(1);
	const [hasDraggable, setHasDraggable] = useState(false);

	const syncDraggable = useCallback(() => {
		let any = false;
		for (const regions of hitsRef.current.values()) {
			if (regions.some((r) => r.onPointerDown)) {
				any = true;
				break;
			}
		}
		setHasDraggable((prev) => (prev === any ? prev : any));
	}, []);

	const paint = useCallback(() => {
		rafRef.current = null;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const g = canvas.getContext("2d");
		if (!g) return;
		const dpr = dprRef.current;
		g.setTransform(dpr, 0, 0, dpr, 0, 0);
		g.clearRect(0, 0, width, height);
		for (const draw of opsRef.current.values()) {
			g.save();
			draw(g);
			g.restore();
		}
	}, [width, height]);

	const schedule = useCallback(() => {
		if (rafRef.current != null) return;
		if (typeof requestAnimationFrame === "undefined") {
			paint();
			return;
		}
		rafRef.current = requestAnimationFrame(paint);
	}, [paint]);

	const hitTest = useCallback(
		(x: number, y: number): CanvasHitRegion | null => {
			if (typeof Path2D === "undefined") return null;
			if (!hitCtxRef.current && typeof document !== "undefined") {
				hitCtxRef.current = document.createElement("canvas").getContext("2d");
			}
			const g = hitCtxRef.current;
			if (!g) return null;
			let found: CanvasHitRegion | null = null;
			for (const regions of hitsRef.current.values()) {
				for (const region of regions) {
					if (!region.d) continue;
					if (g.isPointInPath(new Path2D(region.d), x, y)) found = region;
				}
			}
			return found;
		},
		[],
	);

	const layer = useMemo<CanvasLayer>(
		() => ({
			register: (id, draw) => {
				opsRef.current.set(id, draw);
				schedule();
			},
			unregister: (id) => {
				opsRef.current.delete(id);
				schedule();
			},
			registerHit: (id, regions) => {
				hitsRef.current.set(id, regions);
				syncDraggable();
			},
			unregisterHit: (id) => {
				hitsRef.current.delete(id);
				syncDraggable();
			},
			hitTest,
		}),
		[schedule, hitTest, syncDraggable],
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		dprRef.current = setupHiDPI(canvas, width, height);
		schedule();
	}, [width, height, schedule]);

	useEffect(
		() => () => {
			if (rafRef.current != null && typeof cancelAnimationFrame !== "undefined")
				cancelAnimationFrame(rafRef.current);
		},
		[],
	);

	const pointOf = useCallback(
		(clientX: number, clientY: number) => {
			const svgRef = ctx?.svgRef;
			if (!svgRef) return null;
			return convertToSVGPoint(svgRef, clientX, clientY);
		},
		[ctx?.svgRef],
	);

	const handleClick = useCallback(
		(event: ReactMouseEvent<HTMLDivElement>) => {
			const point = pointOf(event.clientX, event.clientY);
			if (!point) return;
			hitTest(point.x, point.y)?.onClick?.();
		},
		[pointOf, hitTest],
	);

	const handlePointerDown = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			const point = pointOf(event.clientX, event.clientY);
			if (!point) return;
			hitTest(point.x, point.y)?.onPointerDown?.(event.nativeEvent);
		},
		[pointOf, hitTest],
	);

	return (
		<CanvasLayerContext.Provider value={layer}>
			<div
				style={{
					position: "relative",
					width,
					height,
					touchAction: hasDraggable ? "none" : undefined,
				}}
				onClick={handleClick}
				onPointerDown={handlePointerDown}
			>
				<canvas
					ref={canvasRef}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width,
						height,
						pointerEvents: "none",
					}}
				/>
				<div style={{ position: "relative", zIndex: 1 }}>{children}</div>
			</div>
		</CanvasLayerContext.Provider>
	);
};

export default CanvasSurface;
