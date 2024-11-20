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

export const getFirstValorizedElementIndex = (
  arr: {
    date: string;
    value: number | null;
  }[],
) => {
  return arr.findIndex((el: { date: string; value: number | null }) =>
    isDefined(el.value),
  );
};

export const trimZerosAndNullLinePath = (paths: string[]) => {
  const validPaths = [];
  // variabile che indica se sono in una sequenza di elementi vuoti
  let inEmptySequence = false;
  for (const pathIndex in paths) {
    if (paths[pathIndex] === "") {
      // Se non sono in una sequenza di elementi vuoti e l'elemento è vuoto inserisco un placeholder e inizio la sequenza di elementi vuoti
      if (!inEmptySequence) {
        validPaths.push("*");
        inEmptySequence = true;
      }
    } else {
      // Se l'elemento non è nullo ma l'ultimo elemento dei path validi è un placeholder di una sequenza di elementi vuoti
      if (validPaths.slice(-1)?.[0] === "*") {
        // rimuovo il placeholder
        validPaths.pop();
        // creo un path con il comando di move con le stesse coordinate del comando di line e lo inserisco nella stessa posizione del placeholder
        const movePath = paths[pathIndex]?.replace("L", "M");
        validPaths.push(movePath);
      } else {
        validPaths.push(paths[pathIndex]);
      }
      inEmptySequence = false;
    }
  }

  return validPaths;
};
