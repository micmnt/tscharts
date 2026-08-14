import { useMemo } from "react";
import { useSerie } from "../../hooks/useSerie";
import { generateDonutPaths } from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import { isDefined, isPieSerie, warnDev } from "../../lib/utils";
import { OutsideLabels } from "../shared/OutsideLabels";

export type DonutProps = {
	name: string;
	config?: {
		innerRadius?: number;
		gap?: number;
		sliceRadius?: number;
		labelPosition?: "inside" | "outside";
		leaderLine?: { length?: number; color?: string };
		centerElement?: {
			value?: string;
			valueColor?: string;
			valueSize?: number;
			uom?: string;
			uomColor?: string;
			uomSize?: number;
			uomDx?: number;
			label?: string;
			labelColor?: string;
			labelSize?: number;
			labelDy?: number;
			badge?: {
				text: string;
				color?: string;
				background?: string;
				size?: number;
				trend?: "up" | "down";
			};
		};
	};
};

const Donut = (props: DonutProps) => {
	const { name, config } = props;

	const {
		innerRadius,
		gap,
		sliceRadius,
		labelPosition,
		leaderLine,
		centerElement,
	} = config ?? {};

	const { ctx, theme, serie: serieElement } = useSerie(name, isPieSerie);

	const { padding = defaultTheme.padding } = theme ?? {};

	const result = useMemo(() => {
		if (!ctx || !theme || !serieElement) return null;
		return generateDonutPaths(serieElement, {
			...ctx,
			padding,
			innerRadius,
			gap,
			sliceRadius,
			labelPosition,
			leaderLine,
			centerElement,
		});
	}, [
		ctx,
		theme,
		serieElement,
		padding,
		innerRadius,
		gap,
		sliceRadius,
		labelPosition,
		leaderLine,
		centerElement,
	]);

	if (!ctx || !theme) {
		warnDev(
			`<Donut name="${name}" /> deve essere renderizzato dentro <Chart>.`,
		);
		return null;
	}
	if (!serieElement) {
		warnDev(
			`<Donut name="${name}" />: nessuna serie di tipo pie/donut trovata con questo name.`,
		);
		return null;
	}

	if (!result) return null;

	const { paths, dataPoints, outsideLabels, centerPoint } = result;

	const serieLabels = serieElement.labels ?? [];

	const serieData = serieElement.data;

	const slicesColors = serieData.map(
		(el, elIndex) => el.color ?? theme.seriesColors?.[elIndex],
	);

	const slices = paths.map((path, pathIndex) => (
		<path
			d={path}
			fill={slicesColors[pathIndex]}
			key={`${serieElement.name}-slice-${pathIndex}`}
			shapeRendering="geometricPrecision"
		/>
	));

	const leaderColor = leaderLine?.color ?? theme.axis?.labelColor ?? "#4f4f4f";

	const insideLabels = serieLabels.map((label, labelIndex) => (
		<text
			textAnchor="middle"
			fontSize={14}
			fontWeight="bold"
			fill={"white"}
			key={`${label.name}-${labelIndex}`}
			x={dataPoints.get(label.name)?.x}
			y={dataPoints.get(label.name)?.y}
		>
			{label.value}
		</text>
	));

	const labels =
		labelPosition === "outside"
			? [
					<OutsideLabels
						key="outside-labels"
						labels={serieLabels}
						layout={outsideLabels}
						color={leaderColor}
						keyPrefix={serieElement.name}
					/>,
				]
			: insideLabels;

	if (centerPoint && isDefined(centerElement?.value)) {
		const centerTextValue = (
			<text
				key="donut-center-value"
				textAnchor="middle"
				fontSize={centerElement?.valueSize ?? 30}
				fontWeight="bold"
				fill={centerElement?.valueColor ?? "white"}
				x={centerPoint.x}
				y={centerPoint.y}
			>
				{centerElement?.value}
				<tspan
					dx={centerElement?.uomDx ?? 0}
					fontSize={centerElement?.uomSize ?? 30}
					fill={centerElement?.uomColor ?? "white"}
				>
					{centerElement?.uom}
				</tspan>
			</text>
		);
		const centerTextLabel = (
			<text
				key="donut-center-label"
				dy={centerElement?.labelDy ?? 0}
				textAnchor="middle"
				fontSize={centerElement?.labelSize ?? 20}
				fill={centerElement?.labelColor ?? "white"}
				x={centerPoint.x}
				y={centerPoint.y + (centerElement?.valueSize ?? 30) / 2}
			>
				{centerElement?.label}
			</text>
		);

		const badge = centerElement?.badge;
		const trendArrow =
			badge?.trend === "up" ? "↗" : badge?.trend === "down" ? "↘" : "";
		const centerBadge = badge?.text ? (
			<foreignObject
				key="donut-center-badge"
				x={centerPoint.x - 90}
				y={
					centerPoint.y +
					(centerElement?.valueSize ?? 30) / 2 +
					(centerElement?.labelSize ?? 20) +
					4
				}
				width={180}
				height={28}
				style={{ pointerEvents: "none" }}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						height: "100%",
					}}
				>
					<span
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 4,
							padding: "3px 10px",
							borderRadius: 999,
							fontSize: badge.size ?? 12,
							fontWeight: 700,
							lineHeight: 1,
							whiteSpace: "nowrap",
							color: badge.color ?? "#0a7f3f",
							background: badge.background ?? "#d6f5e3",
						}}
					>
						{trendArrow ? <span aria-hidden="true">{trendArrow}</span> : null}
						{badge.text}
					</span>
				</div>
			</foreignObject>
		) : null;

		return [
			...slices,
			centerTextValue,
			centerTextLabel,
			centerBadge,
			...labels,
		];
	}

	return [...slices, ...labels];
};

export default Donut;
