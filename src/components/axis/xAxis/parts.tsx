import type { ThemeState } from "../../../types";

export const AxisLine = ({
	d,
	theme,
	lineColor,
}: {
	d?: string;
	theme?: ThemeState;
	lineColor?: string;
}) => (
	<path
		d={d}
		strokeWidth={theme?.axis?.size}
		stroke={lineColor ?? theme?.axis?.color}
	/>
);

export const GridLine = ({
	d,
	theme,
	gridColor,
}: {
	d: string;
	theme?: ThemeState;
	gridColor?: string;
}) => (
	<path
		d={d}
		strokeWidth={theme?.grid?.size}
		strokeDasharray={theme?.grid?.dashed ? 5 : 0}
		stroke={gridColor ?? theme?.grid?.color}
	/>
);

export const AxisTitle = ({
	x,
	y,
	name,
	titleSize,
	theme,
	transform,
}: {
	x: number;
	y: number;
	name?: string;
	titleSize?: number;
	theme?: ThemeState;
	transform?: string;
}) => (
	<text
		x={x}
		y={y}
		textAnchor="middle"
		fontSize={titleSize ?? theme?.axis?.titleSize}
		fill={theme?.axis?.titleColor}
		fontWeight={600}
		transform={transform}
	>
		{name}
	</text>
);
