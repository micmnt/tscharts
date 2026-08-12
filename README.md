# tscharts

Libreria di componenti React per costruire grafici componibili (bar, line, pie, donut, angle-donut, group-bar, threshold), con un modello di composizione dichiarativo simile a Recharts. Non usa D3: i path SVG sono generati internamente.

## Installazione

```bash
npm install tscharts
```

`react` e `react-dom` (>=18.2.0) sono peer dependency, non vengono installati automaticamente.

Il pacchetto include un foglio di stile separato, necessario per la Legend e il Tooltip: va importato una volta, ad esempio nell'entry point dell'app.

```ts
import "tscharts/style.css";
```

## Quick start

```tsx
import { Bar, Chart, Legend, XAxis, YAxis } from "tscharts";

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
    <Chart width={400} height={400} elements={elements} barWidth={28}>
      <YAxis name="vendite" showLine showName />
      <Bar name="vendite" />
      <XAxis
        dataPoints={["13/03", "14/03", "15/03", "16/03"]}
        showLine
        showName
      />
      <Legend height={90} />
    </Chart>
  );
}
```

`<Chart>` riceve `elements` (le serie dati) e dimensioni fisse (`width`/`height`); i figli (`XAxis`, `YAxis`, `Bar`, `Legend`, ...) leggono lo stato condiviso e si occupano ciascuno di una parte del grafico. Ogni serie in `elements` è collegata ai componenti tramite la prop `name`.

Per gli altri tipi di grafico (line, pie, donut, group-bar, threshold, angle-donut) ed esempi più avanzati (barre stacked, drag interattivo, assi multipli), vedi Storybook: https://tscharts.netlify.app

## Riferimento prop

### `<Chart>`

