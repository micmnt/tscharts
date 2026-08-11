/* React Imports */
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
/* Context Imports */
import {
	type CanvasDrawOp,
	type CanvasHitRegion,
	type CanvasLayer,
	CanvasLayerContext,
} from "../../contexts/canvasContext";
import { useChartsStructural } from "../../contexts/chartContext";
/* Canvas / Core Imports */
import { setupHiDPI } from "../../lib/canvas/paint";
import { convertToSVGPoint } from "../../lib/core";

type CanvasSurfaceProps = {
	// Dimensioni in pixel logici: devono combaciare con l'<svg> sovrastante
	// (width x (height + legenda)), cosi' i path calcolati dal core cadono sullo
	// stesso pixel su entrambi gli strati.
	width: number;
	height: number;
	// L'<svg> (assi/legenda/tooltip/hover) piu' i children (le marche, che in
	// canvas-mode rendono null ma registrano una draw-op).
	children: ReactNode;
};

// Strato canvas dell'ibrido: un <canvas> DIETRO l'<svg> (pointer-events:none),
// stesso sistema di coordinate. Fa da provider del registry: le marche
// registrano draw-op (e hit-region per il click/drag), qui si ridipinge tutto su
// un solo bitmap (debounce rAF). Il render SVG resta sopra e cattura gli eventi
// (hover matematico invariato); il click/drag delle barre canvas passa dagli
// handler sul div wrapper (gli eventi dell'svg bollano qui) via isPointInPath.
const CanvasSurface = (props: CanvasSurfaceProps) => {
	const { width, height, children } = props;

	const ctx = useChartsStructural();

	const canvasRef = useRef<HTMLCanvasElement>(null);
	// Registry delle draw-op, chiave -> funzione. Un Map preserva l'ordine di
	// inserimento = ordine di registrazione = ordine dei children (gli effetti
	// React girano in ordine d'albero) -> z-order coerente.
	const opsRef = useRef<Map<string, CanvasDrawOp>>(new Map());
	// Registry delle hit-region per marca (Bar): id -> array di zone cliccabili.
	const hitsRef = useRef<Map<string, CanvasHitRegion[]>>(new Map());
	// Context 2D dedicato all'hit-test (identita'), separato da quello di disegno
	// che ha il transform dpr: isPointInPath vuole il punto nello stesso spazio
	// del path (px logici). Creato lazy.
	const hitCtxRef = useRef<CanvasRenderingContext2D | null>(null);
	const rafRef = useRef<number | null>(null);
	const dprRef = useRef(1);
	// Se ci sono barre draggabili, il div mette touch-action:none per non far
	// scrollare la pagina durante il drag da touch. Altrimenti (scatter, canvas
	// non interattivo) resta scrollabile.
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

	// Coalizza le N registrazioni di un render in UN solo paint (un frame).
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
			// Ordine di inserimento; l'ultima match e' quella disegnata sopra.
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

	// HiDPI: (ri)dimensiona il backing store e ridipinge al cambio dimensioni/dpr.
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

	// Hit-test dal div wrapper: gli eventi dell'<svg> (sopra) bollano qui. Mappo
	// client -> punto svg (stesso spazio dei path) e cerco la barra colpita.
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
			{/* Il div e' un proxy di hit-test verso il canvas; le barre cliccabili
			    hanno i propri elementi focusabili (path role=button) resi da <Bar>. */}
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
				{children}
			</div>
		</CanvasLayerContext.Provider>
	);
};

export default CanvasSurface;
