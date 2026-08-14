import React, { type FC } from "react";
import Chart from "../../chart/chart";
import Donut from "../donut";

// Props della storia: solo la CONFIGURAZIONE del donut (i controlli in Storybook).
// I valori dei segmenti e i testi del centro sono fissi (dati per scontati).
export type KpiExampleProps = {
	innerRadius: number;
	gap: number;
	sliceRadius: number;
};

const rows = [
	{ name: "Stabilimento", value: 120 },
	{ name: "Prosumer Ancona", value: 90 },
	{ name: "Station 5 Ancona", value: 70 },
	{ name: "Import", value: 50 },
];

const series = [
	{
		name: "ricavi per segmento",
		type: "donut",
		data: rows,
		// In modalita' "outside" le label sono fuori dall'anello con leader line:
		// mostriamo il nome della categoria (come nel mockup).
		labels: rows.map((row) => ({ name: row.name, value: row.name })),
	},
];

// Riproduzione del mockup "donut KPI". Attivi: gap (#3), angoli arrotondati
// (sliceRadius), badge trend al centro (#2) e label esterne con leader line (#1).
// Il <Chart> e' piu' largo dell'altezza per lasciare spazio alle label esterne.
const KpiExample: FC<Partial<KpiExampleProps>> = ({
	innerRadius = 46,
	gap = 3,
	sliceRadius = 6,
}) => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={640} height={300} elements={series}>
				<Donut
					name="ricavi per segmento"
					config={{
						innerRadius,
						gap,
						sliceRadius,
						labelPosition: "outside",
						centerElement: {
							value: "330,00 €",
							valueColor: "#1f2430",
							valueSize: 30,
							label: "Mese prec. 180,00 €",
							labelColor: "#6b7280",
							labelSize: 13,
							badge: { text: "83,33%", trend: "up" },
						},
					}}
				/>
			</Chart>
		</div>
	);
};

export default KpiExample;