Componente radice: fornisce il contesto condiviso (dimensioni, dati, tema) a tutti i figli.

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `elements` | `Serie[]` | — (richiesta) | Le serie da graficare. Ogni serie ha almeno `name`, `type`, `data` |
| `width` | `number` | — (richiesta) | Larghezza dell'SVG in px |
| `height` | `number` | — (richiesta) | Altezza dell'SVG in px |
| `children` | `ReactNode` | — (richiesta) | I componenti figli del grafico (`XAxis`, `YAxis`, `Bar`, `Line`, ...) |
| `name` | `string` | `"chart"` | Nome usato per generare l'id univoco del grafico |
| `flatMax` | `boolean` | `true` | Arrotonda per eccesso il valore massimo degli assi all'ordine di grandezza superiore (es. 1234 → 2000) invece di usarlo esatto |
| `barWidth` | `number` | `padding` del tema | Larghezza delle barre in px, condivisa da tutte le serie bar/group-bar |
| `barGroupGap` | `number` | `padding / 4` | Spazio tra le barre di uno stesso gruppo (group-bar) |
| `barOffset` | `number` | — | Offset orizzontale delle barre (usato dai grafici a barre orizzontali) |
| `style` | `CSSProperties` | — | Stile CSS applicato all'elemento `<svg>` |
| `theme` | `Partial<ThemeState>` | `defaultTheme` | Override parziale del tema (colori serie, padding, font, assi, griglia...). Vedi [Tema](#tema) |
| `renderer` | `"svg" \| "canvas"` | `"svg"` | Motore di rendering delle marche dense (`Line`/dot, `Bar`). `"canvas"` le disegna su un unico `<canvas>` per reggere dataset grandi. Vedi [Rendering su canvas](#rendering-su-canvas) |

#### Tema

`theme` accetta un **override parziale**: viene fuso (deep-merge per-chiave) sopra il tema di default, quindi basta specificare solo ciò che cambia — tutto il resto resta invariato.

```tsx
// Solo i colori delle serie: padding, assi, griglia, font... restano dal default
<Chart width={600} height={400} elements={elements}
  theme={{ seriesColors: ["#6366f1", "#ec4899", "#14b8a6"] }}
>
  ...
</Chart>

// Override annidato parziale: cambia solo il colore della linea asse,
// gli altri campi di `axis` (labelColor, size...) restano dal default
<Chart ... theme={{ axis: { color: "#e63946" } }}>...</Chart>
```

Il tema di default è esportato come **riferimento in sola lettura** (`defaultTheme`), utile per leggerne/derivarne i valori — ad esempio per usare gli stessi colori serie altrove nella tua UI. Non serve per l'override (che si fa con la prop `theme` parziale) ed è congelato: non è mutabile.

```tsx
import { defaultTheme, type ThemeState } from "tscharts";

// riuso di un colore del grafico nel resto dell'interfaccia
<span style={{ color: defaultTheme.seriesColors[0] }}>Vendite</span>

// tema derivato costruito programmaticamente
const darkChartTheme: Partial<ThemeState> = {
  grid: { ...defaultTheme.grid, color: "#2a3540" },
  axis: { ...defaultTheme.axis, labelColor: "#8fa0b0" },
};
```

### `<YAxis>`

Asse dei valori. La prop `name` collega l'asse alla serie (o al gruppo, via `axisName`).

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `name` | `string` | — | Nome della serie/asse a cui è associato; anche titolo se `showName` |
| `showGrid` | `boolean` | `false` | Mostra le gridline orizzontali |
| `showLine` | `boolean` | `false` | Mostra la linea dell'asse |
| `showName` | `boolean` | `false` | Mostra il titolo dell'asse |
| `gridColor` / `lineColor` / `labelColor` | `string` | colori del tema | Override colore di gridline / linea asse / etichette |
| `labelSize` / `titleSize` | `number` | dimensioni del tema | Override dimensione font di etichette / titolo |
| `titleDx` / `titleDy` | `number` | `0` | Offset del titolo dell'asse |
| `min` / `max` | `number` | `0` / max dei dati | Dominio controllabile: sovrascrive l'intervallo auto-calcolato. Vedi [Dominio Y](#dominio-y) |
| `zoomable` | `boolean` | `false` | Abilita lo zoom con la rotella del mouse sull'asse Y (doppio click per resettare) |
| `onZoomChange` | `(domain: [number, number] \| null) => void` | — | Notifica il dominio Y corrente durante lo zoom (`null` al reset) |
| `zoomStep` | `number` | `1.15` | Quanto zooma ogni tacca di rotella (fattore; più alto = più aggressivo) |
| `zoomSnap` | `number` | — | Se `>0`, arrotonda gli estremi del dominio zoomato al multiplo indicato (es. `1` = interi) |

#### Dominio Y

Di default l'asse Y va da `0` al massimo dei dati (arrotondato per eccesso se
`flatMax`). Con `min`/`max` su `<YAxis>` si controlla l'intervallo — utile per
"entrare" in una banda stretta di valori (es. una saturazione che oscilla tra 98
e 102) dove il dominio automatico schiaccerebbe la linea in cima.

```tsx
<YAxis name="saturazione" min={98} max={102} showLine showGrid />
```

Note:
- Con `max` esplicito il `flatMax` viene **ignorato** (il valore dato è autoritativo).
- I valori fuori `[min, max]` sono **clampati** ai bordi.
- Scope attuale: grafici verticali non-negativi, con un singolo asse Y
  (bar/line). Non si applica a grafici negativi/orizzontali né agli assi
  multipli.

**Zoom interattivo.** Con `zoomable` l'utente zooma il dominio Y con la **rotella**
del mouse (attorno al cursore); il **doppio click** resetta. Il dominio è limitato
a quello base (nessun pan nel vuoto) e ha uno zoom massimo. `onZoomChange` riceve
il dominio corrente ad ogni variazione (`null` al reset).

```tsx
<YAxis name="temperatura" zoomable onZoomChange={(d) => console.log(d)} />
```

### `<XAxis>`

Asse delle categorie. Ospita anche selezione e click sulle label.

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `dataPoints` | `string[]` | `[]` | Etichette dell'asse X (una per punto dato) |
| `name` | `string` | — | Titolo dell'asse, mostrato se `showName` |
| `showGrid` | `boolean` | `false` | Mostra le gridline verticali |
| `showLine` | `boolean` | `false` | Mostra la linea dell'asse |
| `showLabels` | `boolean` | `true` | Mostra le etichette delle categorie |
| `showName` | `boolean` | `false` | Mostra il titolo dell'asse |
| `gridColor` / `lineColor` / `labelColor` | `string` | colori del tema | Override colore di gridline / linea asse / etichette |
| `labelSize` / `titleSize` | `number` | dimensioni del tema | Override dimensione font di etichette / titolo |
| `titleDx` / `titleDy` | `number` | `0` | Offset del titolo dell'asse |
| `tiltLabels` | `boolean` | `true` | Inclina le etichette (utile con molti `dataPoints`) |
| `tiltLabelsAngle` | `number` | `45` | Angolo di inclinazione, se `tiltLabels` |
| `horizontal` | `boolean` | `false` | Adatta l'asse a un grafico a barre/linee orizzontali |
| `labelXOffset` / `labelYOffset` | `number` | `0` | Offset manuale delle etichette |
| `selectedValue` | `string` | — | Categoria (`dataPoint`) da evidenziare |
| `selectedColor` | `string` | — | Colore dell'evidenza di `selectedValue` |
| `onLabelClick` | `(label: string, index: number) => void` | — | Callback al click su una label |
| `selectedArea` | `string[]` | — | Coppia `[inizio, fine]` di `dataPoints` da evidenziare come intervallo |
| `selectedAreaColor` | `string` | `"red"` | Colore dell'area selezionata |
| `selectedAreaOpacity` | `number` | `0.2` | Opacità dell'area selezionata |
| `scaleType` | `"band" \| "time"` | `"band"` | `"time"` posiziona i punti delle serie **line** proporzionalmente alla data (non all'indice). Vedi [Asse temporale](#asse-temporale) |
| `parseDate` | `(date: string) => number \| Date` | `new Date(d).getTime()` | Converte la stringa `date` in istante. Serve quando `date` non è ISO 8601 (es. `"13/03"`). Solo con `scaleType="time"` |
| `ticks` | `"data" \| number` | `"data"` | `"data"` = un tick per punto dato alla sua posizione temporale; un numero = N tick equispaziati nel dominio. Solo con `scaleType="time"` |
| `tickFormat` | `(time: number) => string` | data grezza / `toLocaleDateString` | Formatta l'etichetta di un tick temporale |

#### Asse temporale

Di default l'asse X è **categorico** (`band`): i punti sono equidistanti, uno
per indice, e il campo `date` è solo un'etichetta. Con `scaleType="time"` l'asse
diventa **quantitativo**: i punti delle serie `line` si distribuiscono in modo
proporzionale al tempo, quindi un campionamento irregolare viene mostrato
fedelmente (due misure ravvicinate restano vicine, un buco grande è largo).

```tsx
const parseDate = (d: string) => new Date(d).getTime();

<Chart width={560} height={400} elements={elements}>
  <YAxis name="vendite" showLine showName />
  <Line name="vendite" showDots />
  <XAxis scaleType="time" parseDate={parseDate} ticks="data" showLine />
  <Tooltip />
</Chart>
```

Note:
- Agisce **solo sulle serie `line`**; le barre restano categoriche.
- Il dominio `[min, max]` è calcolato dalle date delle serie line via `parseDate`
  (default `new Date(d).getTime()`; passa un `parseDate` custom per formati non
  ISO come `"13/03"`).
- L'hover aggancia il **punto dato più vicino nel tempo**.
- `ticks="data"` mostra un tick per punto; `ticks={N}` mostra N tick equispaziati
  nel dominio, etichettati con `tickFormat`.

### `<Bar>`

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `name` | `string` | — (richiesta) | Nome della serie in `elements` da disegnare come barre |
| `stacked` | `boolean` | `false` | Impila la barra sulle altre serie `bar-stacked` nello stesso grafico |
| `showLabels` | `boolean` | `false` | Mostra il valore dentro ogni barra |
| `topLabelSerie` | `string` | `""` | Nome di un'altra serie i cui valori vengono mostrati sopra le barre (es. un totale) |
| `horizontal` | `boolean` | `false` | Disegna le barre orizzontalmente invece che in verticale |
| `onBarClick` | `(value) => void` | — | Callback al click su una barra, riceve il punto dato |
| `onBarDrag` | `(payload: BarDragPayload) => void` | — | Abilita il drag verticale sulla barra; `payload` contiene `value`, `previousValue`, `deltaValue`, `index`, `date`, `serieName` |
| `dragValueDecimals` | `number` | `2` | Decimali di arrotondamento del valore durante il drag |
| `radius` | `number` | `0` | Raggio di arrotondamento su tutti e 4 gli angoli |
| `topLeftRadius` / `topRightRadius` / `bottomRightRadius` / `bottomLeftRadius` | `number` | `0` | Raggio per singolo angolo, sovrascrive `radius` |
| `labelSize` / `topLabelSize` | `number` | `12` | Dimensione font delle label interne/superiori |
| `labelColor` / `topLabelColor` | `string` | `"white"` / `"black"` | Colore delle label interne/superiori |

> Larghezza (`barWidth`) e offset (`barOffset`) delle barre sono props di
> **`<Chart>`**.

### `<GroupBar>`

Barre raggruppate (più serie affiancate per ogni punto sull'asse X). Props sostanzialmente identiche a `<Bar>`, senza drag/click e senza `horizontal`.

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `name` | `string` | — (richiesta) | Nome della serie in `elements` |
| `stacked` | `boolean` | `false` | Impila questa barra con le altre che condividono lo stesso `stackedName` |
| `showLabels` | `boolean` | `false` | Mostra il valore dentro ogni barra |
| `topLabelSerie` | `string` | `""` | Nome di un'altra serie da mostrare come etichetta sopra le barre |
| `radius` | `number` | `0` | Raggio di arrotondamento su tutti e 4 gli angoli |
| `topLeftRadius` / `topRightRadius` / `bottomRightRadius` / `bottomLeftRadius` | `number` | `0` | Raggio per singolo angolo |
| `labelSize` / `topLabelSize` | `number` | `12` | Dimensione font delle label |
| `labelColor` / `topLabelColor` | `string` | `"white"` / `"black"` | Colore delle label |

> Larghezza (`barWidth`) e spaziatura di gruppo (`barGroupGap`) sono props di
> **`<Chart>`**.

### `<Line>`

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `name` | `string` | — (richiesta) | Nome della serie in `elements` da disegnare come linea |
| `hideLine` | `boolean` | `false` | Nasconde il tratto della linea (utile per mostrare solo punti/etichette) |
| `showDots` | `boolean` | `false` | Mostra un pallino su ogni punto dato |
| `showLabels` | `boolean` | `false` | Mostra il valore accanto a ogni punto |
| `highlightLabels` | `boolean` | `false` | Mostra l'etichetta solo sul punto attualmente in hover |
| `dashed` | `boolean` | `false` | Linea tratteggiata |
| `trimZeros` | `boolean` | `false` | Interrompe la linea in corrispondenza di valori `0` (li tratta come assenti) |
| `horizontal` | `boolean` | `false` | Disegna la linea in orientamento orizzontale |
| `labelSize` | `number` | `12` | Dimensione font delle etichette |
| `labelXOffset` / `labelYOffset` | `number` | `0` | Offset manuale delle etichette |
| `lineOffset` | `number` | — | Offset orizzontale (solo grafici `horizontal`) |
| `tiltLabels` | `boolean` | `false` | Inclina le etichette |
| `tiltLabelsAngle` | `number` | `45` | Angolo di inclinazione, se `tiltLabels` |
| `fill` | `string` | — | Colore di riempimento dell'area sotto la linea (fino alla baseline; nei grafici negativi fino alla linea dello zero). Richiede `fillOpacity > 0` per essere visibile. Vedi [Area chart](#area-chart) |
| `fillOpacity` | `number` | `0` | Opacità del riempimento |
| `fillGradient` | `boolean` | `false` | Riempie l'area con una sfumatura verticale (colore → trasparente), effetto area/sparkline. `fillOpacity` è l'opacità in cima (default `0.3`). Non per grafici orizzontali |
| `renderDot` | `(props) => ReactNode` | — | Marca custom **al posto** del pallino, alla posizione **esatta** del punto. Con `showDots` viene chiamata su ogni punto; senza, solo su quello in hover. `props = { x, y, index, value, hovered, color }`. Rende SVG (ignorata con `renderer="canvas"`). Vedi [Marche custom](#marche-custom) |

#### Area chart

Un area chart non è un componente a sé: è una `<Line>` con riempimento
(`fill` + `fillOpacity`, oppure `fillGradient`). L'area va dal tratto alla
baseline (il fondo), o alla **linea dello zero** nei grafici con valori negativi
(riempiendo sopra e sotto). Due aree semi-trasparenti su assi diversi mostrano le
intersezioni. Con `fillGradient` l'area è sfumata (colore → trasparente), come la
sparkline. Vedi le story *Line Chart/Area* (Normal, Gradient, Negative, DualMixed).

```tsx
<Line name="vendite" fill="#14b8a6" fillOpacity={0.25} />        // area solida
<Line name="vendite" fill="#14b8a6" fillGradient />             // area sfumata
```

#### Sparkline

Non c'è un componente `<Sparkline>`: una sparkline è una **composizione** dei
primitivi — un `<Chart>` compatto senza assi/legenda/tooltip, con padding piccolo
(via tema) e una `<Line fillGradient>`.

```tsx
<Chart width={120} height={32} elements={[serie]} theme={{ padding: 3 }}>
  <Line name="s" fillGradient />
</Chart>
```

Vedi la story *Line Chart/Sparkline* per un esempio inline in una tabella.

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
| `legendType` | `"horizontal" \| "vertical"` | `"horizontal"` | Layout della legenda |
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
| `intersect` | `boolean` | `false` | `false`: il tooltip segue la colonna più vicina (prossimità). `true`: compare solo quando il mouse è sopra la barra/gruppo. Non si applica ai grafici orizzontali |
| `hideSeries` | `string[]` | `[]` | Nomi delle serie da escludere dal tooltip |
| `width` / `height` | `number` | `150` / auto (`160`–`200`) | Dimensioni del riquadro tooltip |
| `footer` | `(series: Serie[], hoveredElementIndex: number) => ReactNode` | — | Contenuto custom in fondo al tooltip, al posto del totale calcolato |
| `cumulatedSeriesValue` | `{ series: string[]; label: string; format?: (value: number) => string }` | — | Se presente, mostra la somma dei valori delle `series` indicate con l'etichetta `label` |
| `customElement` | `(props) => ReactNode` | — | Sostituisce completamente il rendering di riga per ogni serie nel tooltip |

## Trasformazione dati

Funzioni **pure** `dati → dati` da applicare **a monte** di `elements`: trasformi
i dati e li passi al grafico come una normale serie (resta composizione). Vivono
in un **entry separato** (`tscharts/transform`), così non pesano sul bundle base
per chi non le usa.

```ts
import { movingAverage } from "tscharts/transform";

const smooth = movingAverage(serie.data, 4);
<Chart elements={[{ ...serie, data: smooth }]}>
  <YAxis name={serie.name} />
  <Line name={serie.name} />
  <XAxis dataPoints={serie.data.map((p) => p.date)} />
</Chart>;
```

Ogni funzione opera su `Point[]` (`{ date: string; value: number }[]`, cioè
l'array `data` di una serie temporale) e restituisce un nuovo array.

| Funzione | Firma | Descrizione |
|----------|-------|-------------|
| `movingAverage` | `(data, window) => Point[]` | Media mobile: ogni punto è la media degli ultimi `window` punti (finestra più corta all'inizio). Date invariate |
| `cumulative` | `(data) => Point[]` | Somma progressiva (cumulata) |
| `aggregate` | `(data, { by, reduce? }) => Point[]` | Raggruppa per la chiave `by(point)` (es. `p => p.date.slice(0,7)` per mese) e riduce (`"sum"` default, o `avg`/`min`/`max`/`count`). La `date` risultante è la chiave |
| `bin` | `(data, { size? \| count? }) => Point[]` | Istogramma: distribuisce i valori in intervalli (`size` fisso o `count` intervalli equi) e conta i punti. La `date` è l'etichetta dell'intervallo |

Vedi le story *Transform* (MovingAverage, Cumulative, Aggregate, Bin).

## Rendering su canvas

Di default ogni marca è un nodo SVG: un `<circle>` per dot, un `<path>` per
barra. Ottimo fino a qualche centinaio di marche; oltre, il numero di nodi DOM
diventa il collo di bottiglia (uno scatter da 10.000 punti crea 10.000 `<circle>`
→ mount/paint lentissimi). Con **`<Chart renderer="canvas">`** le marche dense
(`Line` con `showDots`, `Bar`) vengono disegnate su un **unico `<canvas>`** —
stessa geometria (i path del core via `Path2D`), un solo nodo.

```tsx
<Chart renderer="canvas" width={800} height={400} elements={[scatter]}>
  <Line name="s" showDots />   {/* migliaia di punti su un canvas */}
  <YAxis name="s" />
  <XAxis dataPoints={dates} />
</Chart>
```

È lo **stesso modello compositivo**: cambia solo dove vengono dipinte le marche.
Punti chiave:

- **Ibrido**: solo le marche dense vanno su canvas; **assi, griglia, legenda,
  tooltip, hover e selezione restano SVG** e continuano a funzionare identici
  (l'hover è calcolato matematicamente, non per-elemento).
- **`renderer="svg"` (default) esclude completamente il canvas**: nessun
  `<canvas>` montato, nessun overhead — le marche restano SVG byte-identiche.
- **Interazione barre**: `onBarClick`/`onBarDrag` funzionano anche su canvas
  (hit-testing geometrico), drag da touch incluso. Per l'accessibilità, le barre
  cliccabili hanno elementi focusabili invisibili (Tab + Invio); il mouse passa
  dal canvas.
- **Quando usarlo**: dataset grandi (scatter/serie fitte, molte barre). Per pochi
  elementi l'SVG è preferibile (nitido, accessibile, SSR-friendly).

**Limiti noti (canvas)**: nessun rendering server-side (fallback all'SVG).

Vedi la story *Canvas renderer*.

## Marche custom

Oltre alle marche built-in (`<Line>`, `<Bar>`, ...), puoi scrivere le **tue**
marche e comporle in `<Chart>` come una qualsiasi. L'hook **`useChartMark`**
espone il sistema di coordinate del grafico (scale + dimensioni + serie + hover),
lo stesso che usano le marche interne.

```tsx
import { useChartMark } from "tscharts";

// Error bar su una serie standard
function ErrorBars({ name, delta }: { name: string; delta: number }) {
  const mark = useChartMark(name);
  if (!mark?.serie) return null;
  return mark.serie.data.map((d, i) => (
    <line key={i} x1={mark.x(i)} x2={mark.x(i)}
      y1={mark.y(d.value - delta)} y2={mark.y(d.value + delta)}
      stroke={mark.color} strokeWidth={2} />
  ));
}

<Chart elements={[serie]}>
  <YAxis name="s" /> <Line name="s" />
  <ErrorBars name="s" delta={5} />   {/* composta come una marca qualsiasi */}
  <XAxis dataPoints={dates} />
</Chart>
```

**Due modi d'uso**:

- **`useChartMark(name)`** — riferisce una serie di `elements`: ottieni `serie` e
  `color`, e la marca eredita **dominio, tooltip, hover e legenda** già
  funzionanti.
- **`useChartMark()`** (senza nome) — solo scale + dimensioni: la marca porta i
  **propri dati** come prop (es. candlestick con `open/high/low/close`) e li
  posiziona con `x`/`y`. Imposta `<YAxis min max>` per far coprire al dominio i
  tuoi valori.

L'hook ritorna `null` finché il grafico non è misurato (come le marche built-in),
altrimenti un oggetto `ChartMark`:

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `point` | `(index, value) => { x, y }` | punto **{x,y} sullo schermo** per la categoria `index` al `value`. Consapevole di **orientamento** (verticale/orizzontale) e **segno** (grafici negativi): è l'accessor generale |
| `x` | `(indexOrTime) => number` | px X: indice categoria (`scaleType="band"`) o timestamp ms (`"time"`). Allineato ai marchi della serie riferita (dot della linea / centro della barra). Convenzione **verticale** |
| `y` | `(value) => number` | px Y di un valore (**zoom-aware** e **sign-aware**). Convenzione **verticale** |
| `yInvert` | `(px) => number` | inverso di `y` (px → valore) |
| `dimensions` | `{ chartXStart, chartXEnd, chartYEnd, chartYMiddle, width, height, padding }` | area di disegno in px |
| `serie` | `TimeSerie \| undefined` | la serie col nome dato (se passato) |
| `color` | `string \| undefined` | colore risolto della serie |
| `hoveredIndex` | `number \| null` | indice della categoria in hover |
| `scaleType` | `"band" \| "time"` | tipo di scala X attivo |
| `horizontal` | `boolean` | orientamento del grafico |
| `isCanvas` | `boolean` | `true` con `renderer="canvas"`: disegna sul canvas (vedi sotto) |

**Orientamento e segno**: usa **`point(index, value)`** per marche che devono
funzionare anche su grafici **orizzontali** o **negativi** — restituisce le
coordinate schermo corrette in ogni caso. `x`/`y` sono la decomposizione del caso
verticale (`y` è comunque sign-aware). Sull'orizzontale l'allineamento usa il
`barOffset` di default (offset custom per-marca non riflessi).

#### Marche accelerate su canvas

Con `renderer="canvas"`, una marca custom può disegnarsi **sul canvas** invece di
emettere SVG, per reggere dataset grandi. Usa **`useCanvasMark`** (registra una
draw-op; no-op in SVG) e il flag `isCanvas`:

```tsx
import { useChartMark, useCanvasMark } from "tscharts";

function CanvasDiamonds({ name }) {
  const mark = useChartMark(name);
  const serie = mark?.serie;
  useCanvasMark(                       // no-op se renderer="svg"
    mark?.isCanvas && serie
      ? (g) => {
          g.fillStyle = mark.color;
          serie.data.forEach((d, i) => {
            const { x, y } = mark.point(i, d.value);
            g.beginPath();
            g.moveTo(x, y-4); g.lineTo(x+4, y); g.lineTo(x, y+4); g.lineTo(x-4, y);
            g.closePath(); g.fill();
          });
        }
      : null,
  );
  if (!mark || !serie || mark.isCanvas) return null;   // canvas: già disegnato
  return <>{/* fallback SVG per renderer="svg" */}</>;
}
```

#### Marche attaccate ai punti di una linea: `renderDot`

`useChartMark.x` restituisce il **centro categoria** (come hover/label), che di
default è leggermente diverso dalla posizione dei pallini di `<Line>`. Per una
marca che deve stare **esattamente** sul punto della linea (dot personalizzato)
usa la prop **`renderDot`** di `<Line>`: la posiziona `<Line>` stessa, quindi è
allineata al pixel e integrata con `showDots` e l'hover.

```tsx
const diamond = (x, y, r) => `M ${x} ${y-r} L ${x+r} ${y} L ${x} ${y+r} L ${x-r} ${y} Z`;

<Line
  name="s"
  showDots
  renderDot={({ x, y, hovered, color }) => (
    <path d={diamond(x, y, hovered ? 8 : 6)}
      fill={hovered ? color : "#fff"} stroke={color} strokeWidth={2} />
  )}
/>
```

In breve: **`renderDot`** per marche *attaccate ai punti di una linea*;
**`useChartMark`** per overlay *indipendenti* (candlestick, bande, annotazioni).

Vedi la story *Custom marks* (Diamonds via `renderDot`, Candlestick via
`useChartMark`, CanvasAccelerated via `useCanvasMark`).
