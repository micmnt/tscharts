import React, { type FC } from "react";
import Chart from "../../chart/chart";
import Donut from "../donut";

// Molti segmenti, con un blocco di fette piccole adiacenti ("Centro *"): le loro
// bisettrici sono vicine, quindi senza anti-collisione le label esterne si
// sovrapporrebbero. La v2 le distanzia verticalmente sullo stesso lato.
const rows = [
	{ name: "Nord", value: 26 },
	{ name: "Centro A", value: 5 },
	{ name: "Centro B", value: 4 },
	{ name: "Centro C", value: 5 },
	{ name: "Centro D", value: 4 },
	{ name: "Sud", value: 24 },
	{ name: "Isole", value: 12 },
	{ name: "Estero A", value: 10 },
	{ name: "Estero B", value: 10 },
];

const series = [
	{
		name: "vendite per area",
		type: "donut",
		data: rows,
		labels: rows.map((row) => ({ name: row.name, value: row.name })),
	},
];

const OutsideCollisionExample: FC = () => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart
				width={700}
				height={360}
				elements={series}
				theme={{
					seriesColors: [
						"#3376bd",
						"#7aa9dd",
						"#9bbde6",
						"#b9d0ee",
						"#d3e2f5",
						"#edae49",
						"#e8825a",
						"#e63946",
						"#0079bc",
					],
				}}
			>
				<Donut
					name="vendite per area"
					config={{
						innerRadius: 44,
						gap: 2,
						sliceRadius: 4,
						labelPosition: "outside",
					}}
				/>
			</Chart>
		</div>
	);
};

export default OutsideCollisionExample;
