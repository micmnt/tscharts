import type { TimeSerie } from "../../types";

export const SerieValueLabels = ({
	points,
	serie,
	fontSize,
	color,
	keyPrefix,
}: {
	points: [x: number, y: number][];
	serie: TimeSerie | undefined;
	fontSize: number;
	color: string;
	keyPrefix: string;
}) =>
	points.map((point, dataPointIndex) =>
		point[0] > -1 ? (
			<text
				key={`${keyPrefix}-${dataPointIndex}`}
				textAnchor="middle"
				fontSize={fontSize}
				fontWeight="bold"
				fill={color}
				x={point[0]}
				y={Number.isNaN(point[1]) ? 0 : point[1]}
			>
				{serie?.format
					? serie.format(serie?.data?.[dataPointIndex]?.value)
					: serie?.data?.[dataPointIndex]?.value}
			</text>
		) : null,
	);
