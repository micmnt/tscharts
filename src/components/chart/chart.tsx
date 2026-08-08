/* Types Imports */

/* React Imports */
import { useId, useMemo, useRef } from "react";
/* Context Imports */
import { ChartProvider } from "../../contexts/chartContext";

/* Core Imports */
import { flattenChildren } from "../../lib/children";
import {
	getAxisCount,
	getSeriesMissingYAxis,
	getTimeSerieMaxValue,
} from "../../lib/core";
import defaultTheme, { mergeTheme } from "../../lib/defaultTheme";
import { warnDev } from "../../lib/utils";
import type { Serie, ThemeState, TimeSerie } from "../../types";

/* Styles Imports */
import "../../styles.css";

/* Utils Imports */
import Svg from "../../components/svg/svg";
/* Components Imports */
import Bar from "../bar/bar";
import Line from "../line/line";

export type ChartProps = {
	elements: Serie[];
	width: number;
	height: number;
	style?: any;
	children: React.ReactNode;
	name?: string;
	flatMax?: boolean;
	ariaLabel?: string;
	// Override parziale del tema: viene fuso (deep-merge per-chiave) sopra il
	// defaultTheme, quindi si puo' specificare solo cio' che cambia (es. solo
	// `seriesColors` o solo `axis.color`) senza perdere gli altri valori.
	theme?: Partial<ThemeState>;
};

const Chart = (props: ChartProps) => {
	const {
		elements,
		width,
		height,
		children,
		style,
		name = "chart",
		flatMax = true,
		ariaLabel,
		theme,
	} = props;

	// Il tema effettivo passato al provider: default + eventuale override
	// parziale del consumer. Memoizzato per non ricreare la reference (e quindi
	// non far ri-renderizzare tutti i consumer del ThemeContext) ad ogni render.
	const mergedTheme = useMemo(() => mergeTheme(defaultTheme, theme), [theme]);

	const chartContainerRef = useRef<HTMLDivElement>(null);

	// Id univoco e stabile per grafico, sincrono e SSR-safe (useId). Il suffisso
	// `-${name}` e' solo cosmetico (id leggibile nel DOM inspector); l'unicita'
	// tra istanze e' garantita da useId. Finisce negli id DOM tipo
	// `cts-tooltip-${chartID}`, letti solo via getElementById (mai querySelector),
	// quindi i caratteri speciali di useId non danno problemi.
	const reactId = useId();
	const chartID = `${reactId}-${name}`;

	// Appiattisco i children (scende in Fragment e .map) prima di ispezionarli,
	// cosi' assi generati dinamicamente vengono contati correttamente (R6).
	const flatChildren = flattenChildren(children);

	// Assi Y renderizzati (per conteggio e per il controllo R12 sotto).
	const yAxisElements = flatChildren.filter(
		(childEl) => childEl.props?.type === "yAxis",
	);
	const yAxisCount = yAxisElements.length;

	// Avviso in dev (R12): una serie bar/line la cui chiave d'asse
	// (axisName ?? name) non corrisponde a nessun <Axis type="yAxis"> viene
	// disegnata su una scala isolata non mostrata da alcun asse -> grafico
	// fuorviante (era il caso della line "obiettivo" a 225 invece di 150).
	const yAxisNames = yAxisElements
		.map((childEl) => childEl.props?.name)
		.filter((name): name is string => Boolean(name));
	for (const serie of getSeriesMissingYAxis(elements, yAxisNames)) {
		warnDev(
			`La serie "${serie.name}" usa l'asse "${serie.axisName ?? serie.name}" che non corrisponde a nessun <Axis type="yAxis" />: verra' disegnata su una scala isolata non mostrata da alcun asse. Aggiungi axisName con il nome di un asse Y esistente.`,
		);
	}

	// Deduco l'orientamento del grafico dai componenti Bar/Line che disegnano
	// dati (non da Axis, la cui prop `horizontal` e' solo di rendering e non
	// determina l'orientamento del grafico). Confronto per riferimento diretto
	// al componente (non per nome stringa) per restare robusti anche sotto
	// minificazione aggressiva nel bundle del consumer. Un Chart e' o
	// orizzontale o verticale nel suo insieme: tutte le serie condividono lo
	// stesso sistema di coordinate, quindi non ha senso mescolare orientamenti.
	const horizontal = flatChildren.some(
		(childEl) =>
			(childEl.type === Bar || childEl.type === Line) &&
			childEl.props?.horizontal === true,
	);

	// Solo "line"/"bar": scope volutamente piu' stretto di isTimeSerie (che
	// includerebbe anche "bar-stacked"/"group-bar"), preservo il comportamento
	// originale invariato.
	const timeSeriesElements = elements.filter(
		(el): el is TimeSerie => el.type === "line" || el.type === "bar",
	);
	const timeSeriesMaxValue = Math.max(
		...timeSeriesElements.map((timeSerie) =>
			getTimeSerieMaxValue(timeSerie.data),
		),
	);

	// Controllo se nelle serie da graficare ci sono elementi con valore negativo
	const negative = timeSeriesElements
		.flatMap((timeSerieEl) => timeSerieEl.data)
		?.some((el) => el.value < 0);

	const { leftAxisCount, rightAxisCount } = getAxisCount(yAxisCount);

	const initialState = useMemo(
		() => ({
			elements,
			chartID: null,
			svgRef: null,
			hoveredElement: null,
			width,
			height,
			negative,
			horizontal,
			chartXStart: 0,
			chartXEnd: 0,
			chartYEnd: 0,
			chartYMiddle: 0,
			flatMax,
			timeSeriesMaxValue,
		}),
		[
			elements,
			height,
			timeSeriesMaxValue,
			width,
			negative,
			horizontal,
			flatMax,
		],
	);

	return (
		<ChartProvider initialState={initialState} theme={mergedTheme}>
			<div ref={chartContainerRef} className="rootContainer">
				<Svg
					style={style}
					containerRef={chartContainerRef}
					leftAxisCount={leftAxisCount}
					rightAxisCount={rightAxisCount}
					chartID={chartID}
					ariaLabel={ariaLabel}
				>
					{children}
				</Svg>
			</div>
		</ChartProvider>
	);
};

export default Chart;
