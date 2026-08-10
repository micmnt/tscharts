import { useRef } from "react";
/* Utils Imports */
import { warnDev } from "../../lib/utils";
import type { AxisProps } from "./axisProps";
import XAxis from "./xAxis";
import YAxis from "./yAxis";

export type { AxisProps } from "./axisProps";

// Alias deprecato (v1.0): <Axis type="xAxis|yAxis" /> delega a <XAxis>/<YAxis>.
// Verra' rimosso nella 2.0. L'avviso e' emesso una sola volta per istanza (non
// a ogni render) perche' l'asse si ri-renderizza a ogni hover.
const Axis = (props: AxisProps) => {
	const warned = useRef(false);
	if (!warned.current) {
		const target = props.type === "yAxis" ? "YAxis" : "XAxis";
		warnDev(
			`<Axis type="${props.type}" /> e' deprecato: usa <${target} />. Il componente Axis verra' rimosso nella 2.0.`,
		);
		warned.current = true;
	}

	if (props.type === "yAxis") {
		const { type: _type, ...rest } = props;
		return <YAxis {...rest} />;
	}

	const { type: _type, ...rest } = props;
	return <XAxis {...rest} />;
};

export default Axis;
