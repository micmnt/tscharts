export const isDefined = (value: number | undefined | null) =>
  value !== null && value !== undefined;

export const calculateFlatValue = (value: number) => {
  if (value === 0) return 0;
  const orderOfMagnitude = Math.floor(Math.log10(Math.abs(value)));

  if (orderOfMagnitude < 2) {
    const flatValue = Math.ceil(value / 10) * 10;
    return flatValue;
  }

  const multiplier = Math.pow(10, orderOfMagnitude);

  return Math.ceil(value / multiplier) * multiplier;
};

export const normalizeBarRadius = (
  radius: number | undefined,
  dimension: number,
) => {
  if (!radius) return 0;

  if (dimension < radius / 2) return radius / 2;

  return radius;
};
