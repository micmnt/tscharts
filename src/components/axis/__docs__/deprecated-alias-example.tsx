import type { FC } from "react";
import Bar from "../../bar/bar";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Tooltip from "../../tooltip/tooltip";
// Import intenzionale dell'alias DEPRECATO per dimostrarne il funzionamento.
import Axis from "../axis";

const elements = [
	{
		name: "vendite",
		type: "bar",
		uom: "€",
		data: [
			{ date: "13/03", value: 120 },
			{ date: "14/03", value: 180 },
			{ date: "15/03", value: 90 },
			{ date: "16/03", value: 210 },
		],
	},
];

const dataPoints = ["13/03", "14/03", "15/03", "16/03"];

// Demo dell'alias deprecato <Axis type="...">: continua a funzionare (delega a
// <XAxis>/<YAxis>) ma stampa in console un avviso di deprecation (una volta per
// istanza). Verra' rimosso nella 2.0 — la nuova API e' <XAxis>/<YAxis>.
const DeprecatedAliasExample: FC = () => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={480} height={400} elements={elements} barWidth={28}>
				<Axis type="yAxis" name="vendite" showLine showName />
				<Bar name="vendite" />
				<Axis
					type="xAxis"
					name="giorno"
					dataPoints={dataPoints}
					showLine
					showName
				/>
				<Tooltip />
				<Legend legendType="horizontal" height={60} showDots />
			</Chart>
		</div>
	);
};

export default DeprecatedAliasExample;
