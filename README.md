# tscharts

Libreria di componenti React per costruire grafici componibili (bar, line, pie, donut, angle-donut, group-bar, threshold), con un modello di composizione dichiarativo simile a Recharts. Non usa D3: i path SVG sono generati internamente.

## Installazione

```bash
npm install tscharts
```

`react` e `react-dom` (>=18.2.0) sono peer dependency, non vengono installati automaticamente.

Il pacchetto include un foglio di stile separato, necessario per la Legend e il Tooltip: va importato una volta, ad esempio nell'entry point dell'app.

```ts
import "tscharts/dist/style.css";
```

## Quick start

```tsx
import { Axis, Bar, Chart, Legend } from "tscharts";

const elements = [
  {
    name: "vendite",
    type: "bar",
    uom: "€",
    data: [
      { date: "2024-03-13", value: 120 },
      { date: "2024-03-14", value: 180 },
      { date: "2024-03-15", value: 90 },
      { date: "2024-03-16", value: 210 },
    ],
  },
];

function App() {
  return (
    <Chart width={400} height={400} elements={elements}>
      <Axis type="yAxis" name="vendite" showLine showName />
      <Bar name="vendite" />
      <Axis
        type="xAxis"
        dataPoints={["13/03", "14/03", "15/03", "16/03"]}
        showLine
        showName
      />
      <Legend legendType="horizontal" height={90} />
    </Chart>
  );
}
```

`<Chart>` riceve `elements` (le serie dati) e dimensioni fisse (`width`/`height`); i figli (`Axis`, `Bar`, `Legend`, ...) leggono lo stato condiviso e si occupano ciascuno di una parte del grafico. Ogni serie in `elements` è collegata ai componenti tramite la prop `name`.

Per gli altri tipi di grafico (line, pie, donut, group-bar, threshold, angle-donut) ed esempi più avanzati (barre stacked, drag interattivo, assi multipli), vedi Storybook: https://tscharts.netlify.app

## Riferimento prop

### `<Chart>`

Componente radice: fornisce il contesto condiviso (dimensioni, dati, tema) a tutti i figli.

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `elements` | `Serie[]` | — (richiesta) | Le serie da graficare. Ogni serie ha almeno `name`, `type`, `data` |
| `width` | `number` | — (richiesta) | Larghezza dell'SVG in px |
| `height` | `number` | — (richiesta) | Altezza dell'SVG in px |
| `children` | `ReactNode` | — (richiesta) | I componenti figli del grafico (`Axis`, `Bar`, `Line`, ...) |
| `name` | `string` | `"chart"` | Nome usato per generare l'id univoco del grafico |
| `flatMax` | `boolean` | `true` | Arrotonda il valore massimo degli assi al numero "pulito" più vicino (es. 1234 → 1300) invece di usarlo esatto |
| `style` | `any` | — | Stile CSS applicato all'elemento `<svg>` |

### `<Axis>`

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `type` | `"xAxis" \| "yAxis"` | — (richiesta) | Quale asse disegnare |
| `name` | `string` | — | Per `yAxis`, nome della serie a cui l'asse è associato; per entrambi, titolo mostrato se `showName` |
| `dataPoints` | `string[]` | `[]` | Etichette dell'asse X (una per punto dato) |
| `showGrid` | `boolean` | `false` | Mostra le gridline associate all'asse |
| `showLine` | `boolean` | `false` | Mostra la linea dell'asse |
| `showLabels` | `boolean` | `true` | Mostra le etichette dei valori/categorie |
| `showName` | `boolean` | `false` | Mostra il titolo dell'asse |
| `gridColor` / `lineColor` / `labelColor` | `string` | colori del tema | Override colore di gridline / linea asse / etichette |
| `labelSize` / `titleSize` | `number` | dimensioni del tema | Override dimensione font di etichette / titolo |
| `titleDx` / `titleDy` | `number` | `0` | Offset del titolo dell'asse |
| `tiltLabels` | `boolean` | `true` | Inclina le etichette (utile con molti `dataPoints`) |
| `tiltLabelsAngle` | `number` | `45` | Angolo di inclinazione, se `tiltLabels` |
| `horizontal` | `boolean` | `false` | Adatta l'asse X a un grafico a barre/linee orizzontali |
| `labelXOffset` / `labelYOffset` | `number` | `0` | Offset manuale delle etichette |
| `selectedArea` | `string[]` | — | Coppia `[inizio, fine]` di `dataPoints` da evidenziare come intervallo selezionato (solo `xAxis`) |
| `selectedAreaColor` | `string` | `"red"` | Colore dell'area selezionata |
| `selectedAreaOpacity` | `number` | `0.2` | Opacità dell'area selezionata |

