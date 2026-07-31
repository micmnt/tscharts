import type { FC } from "react";
import Axis from "../../axis/axis";
import Chart from "../../chart/chart";
import Tooltip from "../../tooltip/tooltip";
import Line from "../line";

const elements = [
	{
		name: "richieste",
		type: "line",
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
				<Line name="richieste" horizontal showDots showLabels />
				<Axis
					type="xAxis"
					horizontal
					dataPoints={dataPoints}
					showLine
					showLabels
				/>
				<Tooltip />
			</Chart>
		</div>
	);
};

export default HorizontalExample;
