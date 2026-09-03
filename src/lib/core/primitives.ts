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

const roundedRingSectorPath = (
	centerX: number,
	centerY: number,
	radius: number,
	innerRadius: number,
	startAngle: number,
	endAngle: number,
	cornerRadius: number,
): string | null => {
	const span = endAngle - startAngle;
	if (span <= 0 || innerRadius <= 0) return null;

	const DEG = 180 / Math.PI;
	const k = Math.min(
		cornerRadius,
		(radius - innerRadius) / 2,
		((span / 2) * radius) / DEG,
		((span / 2) * innerRadius) / DEG,
	);
	if (k <= 0) return null;

	const outerOffset = (k / radius) * DEG;
	const innerOffset = (k / innerRadius) * DEG;
	const p = (r: number, a: number) => polarToCartesian(centerX, centerY, r, a);

	const a = p(radius - k, startAngle);
	const b = p(radius, startAngle + outerOffset);
	const c = p(radius, endAngle - outerOffset);
	const d = p(radius - k, endAngle);
	const e = p(innerRadius + k, endAngle);
	const f = p(innerRadius, endAngle - innerOffset);
	const g = p(innerRadius, startAngle + innerOffset);
	const h = p(innerRadius + k, startAngle);
	const cOS = p(radius, startAngle);
	const cOE = p(radius, endAngle);
	const cIE = p(innerRadius, endAngle);
	const cIS = p(innerRadius, startAngle);
	const largeOuter =
		endAngle - outerOffset - (startAngle + outerOffset) <= 180 ? 0 : 1;
	const largeInner =
		endAngle - innerOffset - (startAngle + innerOffset) <= 180 ? 0 : 1;

	return `M ${a.x} ${a.y} Q ${cOS.x} ${cOS.y} ${b.x} ${b.y} A ${radius} ${radius} 0 ${largeOuter} 1 ${c.x} ${c.y} Q ${cOE.x} ${cOE.y} ${d.x} ${d.y} L ${e.x} ${e.y} Q ${cIE.x} ${cIE.y} ${f.x} ${f.y} A ${innerRadius} ${innerRadius} 0 ${largeInner} 0 ${g.x} ${g.y} Q ${cIS.x} ${cIS.y} ${h.x} ${h.y} Z`;
};

export const generateDonutSlice = (
	centerX: number,
	centerY: number,
	radius: number,
	innerRadius: number,
	startAngle: number,
	endAngle: number,
	cornerRadius = 0,
) => {
	const arc = generateArcBarPath(
		centerX,
		centerY,
		radius,
		innerRadius,
		startAngle,
		endAngle,
		cornerRadius,
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
	cornerRadius = 0,
) => {
	const startPoint = polarToCartesian(centerX, centerY, radius, startAngle);
	const endPoint = polarToCartesian(centerX, centerY, radius, endAngle);

	const isLargeArc = endAngle - startAngle <= 180 ? 0 : 1;

	if (innerRadius) {
		if (cornerRadius > 0) {
			const rounded = roundedRingSectorPath(
				centerX,
				centerY,
				radius,
				innerRadius,
				startAngle,
				endAngle,
				cornerRadius,
			);
			if (rounded) return rounded;
		}

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

const clampToBounds = (value: number, max: number) =>
	max <= 0 ? 0 : Math.min(Math.max(value, 0), max);

export const calculateTooltipPosition = ({
	pointer,
	tooltip,
	bounds,
	gap = 16,
}: {
	pointer: { x: number; y: number };
	tooltip: { width: number; height: number };
	bounds: { width: number; height: number };
	gap?: number;
}) => {
	const after = { x: pointer.x + gap, y: pointer.y + gap };
	const before = {
		x: pointer.x - gap - tooltip.width,
		y: pointer.y - gap - tooltip.height,
	};

	const fitsAfterX = after.x + tooltip.width <= bounds.width;
	const fitsBeforeX = before.x >= 0;
	const fitsAfterY = after.y + tooltip.height <= bounds.height;
	const fitsBeforeY = before.y >= 0;

	return {
		x: clampToBounds(
			fitsAfterX || !fitsBeforeX ? after.x : before.x,
			bounds.width - tooltip.width,
		),
		y: clampToBounds(
			fitsAfterY || !fitsBeforeY ? after.y : before.y,
			bounds.height - tooltip.height,
		),
	};
};