### `<Bar>`

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `name` | `string` | — (richiesta) | Nome della serie in `elements` da disegnare come barre |
| `stacked` | `boolean` | `false` | Impila la barra sulle altre serie `bar-stacked` nello stesso grafico |
| `showLabels` | `boolean` | `false` | Mostra il valore dentro ogni barra |
| `topLabelSerie` | `string` | `""` | Nome di un'altra serie i cui valori vengono mostrati sopra le barre (es. un totale) |
| `horizontal` | `boolean` | `false` | Disegna le barre orizzontalmente invece che in verticale |
| `config.barClickAction` | `(value) => void` | — | Callback al click su una barra, riceve il punto dato |
| `config.barDragAction` | `(payload: BarDragPayload) => void` | — | Abilita il drag verticale sulla barra; `payload` contiene `value`, `previousValue`, `deltaValue`, `index`, `date`, `serieName` |
| `config.dragValueDecimals` | `number` | `2` | Decimali di arrotondamento del valore durante il drag |
| `config.barWidth` | `number` | `padding` del tema | Larghezza della barra in px |
| `config.radius` | `number` | `0` | Raggio di arrotondamento su tutti e 4 gli angoli |
| `config.topLeftRadius` / `topRightRadius` / `bottomRightRadius` / `bottomLeftRadius` | `number` | `0` | Raggio per singolo angolo, sovrascrive `radius` |
| `config.labelSize` / `topLabelSize` | `number` | `12` | Dimensione font delle label interne/superiori |
| `config.labelColor` / `topLabelColor` | `string` | `"white"` / `"black"` | Colore delle label interne/superiori |
| `config.barOffset` | `number` | — | Offset aggiuntivo (solo grafici `horizontal`) |

### `<GroupBar>`

