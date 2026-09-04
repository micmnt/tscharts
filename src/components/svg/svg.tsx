import {
	type CSSProperties,
	type JSX,
	type MouseEvent,
	type MouseEventHandler,
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import {
	ChartMouseContext,
	useChartsDispatch,
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";
import { flattenChildren } from "../../lib/children";

import {
	computeWheelZoom,
	convertToSVGPoint,
	createBandScale,
	getCategorySpacing,
	getChartDimensions,
	getChartTimeScale,
	getChartYScale,
	normalizeTime,
	snapDomain,
} from "../../lib/core";
import {
	type ChartLayoutConfig,
	computeGlobalConfig,
} from "../../lib/globalConfig";
import { isDefined, isTimeSerie } from "../../lib/utils";
import type { Serie } from "../../types";
import CanvasSurface from "../canvas/canvasSurface";
import Legend, { DEFAULT_LEGEND_HEIGHT } from "../legend/legend";
import Tooltip from "../tooltip/tooltip";

export type SVGProps = {
	children: ReactNode;
	containerRef: RefObject<HTMLDivElement | null>;
	chartID: string | null;
	style?: CSSProperties;
	leftAxisCount?: number;
	rightAxisCount?: number;
	ariaLabel?: string;

	layoutConfig?: ChartLayoutConfig;

	onZoomChange?: (domain: [number, number] | null) => void;

	zoomStep?: number;
	zoomSnap?: number;
	renderer?: "svg" | "canvas";
};

const getDefaultAriaLabel = (elements?: Serie[]) => {
	if (!elements || elements.length === 0) return "Grafico";

	const seriesNames = elements.map((el) => el.name).join(", ");
	return `Grafico con ${elements.length} serie: ${seriesNames}`;
};

const getLegendHeight = (children: JSX.Element[]) => {
	const legend = children.find((childEl) => childEl.type === Legend);

	if (!legend) return 0;

	const legendHeight = legend.props?.height
		? legend?.props?.height
		: DEFAULT_LEGEND_HEIGHT;

	return legendHeight;
};

const Svg = (props: SVGProps) => {
	const {
		children,
		containerRef,
		leftAxisCount,
		rightAxisCount,
		chartID,
		style,
		ariaLabel,
		layoutConfig,
		onZoomChange,
		zoomStep,
		zoomSnap,
		renderer = "svg",
	} = props;

	const rootRef = useRef<SVGSVGElement>(null);

	const ctx = useChartsStructural();
	const dispatch = useChartsDispatch();
	const theme = useChartsTheme();

	const { padding } = theme ?? {};

	const [mousePosition, setMousePosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [tooltipVisible, setTooltipVisible] = useState(false);

	const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
	const [overlayPointer, setOverlayPointer] = useState<{
		x: number;
		y: number;
		width: number;
		height: number;
	} | null>(null);

	useEffect(() => {
		setOverlayEl(containerRef.current);
	}, [containerRef]);

	const mouseValue = useMemo(
		() => ({
			mousePosition,
			tooltipVisible,
			overlay: {
				el: overlayEl,
				pointer: overlayPointer
					? { x: overlayPointer.x, y: overlayPointer.y }
					: null,
				width: overlayPointer?.width ?? 0,
				height: overlayPointer?.height ?? 0,
			},
		}),
		[mousePosition, tooltipVisible, overlayEl, overlayPointer],
	);

	const flatChildren = useMemo(() => flattenChildren(children), [children]);

	const legendHeight = useMemo(
		() => getLegendHeight(flatChildren),
		[flatChildren],
	);

	const rawGlobalConfig = useMemo(
		() => computeGlobalConfig(layoutConfig),
		[layoutConfig],
	);
	const globalConfigKey = JSON.stringify({
		barWidth: rawGlobalConfig.barWidth,
		barGroupGap: rawGlobalConfig.barGroupGap,
		barOffset: rawGlobalConfig.barOffset,
	});
	const globalConfigStore = useRef({
		key: globalConfigKey,
		value: rawGlobalConfig,
	});
	if (globalConfigStore.current.key !== globalConfigKey) {
		globalConfigStore.current = {
			key: globalConfigKey,
			value: rawGlobalConfig,
		};
	}
	const globalConfig = globalConfigStore.current.value;

	const initializeChart = useCallback(() => {
		if (
			dispatch &&
			rootRef.current &&
			containerRef.current &&
			isDefined(padding) &&
			isDefined(leftAxisCount) &&
			isDefined(rightAxisCount)
		) {
			const { chartXStart, chartXEnd, chartYEnd } = getChartDimensions(
				padding as number,
				containerRef.current.clientWidth,
				containerRef.current.clientHeight,
				leftAxisCount as number,
				rightAxisCount as number,
				legendHeight,
			);

			if (chartYEnd <= 0 || chartXEnd <= 0) return;
			dispatch({
				type: "INITIALIZE",
				payload: {
					svgRef: rootRef.current,
					width: containerRef.current.clientWidth,
					chartXStart,
					chartXEnd,
					chartYEnd,
					chartYMiddle: (chartYEnd + 2 * padding) / 2,
					chartID,
				},
			});
		}
	}, [
		dispatch,
		containerRef,
		padding,
		rightAxisCount,
		leftAxisCount,
		chartID,
		legendHeight,
	]);

	useEffect(() => {
		initializeChart();

		const container = containerRef.current;
		if (!container || typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", initializeChart);
			return () => window.removeEventListener("resize", initializeChart);
		}

		const observer = new ResizeObserver(() => initializeChart());
		observer.observe(container);
		return () => observer.disconnect();
	}, [initializeChart, containerRef]);

	useEffect(() => {
		if (dispatch) {
			dispatch({
				type: "UPDATE_GLOBAL_CONFIG",
				payload: { globalConfig },
			});
		}
	}, [dispatch, globalConfig]);

	const tooltipChild = useMemo(
		() => flatChildren.find((child) => child.type === Tooltip),
		[flatChildren],
	);
	const hasTooltip = !!tooltipChild;
	const intersect = tooltipChild?.props?.intersect === true;
	useEffect(() => {
		if (dispatch) {
			dispatch({ type: "SET_HAS_TOOLTIP", payload: { hasTooltip } });
		}
	}, [dispatch, hasTooltip]);

	const { svgRef, chartXStart, chartXEnd, chartYEnd, width, height } =
		ctx ?? {};

	const { elements: ctxElements, horizontal: ctxHorizontal } = ctx ?? {};

	const hoverableSerie = ctxElements?.find(isTimeSerie);

	const hasBarLikeSerie = !!ctxElements?.some(
		(el) =>
			el.type === "bar" || el.type === "bar-stacked" || el.type === "group-bar",
	);

	const handleMouseLeave = () => {
		setTooltipVisible(false);
	};

	const handleMouseMove: MouseEventHandler<SVGSVGElement> = useCallback(
		(event: MouseEvent) => {
			const { clientX, clientY } = event;
			if (
				svgRef &&
				dispatch &&
				chartXStart !== undefined &&
				chartXEnd !== undefined &&
				chartYEnd !== undefined
			) {
				const svgPoint = convertToSVGPoint(svgRef, clientX, clientY) ?? {
					x: 0,
					y: 0,
				};

				setMousePosition(svgPoint);

				const containerRect = containerRef.current?.getBoundingClientRect();
				setOverlayPointer(
					containerRect
						? {
								x: clientX - containerRect.left,
								y: clientY - containerRect.top,
								width: containerRect.width,
								height: containerRect.height,
							}
						: null,
				);

				if (ctx && !ctxHorizontal && hoverableSerie) {
					const serieData = hoverableSerie.data;

					const timeScale =
						ctx?.scaleType === "time"
							? getChartTimeScale({
									timeDomain: ctx.timeDomain,
									chartXStart,
									chartXEnd,
									padding: padding ?? 0,
								})
							: null;

					let hoveredIndex: number;
					let center: number;
					let halfWidth: number;

					if (timeScale) {
						const times = serieData.map((d) =>
							normalizeTime(d.date, ctx?.parseDate),
						);
						const mouseTime = timeScale.invert(svgPoint.x);
						hoveredIndex = 0;
						let bestDist = Number.POSITIVE_INFINITY;
						times.forEach((t, i) => {
							const dist = Math.abs(t - mouseTime);
							if (dist < bestDist) {
								bestDist = dist;
								hoveredIndex = i;
							}
						});
						center = timeScale.position(times[hoveredIndex] ?? 0);

						if (hasBarLikeSerie) {
							halfWidth =
								getCategorySpacing(ctx, padding ?? 0) - (padding ?? 0) / 2;
						} else {
							const neighborGaps = [
								times[hoveredIndex - 1],
								times[hoveredIndex + 1],
							]
								.filter((t): t is number => isDefined(t))
								.map((t) => Math.abs(timeScale.position(t) - center));
							halfWidth = neighborGaps.length
								? Math.min(...neighborGaps) / 2
								: (padding ?? 0);
						}
					} else {
						const xSpace = getCategorySpacing(ctx, padding ?? 0);
						const xScale = createBandScale({
							start: chartXStart,
							end: chartXEnd,
							count: serieData.length,
							firstOffset: xSpace,
						});
						hoveredIndex = xScale.invert(svgPoint.x);

						center = xScale.position(hoveredIndex);
						halfWidth = xSpace - (padding ?? 0) / 2;
					}

					const isOverElement =
						!intersect || Math.abs(svgPoint.x - center) <= halfWidth;

					setTooltipVisible(isOverElement);

					if (
						isOverElement &&
						hoveredIndex >= 0 &&
						hoveredIndex < serieData.length
					) {
						const el = serieData[hoveredIndex];
						if (el) {
							dispatch({
								type: "SET_HOVER_ELEMENT",
								payload: {
									hoveredElement: {
										elementIndex: hoveredIndex,
										label: el.date,
									},
								},
							});
						}
					}
				} else {
					setTooltipVisible(true);
				}
			}
		},
		[
			svgRef,
			dispatch,
			containerRef,
			chartXStart,
			chartXEnd,
			chartYEnd,
			ctx,
			ctxHorizontal,
			hoverableSerie,
			hasBarLikeSerie,
			padding,
			intersect,
		],
	);

	const zoomAccRef = useRef<[number, number] | null>(null);
	if (!ctx?.zoomDomain) zoomAccRef.current = null;
	const zoomParamsRef = useRef<{
		baseDomain?: readonly [number, number];
		chartYEnd?: number;
		padding?: number;
		zoomStep?: number;
		zoomSnap?: number;
		svgRef?: SVGSVGElement | null;
		onZoomChange?: (domain: [number, number] | null) => void;
	}>({});
	zoomParamsRef.current = {
		baseDomain: ctx?.yBaseDomain,
		chartYEnd,
		padding,
		zoomStep,
		zoomSnap,
		svgRef,
		onZoomChange,
	};

	useEffect(() => {
		const el = rootRef.current;
		if (!el || !ctx?.zoomable || !dispatch) return;

		const onWheel = (event: WheelEvent) => {
			const p = zoomParamsRef.current;
			if (!p.baseDomain) return;
			event.preventDefault();
			const point = convertToSVGPoint(
				p.svgRef ?? el,
				event.clientX,
				event.clientY,
			);
			if (!point) return;
			const current = zoomAccRef.current ?? p.baseDomain;
			const value = getChartYScale({
				min: current[0],
				max: current[1],
				chartYEnd: p.chartYEnd ?? 0,
				padding: p.padding ?? 0,
			}).invert(point.y);
			const next = computeWheelZoom({
				domain: current,
				baseDomain: p.baseDomain,
				value,
				deltaY: event.deltaY,
				zoomStep: p.zoomStep,
			});
			zoomAccRef.current = next;
			const display =
				p.zoomSnap && p.zoomSnap > 0
					? snapDomain(next, p.zoomSnap, p.baseDomain)
					: next;
			dispatch({ type: "SET_ZOOM", payload: { zoomDomain: display } });
			p.onZoomChange?.(display);
		};

		el.addEventListener("wheel", onWheel, { passive: false });
		return () => el.removeEventListener("wheel", onWheel);
	}, [ctx?.zoomable, dispatch]);

	const handleDoubleClick = useCallback(() => {
		if (!ctx?.zoomable || !ctx.zoomDomain || !dispatch) return;
		zoomAccRef.current = null;
		dispatch({ type: "CLEAR_ZOOM", payload: {} });
		onZoomChange?.(null);
	}, [ctx?.zoomable, ctx?.zoomDomain, dispatch, onZoomChange]);

	if (!height) return null;

	const viewBox = `0 0 ${width} ${height + legendHeight}`;

	const svgEl = (
		<svg
			style={style}
			ref={rootRef}
			viewBox={viewBox}
			width={width}
			height={height + legendHeight}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			onDoubleClick={handleDoubleClick}
			role="img"
			aria-label={ariaLabel ?? getDefaultAriaLabel(ctxElements)}
		>
			{}
			<ChartMouseContext.Provider value={mouseValue}>
				{children}
			</ChartMouseContext.Provider>
		</svg>
	);

	if (renderer === "canvas") {
		return (
			<CanvasSurface width={width ?? 0} height={(height ?? 0) + legendHeight}>
				{svgEl}
			</CanvasSurface>
		);
	}

	return svgEl;
};

export default Svg;
