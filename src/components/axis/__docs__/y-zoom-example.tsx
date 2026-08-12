import { type FC, useState } from "react";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Line from "../../line/line";
import Tooltip from "../../tooltip/tooltip";
import XAxis from "../xAxis";
import YAxis from "../yAxis";

const elements = [
	{
		name: "temperatura",
		type: "line",
		uom: "°C",
		data: [
			{ date: "00", value: 21.4 },
			{ date: "04", value: 20.1 },
			{ date: "08", value: 22.8 },
			{ date: "12", value: 26.3 },
			{ date: "16", value: 27.1 },
			{ date: "20", value: 23.5 },
		],
	},
];

const dataPoints = ["00", "04", "08", "12", "16", "20"];

type YZoomExampleProps = {
	zoomStep?: number;
	zoomSnap?: number;
};

const YZoomExample: FC<YZoomExampleProps> = ({ zoomStep, zoomSnap }) => {
	const [domain, setDomain] = useState<[number, number] | null>(null);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100%",
				gap: 8,
			}}
		>
			<div style={{ fontFamily: "monospace", fontSize: 13 }}>
				{domain
					? `dominio Y: ${domain[0].toFixed(1)} .. ${domain[1].toFixed(1)} — doppio click per reset`
					: "rotella per zoomare sull'asse Y · doppio click per reset"}
			</div>
			<Chart width={560} height={380} elements={elements}>
				<YAxis
					name="temperatura"
					zoomable
					zoomStep={zoomStep}
					zoomSnap={zoomSnap}
					onZoomChange={setDomain}
					showLine
					showGrid
					showName
				/>
				<Line name="temperatura" showDots />
				<XAxis dataPoints={dataPoints} showLine showName name="ora" />
				<Tooltip />
				<Legend legendType="horizontal" height={50} showDots />
			</Chart>
		</div>
	);
};

export default YZoomExample;
