import { Fragment } from "react";

/* Type Imports */
import { TimeSerieEl } from "../../types";

/* Core Imports */
import { generateXAxis, generateYAxis } from "../../lib/core";

/* Context Imports */
import {
  useCharts,
  useChartsDispatch,
  useChartsTheme,
} from "../../contexts/chartContext";

export type AxisProps = {
  type: "xAxis" | "yAxis";
  name?: string;
  dataPoints?: string[];
  labelSize?: number;
  titleSize?: number;
  showGrid?: boolean;
  showLine?: boolean;
  showName?: boolean;
};

const Axis = (props: AxisProps) => {
  const {
    type,
    name,
    dataPoints = [],
    showGrid = false,
    labelSize = undefined,
    titleSize = undefined,
    showName = false,
    showLine = false,
  } = props;

  const ctx = useCharts();

  const dispatch = useChartsDispatch();

  const theme = useChartsTheme();

  if (!ctx || !theme) return null;

  const { padding, yInterval } = theme;

  const {
    chartXEnd,
    chartXStart,
    chartYEnd,
    elements,
    hoveredElement,
    chartID,
    globalConfig,
  } = ctx;

  const tooltipElement = document?.getElementById(`cts-tooltip-${chartID}`);

  const labelFontSize = labelSize ?? theme?.axis?.labelSize;

  // Creazione dell'asse X
  if (type === "xAxis") {
    const xAxis = generateXAxis(ctx);

    const serie = elements?.[0] || { data: [] };

    const serieData = serie.data as TimeSerieEl[];

    const xAxisInterval =
      (chartXEnd! - chartXStart!) / (serieData?.length || 1);

    const labels = dataPoints.map((label, labelIndex) => {
      const xSpacing = globalConfig?.barWidth
        ? (Number(globalConfig?.barWidth) + padding) / 2
        : padding;

      return {
        value: label,
        x: xAxisInterval * labelIndex + chartXStart! + xSpacing,
        y: chartYEnd! + padding,
      };
    });

    const xPoints = labels.map((label, labelIndex) => {
      const hoverRectX = label.x - (xAxisInterval - padding) / 2;
      const hoverRectWidth = xAxisInterval - padding;

      return (
        <Fragment key={label.value}>
          {dataPoints.length > 20 ? (
            <>
              <defs>
                <path
                  id={`xAxisLabel-${labelIndex}`}
                  d={`M ${label.x - 40} ${label.y + 20} L ${label.x} ${label.y}`}
                />
              </defs>
              <use href={`#xAxisLabel-${labelIndex}`} fill="none" />
              <text
                fontSize={theme?.axis?.labelSize}
                fill={theme?.axis?.labelColor}
              >
                <textPath
                  textAnchor="start"
                  x={label.x}
                  y={label.y}
                  href={`#xAxisLabel-${labelIndex}`}
                >
                  {label.value}
                </textPath>
              </text>
            </>
          ) : (
            <text
              textAnchor="middle"
              x={label.x}
              y={label.y}
              fontSize={labelFontSize}
              fill={theme?.axis?.labelColor}
            >
              {label.value}
            </text>
          )}
          <>
            {showGrid ? (
              <path
                d={`M ${label.x} ${chartYEnd! + (padding * 1) / 3} V 0`}
                strokeWidth={theme?.grid?.size}
                strokeDasharray={theme?.grid?.dashed ? 5 : 0}
                stroke={theme?.grid?.color}
              />
            ) : null}
            {tooltipElement ? (
              <rect
                onMouseEnter={() => {
                  if (dispatch && labelIndex !== hoveredElement?.elementIndex) {
                    dispatch({
                      type: "SET_HOVER_ELEMENT",
                      payload: {
                        hoveredElement: {
                          elementIndex: labelIndex,
                          label: label.value,
                        },
                      },
                    });
                  }
                }}
                x={hoverRectX > 0 ? hoverRectX : 0}
                y={0}
                width={hoverRectWidth > 0 ? hoverRectWidth : 1}
                height={chartYEnd}
                fill="transparent"
              />
            ) : null}
          </>
        </Fragment>
      );
    });

    return (
      <>
        {showLine ? (
          <path
            d={xAxis?.path}
            strokeWidth={theme?.axis?.size}
            stroke={theme?.axis?.color}
          />
        ) : null}
        {xPoints}
        {showName ? (
          <text
            x={chartXEnd! / 2}
            y={chartYEnd! + 45}
            textAnchor="middle"
            fontSize={titleSize ?? theme?.axis?.titleSize}
            fill={theme?.axis?.titleColor}
            fontWeight={600}
          >
            {name}
          </text>
        ) : null}
      </>
    );
  }

  const serieElement = elements?.find((el) => el.name === name);

  if (!serieElement) return null;

  // Creazione dell'asse Y
  const yAxis = generateYAxis(serieElement, { ...ctx, padding, yInterval });

  if (!yAxis) return null;

  return (
    <Fragment>
      {showName ? (
        <>
          <defs>
            <path d={yAxis.nameLabelPath} id={`axis-${yAxis.nameLabelPath}`} />
          </defs>
          <use href={`#axis-${yAxis.nameLabelPath}`} fill="none" />
          <text
            fontSize={titleSize ?? theme?.axis?.titleSize}
            fill={theme?.axis?.titleColor}
            fontWeight={600}
          >
            <textPath
              startOffset="50%"
              textAnchor="middle"
              href={`#axis-${yAxis.nameLabelPath}`}
              alignmentBaseline="central"
            >
              {yAxis.uom ? `${yAxis.name} (${yAxis.uom})` : `${yAxis.name}`}
            </textPath>
          </text>
        </>
      ) : null}
      {yAxis.valueLabels.map((label, labelIndex) => (
        <Fragment key={`${yAxis.name}-${label.value}`}>
          <text
            textAnchor={yAxis.isOpposite ? "start" : "end"}
            fontSize={labelFontSize}
            x={label.x}
            y={label.y + (labelFontSize ?? 0) / 2}
            fill={theme?.axis?.labelColor}
          >
            {label.value}
          </text>
          {showGrid && labelIndex > 0 ? (
            <path
              d={`M ${chartXStart! + padding / 4} ${label.y} H ${chartXEnd! - padding / 4}`}
              strokeWidth={theme?.grid?.size}
              strokeDasharray={theme?.grid?.dashed ? 5 : 0}
              stroke={theme?.grid?.color}
            />
          ) : null}
        </Fragment>
      ))}
      {showLine ? (
        <path
          d={yAxis.path}
          strokeWidth={theme?.axis?.size}
          stroke={theme?.axis?.color}
        />
      ) : null}
    </Fragment>
  );
};

export default Axis;
