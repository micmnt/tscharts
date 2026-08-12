import type { FC } from "react";
import XAxis from "../../axis/xAxis";
import Chart from "../../chart/chart";
import Tooltip from "../../tooltip/tooltip";
import Bar from "../bar";

const elements = [
	{
		name: "richieste",
		type: "bar",
		uom: "n",
		data: [
			{ date: "Nord", value: 120 },
			{ date: "Centro", value: 60 },
			{ date: "Sud", value: 200 },
			{ date: "Isole", value: 40 },
		],
	},
];

const dataPoints = ["Nord", "Centro", "Sud", "Isole"];

const HorizontalExample: FC = () => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={500} height={300} elements={elements}>
				<Bar name="richieste" horizontal />
				<XAxis
					horizontal
					dataPoints={dataPoints}
					showLine
					showLabels
					// Click sulla label dell'asse: riceve (label, index).
					onLabelClick={(label, index) =>
						console.log("[onLabelClick]", label, index)
					}
				/>
				<Tooltip />
			</Chart>
		</div>
	);
};

export default HorizontalExample;
