import type { TimeSerie } from "../../types";

// Etichette di valore posizionate sui punti dati, condivise da Bar e GroupBar
// (R16): stesso blocco <text> usato sia per le label interne (showLabels) sia
// per quelle sopra le barre (topLabelSerie), che prima erano duplicati quasi
// identici in entrambi i componenti. I punti con x === -1 sono "nascosti"
// (barra troppo bassa per contenere la label) e vengono saltati.
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
