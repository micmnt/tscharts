import type { FC } from "react";
import Axis from "../../axis/axis";
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
				<Axis
					type="xAxis"
					horizontal
					dataPoints={dataPoints}
					showLine
					showLabels
					// Click sulla label di proprieta' dell'asse (M2): riceve (label,
					// index), non piu' via config.barClickAction su Bar.
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