Barre raggruppate (più serie affiancate per ogni punto sull'asse X). Config sostanzialmente identica a `<Bar>`, senza drag/click e senza `horizontal`.

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `name` | `string` | — (richiesta) | Nome della serie in `elements` |
| `stacked` | `boolean` | `false` | Impila questa barra con le altre che condividono lo stesso `stackedName` |
| `showLabels` | `boolean` | `false` | Mostra il valore dentro ogni barra |
| `topLabelSerie` | `string` | `""` | Nome di un'altra serie da mostrare come etichetta sopra le barre |
| `config.radius` | `number` | `0` | Raggio di arrotondamento su tutti e 4 gli angoli |
| `config.topLeftRadius` / `topRightRadius` / `bottomRightRadius` / `bottomLeftRadius` | `number` | `0` | Raggio per singolo angolo |
| `config.barWidth` | `number` | `padding` del tema | Larghezza della barra in px |
| `config.labelSize` / `topLabelSize` | `number` | `12` | Dimensione font delle label |
| `config.labelColor` / `topLabelColor` | `string` | `"white"` / `"black"` | Colore delle label |

### `<Line>`

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `name` | `string` | — (richiesta) | Nome della serie in `elements` da disegnare come linea |
| `hideLine` | `boolean` | `false` | Nasconde il tratto della linea (utile per mostrare solo punti/etichette) |
| `showDots` | `boolean` | `false` | Mostra un pallino su ogni punto dato |
| `showLabels` | `boolean` | `false` | Mostra il valore accanto a ogni punto |
| `higlightLabels` | `boolean` | `false` | Mostra l'etichetta solo sul punto attualmente in hover |
| `dashed` | `boolean` | `false` | Linea tratteggiata |
| `trimZeros` | `boolean` | `false` | Interrompe la linea in corrispondenza di valori `0` (li tratta come assenti) |
| `horizontal` | `boolean` | `false` | Disegna la linea in orientamento orizzontale |
| `labelSize` | `number` | `12` | Dimensione font delle etichette |
| `labelXOffset` / `labelYOffset` | `number` | `0` | Offset manuale delle etichette |
| `lineOffset` | `number` | — | Offset orizzontale (solo grafici `horizontal`) |
| `tiltLabels` | `boolean` | `false` | Inclina le etichette |
| `tiltLabelsAngle` | `number` | `45` | Angolo di inclinazione, se `tiltLabels` |
| `fill` | `string` | — | Colore di riempimento sotto la linea (area chart) |
| `fillOpacity` | `number` | `0` | Opacità del riempimento |

### `<Pie>`

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `name` | `string` | — (richiesta) | Nome della serie `pie` in `elements` da disegnare |

### `<Donut>`

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `name` | `string` | — (richiesta) | Nome della serie in `elements` da disegnare come ciambella |
| `config.innerRadius` | `number` | metà del raggio esterno | Raggio del foro centrale |
| `config.centerElement.value` | `string` | — | Valore mostrato al centro della ciambella |
| `config.centerElement.uom` | `string` | — | Unità di misura accanto al valore centrale |
| `config.centerElement.label` | `string` | — | Etichetta sotto il valore centrale |
| `config.centerElement.valueColor` / `uomColor` / `labelColor` | `string` | `"white"` | Colori dei tre elementi centrali |
| `config.centerElement.valueSize` / `uomSize` | `number` | `30` | Dimensione font di valore e unità di misura |
| `config.centerElement.labelSize` | `number` | `20` | Dimensione font dell'etichetta |
| `config.centerElement.uomDx` | `number` | `0` | Offset orizzontale dell'unità di misura |
| `config.centerElement.labelDy` | `number` | `0` | Offset verticale dell'etichetta |

### `<AngleDonut>`

Ciambella "ad angolo" (arco parziale, es. per indicatori/gauge), con eventuale traccia di sfondo.

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `name` | `string` | — (richiesta) | Nome della serie in `elements` |
| `config.innerRadius` | `number` | metà del raggio esterno | Raggio del foro centrale |
| `config.angle` | `number` | `360` | Angolo totale (gradi) su cui distribuire il valore massimo |
| `config.showTrack` | `boolean` | `false` | Mostra una traccia di sfondo semi-trasparente fino al `maxValue` di ogni elemento |
| `config.customLabel` | `((el: AngleDonutSerieEl) => ReactNode) \| string` | — | Contenuto custom mostrato accanto a ogni spicchio |
| `config.centerElement.*` | — | — | Stesse opzioni di `<Donut>` (`value`, `uom`, `label`, colori, dimensioni, offset) |

### `<Threshold>`

Linea di soglia orizzontale o verticale sovrapposta al grafico.

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `name` | `string` | — (richiesta) | Nome della serie `threshold` in `elements` (il suo `data` è un numero, non un array) |
| `axisName` | `string` | `""` | Nome della serie/asse rispetto a cui calcolare la posizione della soglia |
| `type` | `"vertical" \| "horizontal"` | `"horizontal"` | Orientamento della linea di soglia |
| `dashed` | `boolean` | `false` | Linea tratteggiata |
| `size` | `number` | dimensione del tema | Spessore della linea |
| `showLabel` | `boolean` | `false` | Mostra il valore della soglia come testo |
| `dx` / `dy` | `number` | `0` | Offset dell'etichetta |

### `<Legend>`

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `legendType` | `"horizontal" \| "vertical"` | — (richiesta) | Layout della legenda |
| `showDots` | `boolean` | `true` | Mostra il pallino colorato accanto al nome di ogni serie |
| `height` | `number` | `60` | Altezza riservata alla legenda nell'SVG |
| `hideSeries` | `string[]` | `[]` | Nomi delle serie da escludere dalla legenda |
| `customLabel` | `(el: PieSerieEl \| Serie) => ReactNode` | — | Contenuto custom per ogni voce, al posto del nome semplice |

### `<Tooltip>`

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `title` | `(label: string) => string` | — | Formatta il titolo del tooltip (di default l'etichetta del punto in hover) |
| `reverseOrder` | `boolean` | `false` | Inverte l'ordine delle serie elencate nel tooltip |
| `showGrid` | `boolean` | `false` | Mostra le linee guida (verticale/orizzontale) sul punto in hover |
| `hideSeries` | `string[]` | `[]` | Nomi delle serie da escludere dal tooltip |
| `width` / `height` | `number` | `150` / auto (`160`–`200`) | Dimensioni del riquadro tooltip |
| `footer` | `(series: Serie[], hoveredElementIndex: number) => ReactNode` | — | Contenuto custom in fondo al tooltip, al posto del totale calcolato |
| `cumulatedSeriesValue` | `{ series: string[]; label: string; format?: (value: number) => string }` | — | Se presente, mostra la somma dei valori delle `series` indicate con l'etichetta `label` |
| `customElement` | `(props) => ReactNode` | — | Sostituisce completamente il rendering di riga per ogni serie nel tooltip |
