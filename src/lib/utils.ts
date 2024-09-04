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

export const trimZerosLinePath = (paths: string[]) => {
  return paths
    .join(",")
    .split(",,")
    .map((el, index) => {
      if (index === 0) return el;
      const arrayEl = el.split(",");
      if (arrayEl.length > 0) {
        // Convertire il valore da L a M
        const trimPath = arrayEl[0];
        const convertedTrimPath = trimPath.replace("L", "M");
        arrayEl.splice(0, 1, convertedTrimPath);
      }
      const newEl = arrayEl.join(",");
      return newEl;
    })
    .filter((el) => el !== "")
    .flat();
};
