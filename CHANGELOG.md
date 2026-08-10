# Changelog

Tutte le modifiche rilevanti a questo progetto sono documentate qui.
Il formato si ispira a [Keep a Changelog](https://keepachangelog.com/it/1.1.0/)
e il progetto segue il [Semantic Versioning](https://semver.org/lang/it/).

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
