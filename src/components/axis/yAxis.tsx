import { Fragment } from "react";

import { generateYAxis } from "../../lib/core";

import { isTimeSerie, warnDev } from "../../lib/utils";
import type { YAxisProps } from "./axisProps";
import { useAxisBase } from "./useAxisBase";

export type { YAxisProps } from "./axisProps";

const YAxis = (props: YAxisProps) => {
	const {
		name,
		showGrid = false,
		gridColor = undefined,
		labelSize = undefined,
		labelColor = undefined,
		titleSize = undefined,
		lineColor = undefined,
		showName = false,
		titleDx = 0,
		titleDy = 0,
		showLine = false,
	} = props;

	const { ctx, theme } = useAxisBase();

	if (!ctx || !theme) {
		warnDev(
			`<YAxis name="${name}" /> deve essere renderizzato dentro <Chart>.`,
		);
		return null;
	}

	const { padding, yInterval } = theme;

	const { chartXEnd, chartXStart, elements } = ctx;

	const labelFontSize = labelSize ?? theme?.axis?.labelSize;

	const labelTextColor = labelColor ?? theme.axis?.labelColor;

	const foundSerieElement = elements?.find(
		(el) => el.name === name || el.axisName === name,
	);
	const serieElement =
		foundSerieElement && isTimeSerie(foundSerieElement)
			? foundSerieElement
			: undefined;

	if (!serieElement) {
		warnDev(
			`<YAxis name="${name}" />: nessuna serie di tipo bar/line/bar-stacked/group-bar trovata con questo name.`,
		);
		return null;
	}

	const yAxis = generateYAxis(serieElement, { ...ctx, padding, yInterval });

	if (!yAxis) return null;

	return (
		<Fragment>
			{showName ? (
				<>
					<defs>
						<path d={yAxis.nameLabelPath} id={`axis-${yAxis.nameLabelPath}`} />
					</defs>
					<text
						dy={titleDy}
						dx={titleDx}
						fontSize={titleSize ?? theme?.axis?.titleSize}
						fill={theme?.axis?.titleColor}
						fontWeight={600}
						textAnchor="middle"
						dominantBaseline="middle"
					>
						<textPath startOffset="50%" href={`#axis-${yAxis.nameLabelPath}`}>
							{}
							{yAxis.uom ? `${name} (${yAxis.uom})` : `${name}`}
						</textPath>
					</text>
				</>
			) : null}
			{yAxis.valueLabels.map((label, labelIndex) => (
				<Fragment key={`${yAxis.name}-${label.value}-${labelIndex}`}>
					<text
						textAnchor={yAxis.isOpposite ? "start" : "end"}
						fontSize={labelFontSize}
						x={label.x - 8}
						y={label.y + (labelFontSize ?? 0) / 2}
						fill={labelTextColor}
					>
						{label.value}
					</text>
					{showGrid && labelIndex > -1 ? (
						<path
							d={`M ${chartXStart + padding / 4} ${label.y} H ${chartXEnd - padding / 4}`}
							strokeWidth={theme?.grid?.size}
							strokeDasharray={theme?.grid?.dashed ? 5 : 0}
							stroke={gridColor ?? theme?.grid?.color}
						/>
					) : null}
				</Fragment>
			))}
			{showLine ? (
				<path
					d={yAxis.path}
					strokeWidth={theme?.axis?.size}
					stroke={lineColor ?? theme?.axis?.color}
				/>
			) : null}
		</Fragment>
	);
};

export default YAxis;
