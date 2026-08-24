# Changelog

Tutte le modifiche rilevanti a questo progetto sono documentate qui.
Il formato si ispira a [Keep a Changelog](https://keepachangelog.com/it/1.1.0/)
e il progetto segue il [Semantic Versioning](https://semver.org/lang/it/).

## [1.3.0] - 2026-08-11

### Removed (BREAKING)

Rimosso il **layer deprecato** introdotto in 1.0 (mai pubblicato, quindi senza
bump a 2.0). Le API già indicate come "rimozione nella 2.0" non esistono più:

- **`<Axis type="xAxis|yAxis">`** (alias) → usa **`<XAxis>` / `<YAxis>`**.
- **oggetto `config` su `<Bar>` / `<GroupBar>`** → props piatte (`radius`,
  `labelSize`, ..., `onBarClick`, `onBarDrag`); `barWidth`/`barGroupGap`/
  `barOffset` su **`<Chart>`**; `selectedValue`/`selectedColor`/`onLabelClick`
  su **`<XAxis>`**. (Il `config` di `Donut`/`AngleDonut` **resta**: non era
  deprecato.)
- di conseguenza: hook interno `useDeprecatedConfig` e la lettura del `config`
  deprecato delle serie in `computeGlobalConfig` (ora solo layout di `<Chart>`).

### Added

- **Rendering su canvas** (`<Chart renderer="canvas">`): motore di rendering
  **ibrido** per dataset grandi. Le marche dense (`<Line>` con `showDots`,
  `<Bar>`) vengono disegnate su un **unico `<canvas>`** (stessa geometria dei
  path del core via `Path2D`), mentre **assi, griglia, legenda, tooltip, hover e
  selezione restano SVG**. Uno scatter da ~10k punti passa da migliaia di nodi
  DOM a uno solo (nei nostri test ~250× più veloce al mount). `renderer="svg"`
  resta il default ed **esclude completamente il canvas** (nessun `<canvas>`,
  nessun overhead). `onBarClick`/`onBarDrag` funzionano anche su canvas
  (hit-testing geometrico, drag da touch incluso); le barre cliccabili restano
  raggiungibili da tastiera (Tab + Invio). Vedi
  [README](./README.md#rendering-su-canvas) e la story *Canvas renderer*. Unico
  limite: nessun rendering server-side (fallback all'SVG).
- **Marche custom** (`useChartMark`): hook pubblico che espone il sistema di
  coordinate del grafico (scale `x`/`y` zoom-aware, dimensioni, serie, colore,
  hover) per **comporre marche proprie** come figli di `<Chart>`, senza toccare
  gli interni. Due modi: riferendo una serie di `elements` per nome (eredita
  dominio/tooltip/hover/legenda) o portando dati propri (es. candlestick) e
  posizionandoli con le scale. Vedi
  [README](./README.md#marche-custom) e la story *Custom marks* (Diamonds,
  Candlestick). Scope: grafici verticali non-negativi; le marche custom rendono
  SVG (funzionano anche con `renderer="canvas"`, non accelerate).
- **`<Line renderDot>`**: render-prop per sostituire il pallino del punto con una
  marca custom, alla posizione **esatta** del dato (niente disallineamento del
  centro categoria) e integrata con `showDots`/hover. `props = { x, y, index,
  value, hovered, color }`. È il modo giusto per marche *attaccate ai punti di una
  linea* (dot personalizzati); `useChartMark` resta per overlay indipendenti.
- **`useChartMark` — orientamento/segno e canvas**: nuovo `point(index, value)`
  che restituisce le coordinate schermo corrette anche su grafici **orizzontali**
  e **negativi** (`y` è ora sign-aware); nuovo flag `isCanvas`. Nuovo export
  **`useCanvasMark`** (+ tipo `CanvasDrawOp`): una marca custom può disegnarsi
  **sul canvas** (`renderer="canvas"`) invece di emettere SVG, per reggere dataset
  grandi. Vedi la story *Custom marks* → CanvasAccelerated.

### Fixed

- **`<Line>` — dot O(N) anche senza `showDots`**: veniva reso un `<circle>` per
  ogni punto (invisibile, `r=0`) solo per far crescere quello in hover, con costo
  DOM lineare che poteva far crashare la pagina su serie grandi. Ora senza
  `showDots` si disegna **solo** il punto sotto il cursore (aspetto identico).
- **Zoom Y con rotella (`zoomStep`/`zoomSnap`) non solido** ("a volte zooma a
  volte no"): il listener si ri-agganciava a ogni zoom (closure con dominio
  stantio → step persi con la rotella rapida) e lo snap applicato a ogni step
  "ingoiava" i delta piccoli. Ora l'accumulo è continuo (sincrono) e lo snap si
  applica solo all'output mostrato.

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
- **Layer di trasformazione dati** (`tscharts/transform`): funzioni pure
  `dati → dati` da applicare a monte di `elements` — `movingAverage`,
  `cumulative`, `aggregate` (`{ by, reduce }`) e `bin` (istogramma). Entry point
  **separato** per non pesare sul bundle base (~19 kB gzip invariati); zero
  dipendenze. Resta composizione: si trasforma la serie e la si passa a `<Chart>`.

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
Guida alla migrazione in [MIGRATION.md](./MIGRATION.md).

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
