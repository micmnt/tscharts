import { normalizeBarRadius } from "../utils";

export const getValuePosition = (
	maxValue: number,
	value: number,
	chartDimension: number,
) => {
	return (chartDimension * value) / maxValue;
};

export const generateVerticalLine = (x: number, y: number, startY: number) => {
	return `M ${x} ${startY} V ${y}`;
};

export const generateVerticalBarPath = (
	x: number,
	y: number,
	barWidth: number,
	startY: number,
	radius?: number,
	topLeftRadius?: number,
	topRightRadius?: number,
	bottomRightRadius?: number,
	bottomLeftRadius?: number,
	isNegative?: boolean,
) => {
	if (
		(radius ||
			topLeftRadius ||
			bottomLeftRadius ||
			topRightRadius ||
			bottomRightRadius) &&
		y !== startY
	) {
		const normalizedRadius = normalizeBarRadius(radius, startY - y);
		const normalizedTopLeftRadius = normalizeBarRadius(
			topLeftRadius,
			startY - y,
		);
		const normalizedBottomLeftRadius = normalizeBarRadius(
			bottomLeftRadius,
			startY - y,
		);
		const normalizedTopRightRadius = normalizeBarRadius(
			topRightRadius,
			startY - y,
		);
		const normalizedBottomRightRadius = normalizeBarRadius(
			bottomRightRadius,
			startY - y,
		);

		const topY = isNegative ? startY : y;
		const bottomY = isNegative ? y : startY;

		const topLeftCorner =
			normalizedRadius || normalizedTopLeftRadius
				? `Q${x},${topY} ${x + (normalizedRadius || normalizedTopLeftRadius || 0)},${topY}`
				: "";
		const topRightCorner =
			normalizedRadius || normalizedTopRightRadius
				? `Q${x + barWidth},${topY} ${x + barWidth},${topY + (normalizedRadius || normalizedTopRightRadius || 0)}`
				: "";
		const bottomRightCorner =
			normalizedRadius || normalizedBottomRightRadius
				? `Q${x + barWidth},${bottomY} ${x + barWidth - (normalizedRadius || normalizedBottomRightRadius || 0)},${bottomY}`
				: "";
		const bottomLeftCorner =
			normalizedRadius || normalizedBottomLeftRadius
				? `Q${x},${bottomY} ${x},${bottomY - (normalizedRadius || normalizedBottomLeftRadius || 0)}`
				: "";

		const startPosition = `M ${x} ${bottomY + (normalizedRadius || normalizedTopLeftRadius || 0)}`;
		const topLeftPoint = `V ${topY + (normalizedRadius || normalizedTopLeftRadius || 0)}`;
		const topRightPoint = `H ${x + barWidth - (normalizedRadius || normalizedTopRightRadius || 0)}`;
		const bottomRightPoint = `V ${bottomY - (normalizedRadius || normalizedBottomRightRadius || 0)}`;
		const bottomLeftPoint = `H ${x + (normalizedRadius || normalizedBottomLeftRadius || 0)}`;

		return `${startPosition} ${topLeftPoint} ${topLeftCorner} ${topRightPoint} ${topRightCorner} ${bottomRightPoint} ${bottomRightCorner} ${bottomLeftPoint} ${bottomLeftCorner}`;
	}
	return `M ${x} ${startY} V ${y} H ${x + barWidth} V ${startY} Z`;
};

export const generateLine = (x: number, y: number) => {
	return `L ${x} ${y}`;
};

export const generatePieSlice = (
	centerX: number,
	centerY: number,
	radius: number,
	startAngle: number,
	endAngle: number,
) => {
	const startRadius = `M ${centerX} ${centerY} L ${centerX} ${startAngle}`;
	const endRadius = `L ${centerX} ${centerY}`;

	const arc = generateArcBarPath(
		centerX,
		centerY,
		radius,
		undefined,
		startAngle,
		endAngle,
	);

	return `${startRadius} ${arc} ${endRadius}`;
};

export const generateDonutSlice = (
	centerX: number,
	centerY: number,
	radius: number,
	innerRadius: number,
	startAngle: number,
	endAngle: number,
) => {
	const arc = generateArcBarPath(
		centerX,
		centerY,
		radius,
		innerRadius,
		startAngle,
		endAngle,
	);

	return arc;
};

export const generateArcBarPath = (
	centerX: number,
	centerY: number,
	radius: number,
	innerRadius: number | undefined,
	startAngle: number,
	endAngle: number,
) => {
	const startPoint = polarToCartesian(centerX, centerY, radius, startAngle);
	const endPoint = polarToCartesian(centerX, centerY, radius, endAngle);

	const isLargeArc = endAngle - startAngle <= 180 ? 0 : 1;

	if (innerRadius) {
		const startInnerPoint = polarToCartesian(
			centerX,
			centerY,
			innerRadius,
			startAngle,
		);
		const endInnerPoint = polarToCartesian(
			centerX,
			centerY,
			innerRadius,
			endAngle,
		);
		return `M ${startPoint.x} ${startPoint.y}
			A ${radius} ${radius} 0 ${isLargeArc} 1 ${endPoint.x} ${endPoint.y}
			L ${endInnerPoint.x} ${endInnerPoint.y}
			A ${innerRadius} ${innerRadius} 0 ${isLargeArc} 0 ${startInnerPoint.x} ${startInnerPoint.y}
			Z`;
	}

	return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${isLargeArc} 1 ${endPoint.x} ${endPoint.y}`;
};

export const formatLabels = (
	labels: string[],
	formatFn: (l: string) => string,
) => {
	return labels.map((label) => formatFn(label));
};

export const convertToSVGPoint = (
	svgContainer: SVGSVGElement | null = null,
	x = 0,
	y = 0,
) => {
	if (svgContainer) {
		const point: SVGPoint = svgContainer.createSVGPoint();
		point.x = x;
		point.y = y;

		const svgPoint: SVGPoint = point.matrixTransform(
			svgContainer.getScreenCTM()?.inverse(),
		);

		return svgPoint;
	}

	return null;
};

export const polarToCartesian = (
	centerX: number,
	centerY: number,
	radius: number,
	angleInDegrees: number,
) => {
	const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

	return {
		x: centerX + radius * Math.cos(angleInRadians),
		y: centerY + radius * Math.sin(angleInRadians),
	};
};

export const calculateTooltipPosition = (
	svgPoint: { x: number; y: number },
	chartXStart: number,
	chartXEnd: number,
	chartYEnd: number,
	tooltipWidth: number,
	tooltipHeight: number,
) => {
	const tooltipX =
		svgPoint.x < (chartXEnd - chartXStart) / 2
			? svgPoint.x + 50
			: svgPoint.x - tooltipWidth - 50;

	const tooltipY =
		svgPoint.y < (chartYEnd - 10) / 2
			? svgPoint.y + 10
			: svgPoint.y - 20 - tooltipHeight / 2;

	return { x: tooltipX < 0 ? 0 : tooltipX, y: tooltipY };
};
