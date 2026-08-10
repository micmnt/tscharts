/* Types Imports */

/* React Imports */
import { useMemo } from "react";
/* Hooks Imports */
import { useDeprecatedConfigWarning } from "../../hooks/useDeprecatedConfig";
import { useSerie } from "../../hooks/useSerie";
/* Core Imports */
import {
	generateGroupDataPaths,
	generateStackedGroupDataPaths,
} from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import { isTimeSerie } from "../../lib/utils";
import { SerieValueLabels } from "../shared/SerieValueLabels";

export type GroupBarProps = {
	name: string;
	stacked?: boolean;
	showLabels?: boolean;
	topLabelSerie?: string;
	// Props piatte (v1.0): sostituiscono il vecchio oggetto `config`.
	radius?: number;
	topLeftRadius?: number;
	topRightRadius?: number;
	bottomRightRadius?: number;
	bottomLeftRadius?: number;
	labelSize?: number;
	labelColor?: string;
	topLabelSize?: number;
	topLabelColor?: string;
	/**
	 * @deprecated Usa le props piatte di <GroupBar> (radius, labelSize, ...).
	 * barWidth/barGroupGap vanno su <Chart> (M1). Rimozione nella 2.0.
	 */
	config?: {
		radius?: number;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
		barWidth?: number;
		barGroupGap?: number;
		labelSize?: number;
		topLabelSize?: number;
		labelColor?: string;
		topLabelColor?: string;
	};
};

// Chiavi "bar-local" del config deprecato (per l'avviso M4). Escluse
// barWidth/barGroupGap (M1 -> Chart), che avvisano in computeGlobalConfig.
const GROUP_BAR_LOCAL_CONFIG_KEYS = [
	"radius",
	"topLeftRadius",
	"topRightRadius",
	"bottomRightRadius",
	"bottomLeftRadius",
	"labelSize",
	"labelColor",
	"topLabelSize",
	"topLabelColor",
] as const;

const GroupBar = (props: GroupBarProps) => {
	const {
		config,
		name,
		showLabels = false,
		topLabelSerie = "",
		stacked = false,
	} = props;

	const {
		ctx,
		theme,
		serie: serieElement,
	} = useSerie(name, isTimeSerie, {
		component: "GroupBar",
		serieTypeLabel: "bar/line/bar-stacked/group-bar",
	});

	const { padding = defaultTheme.padding } = theme ?? {};

	// v1.0: props piatte con fallback al `config` deprecato (la prop piatta vince).
	useDeprecatedConfigWarning(
		config,
		GROUP_BAR_LOCAL_CONFIG_KEYS,
		"GroupBar",
		"radius, labelSize, labelColor, topLabelSize, topLabelColor",
	);

	const radius = props.radius ?? config?.radius ?? 0;
	const topLeftRadius = props.topLeftRadius ?? config?.topLeftRadius ?? 0;
	const topRightRadius = props.topRightRadius ?? config?.topRightRadius ?? 0;
	const bottomRightRadius =
		props.bottomRightRadius ?? config?.bottomRightRadius ?? 0;
	const bottomLeftRadius =
		props.bottomLeftRadius ?? config?.bottomLeftRadius ?? 0;
	const labelSize = props.labelSize ?? config?.labelSize ?? 12;
	const topLabelSize = props.topLabelSize ?? config?.topLabelSize ?? 12;
	const labelColor = props.labelColor ?? config?.labelColor ?? "white";
	const topLabelColor = props.topLabelColor ?? config?.topLabelColor ?? "black";

	// barWidth/barGroupGap sono config di layout condivisa: dalla v1.0 arrivano
	// da <Chart> attraverso globalConfig (M1), non piu' dal config della serie
	// (che resta accettato ma deprecato: computeGlobalConfig lo inoltra qui).
	const barWidth = ctx?.globalConfig?.barWidth ?? padding;
	const barGroupGap = ctx?.globalConfig?.barGroupGap ?? padding / 4;

	const elements = ctx?.elements;

	const foundTopLabelSerieElement = elements?.find(
		(el) => el.name === topLabelSerie,
	);
	const topLabelSerieElement =
		foundTopLabelSerieElement && isTimeSerie(foundTopLabelSerieElement)
			? foundTopLabelSerieElement
			: undefined;

	// ctx (ChartStructuralContext) e' ora una reference stabile tra un
	// mousemove e l'altro (vedi C2): dipendere dall'intero ctx invece che dai
	// singoli campi e' sicuro e piu' semplice da mantenere corretto.
	const result = useMemo(() => {
		if (!ctx || !theme || !serieElement) return null;

		const pathsConfig = {
			...ctx,
			padding,
			barWidth,
			barGroupGap,
			radius,
			topLeftRadius,
			topRightRadius,
			bottomLeftRadius,
			bottomRightRadius,
		};

		return stacked
			? generateStackedGroupDataPaths(serieElement, pathsConfig)
			: generateGroupDataPaths(serieElement, pathsConfig);
	}, [
		ctx,
		theme,
		serieElement,
		padding,
		barWidth,
		barGroupGap,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomLeftRadius,
		bottomRightRadius,
		stacked,
	]);

	if (!ctx || !theme || !elements || !serieElement) return null;

	if (!result) return null;

	const { paths, dataPoints, topLabelsPoints } = result;

	const serieIndex = elements.findIndex((el) => el.name === serieElement.name);

	const serieColor =
		serieElement.color ??
		theme.seriesColors?.[serieIndex ?? 0] ??
		theme.seriesColors?.[0];

	const barPoints = dataPoints?.get(serieElement.name) ?? [];
	const labelsPoints = topLabelsPoints?.get(serieElement.name) ?? [];

	if (!paths) return null;

	return (
		<>
			{paths
				.filter((p) => p !== null && p !== undefined && !p.includes("NaN"))
				.map((p, pathIndex) => (
					<path
						key={`${serieElement.name}-bar-${pathIndex}`}
						d={p}
						fill={serieColor}
					/>
				))}
			{topLabelSerie && (
				<SerieValueLabels
					points={labelsPoints}
					serie={topLabelSerieElement}
					fontSize={topLabelSize}
					color={topLabelColor}
					keyPrefix={`${serieElement.name}-top-label`}
				/>
			)}
			{showLabels && (
				<SerieValueLabels
					points={barPoints}
					serie={serieElement}
					fontSize={labelSize}
					color={labelColor}
					keyPrefix={`${serieElement.name}-label`}
				/>
			)}
		</>
	);
};

export default GroupBar;
