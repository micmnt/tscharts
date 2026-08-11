# Changelog

Tutte le modifiche rilevanti a questo progetto sono documentate qui.
Il formato si ispira a [Keep a Changelog](https://keepachangelog.com/it/1.1.0/)
e il progetto segue il [Semantic Versioning](https://semver.org/lang/it/).

## [1.2.0] - 2026-08-11

### Added

- **Dominio Y controllabile** su `<YAxis min max>`: sovrascrive l'intervallo
  auto-calcolato `[0, max]`, utile per "entrare" in una banda stretta di valori
  (es. `min={98} max={102}`). Con `max` esplicito il `flatMax` viene ignorato; i
  valori fuori dominio sono clampati ai bordi. Scope: asse Y singolo, grafici
  verticali non-negativi (bar/line).
- **Zoom interattivo Y** su `<YAxis zoomable>`: zoom con la **rotella** del mouse
  attorno al cursore, **doppio click** per resettare. Props correlate:
  - `onZoomChange?: (domain: [number, number] | null) => void` — notifica il
    dominio corrente (`null` al reset);
  - `zoomStep?: number` (default `1.15`) — quanto zooma ogni tacca;
  - `zoomSnap?: number` — arrotonda gli estremi del dominio al multiplo indicato
    (es. `1` = interi), per evitare valori con decimali.

  Il dominio è limitato a quello base (nessun pan nel vuoto) con uno zoom massimo.
- **Area chart** su `<Line>`: `fill` + `fillOpacity` riempie l'area sotto la
  linea fino alla baseline (o alla linea dello zero nei grafici negativi,
  riempiendo sopra e sotto). Nuova prop **`fillGradient`** per l'area sfumata
  (colore → trasparente), effetto area/sparkline. Un area chart resta una
  composizione (`<Line>` con riempimento), non un componente a sé.
- **Sparkline** documentata come composizione (`<Chart>` compatto senza assi +
  `<Line fillGradient>`), senza componente wrapper — vedi le story `Line
  Chart/Sparkline` (in tabella, in card).

### Changed

- **`<Line fill>`** ora riempie un'**area vera** fino alla baseline; prima
  chiudeva il tratto su se stesso (dall'ultimo al primo punto), producendo una
  regione imperfetta. Correzione: `fill` fa finalmente ciò che dichiara. La
  linea (stroke) non è più riempita di default.

### Internal

- **Scale esplicite complete** in `lib/core` (`createLinearScale` come primitivo
  condiviso da scala tempo e valori Y; `getChartYScale`, `computeWheelZoom`): il
  posizionamento è incapsulato in oggetti scala, refactor a comportamento
  invariato (byte-identico con la config di default).

## [1.1.0] - 2026-08-10

### Added

- **Asse X temporale** su `<XAxis scaleType="time">`: i punti delle serie
  `line` si posizionano proporzionalmente alla **data** (non all'indice), quindi
  un campionamento irregolare viene mostrato fedelmente. Props correlate:
  - `parseDate?: (date: string) => number | Date` — conversione della stringa
    `date` (default `new Date(d).getTime()`; utile per formati non-ISO come
    `"13/03"`);
  - `ticks?: "data" | number` — `"data"` (default) un tick per punto dato alla
    sua posizione temporale, un numero N tick equispaziati nel dominio;
  - `tickFormat?: (time: number) => string` — etichetta del tick temporale.

  Agisce solo sulle serie `line` (le barre restano categoriche); l'hover aggancia
  il punto dato più vicino nel tempo. Vedi
  [README](./README.md#asse-temporale). Default `scaleType="band"` invariato.

### Internal

- Scale esplicite nel core (`createBandScale`, `createTimeScale`,
  `getChartTimeScale`): l'aritmetica di posizionamento X, prima ripetuta a mano
  nei generatori/asse/hover, è ora incapsulata in oggetti scala condivisi —
  `position`/`invert` non possono più divergere. Refactor a comportamento
  invariato (byte-identico con la config di default), abilitante per l'asse
  temporale. Nessuna nuova dipendenza runtime.

## [1.0.0] - 2026-08-10

Primo rilascio stabile. Consolida l'API dei componenti e sposta ogni prop sul
componente che la "possiede". Le API vecchie restano quasi tutte funzionanti ma
**deprecate** (avviso in console in sviluppo) e verranno rimosse nella **2.0**.
Guida alla migrazione nel [README](./README.md#migrazione-a-v10).

### Added

- **`<XAxis>` / `<YAxis>`**: componenti d'asse dedicati e tipizzati per tipo, al
  posto di `<Axis type="xAxis|yAxis">`.
- **`<Chart>` — config di layout**: props `barWidth`, `barGroupGap`, `barOffset`
  (larghezza/spaziatura/offset delle barre, condivise da tutte le serie).
- **`<Chart theme>`** + export `defaultTheme` (congelato): override parziale del
  tema con deep-merge per-chiave.
- **`<Axis>` — selezione e interazione**: props `selectedValue`, `selectedColor`
  (evidenzia una categoria) e `onLabelClick(label, index)` (click sulle label).
- **`<Bar>` / `<GroupBar>` — props piatte**: `radius`, `topLeftRadius`, …,
  `labelSize`, `labelColor`, `topLabelSize`, `topLabelColor`, e per `<Bar>`
  anche `dragValueDecimals`, `onBarClick`, `onBarDrag`.
- **`<Tooltip intersect>`**: `false` (default) tooltip a prossimità, `true` solo
  quando il mouse è sopra la barra/gruppo.
- **Zero dipendenze runtime**: l'id del grafico usa `useId()` (via `nanoid`).

### Changed (BREAKING)

- **`type` obbligatorio su ogni serie** di `elements` (`"bar" | "line" |
  "bar-stacked" | "group-bar" | "pie" | "donut" | "angle-donut" |
  "threshold"`): è il discriminante della union dei tipi.
- **Rinominata la prop `higlightLabels` → `highlightLabels`** su `<Line>` (refuso).
- **Percorso del CSS**: `import "tscharts/style.css"` (prima
  `tscharts/dist/style.css`).
- **`labels`** (label custom di pie/donut) spostata dal tipo base delle serie a
  `PieSerie`: era esposta nell'autocomplete di tutte le serie, ora solo di
  pie/donut. Nessun cambto a runtime.
- **`<Chart style>`** ora tipizzata `CSSProperties` (prima `any`).

### Deprecated (funzionano, rimozione nella 2.0)

- Su `config` di `<Bar>`/`<GroupBar>`: `barWidth`/`barGroupGap`/`barOffset` →
  props di **`<Chart>`**.
- Su `config` di `<Bar>`: `selectedValue`/`selectedColor` → props di **`<Axis>`**.
- **`<Axis type="…">`**: usa **`<XAxis>` / `<YAxis>`** (l'alias `<Axis>` avvisa e
  delega).
- L'oggetto **`config` di `<Bar>`/`<GroupBar>`** → props piatte; in particolare
  `config.barClickAction` → `onBarClick`, `config.barDragAction` → `onBarDrag`.
- **`<Legend legendType>`** non è più obbligatoria: default `"horizontal"`.

### Fixed

- `globalConfig` reattivo ai cambi runtime dei `config` (prima "congelato" al
  mount).
- Assi Y delle group-bar: lookup per `axisName`, scala aggregata e titolo corretti.
- Tooltip dichiarativo (niente più `document.getElementById` a render time →
  SSR-safe).
- Nessuna dimensione negativa quando il container ha altezza 0 al primo mount.
- Hover: meno re-render (posizione del mouse fuori dal reducer).
