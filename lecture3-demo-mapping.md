# 講義3 デモ対応表（eds-xwalk-qili）

講義3系（コンポーネントとブロックの挙動差異／設計思想の転換／コアコンポーネント比較）の各トピックが、
本リポジトリ（eds-xwalk-qili）のどのコードに対応し、どこでデモできるかをまとめたもの。

---

## 講義3 コンポーネントとブロックの挙動 差異

### 1. E/L/D 3フェーズレンダリング

- **対応コード**: [scripts/scripts.js](scripts/scripts.js)
  - `loadEager()` (L144) … LCP に必要な最低限の処理（ヘッダ前のメイン装飾、`decorateMain`）
  - `loadLazy()` (L168) … セクション読み込み、ヘッダー/フッター読み込み、`lazy-styles.css`
  - `loadDelayed()` (L192) … 3秒後に `delayed.js` を動的 import
  - `loadPage()` (L198) … 上記3つを順番に呼び出すエントリポイント
- **デモ場所**: 任意のページ（例: `/`）を開き、DevTools の Network タブで
  `styles.css` → 各ブロック `.css/.js` → `lazy-styles.css` → `delayed.js` の順にリクエストが
  発生するのを見せる。
- **説明**: 「見える部分を最速で出す（Eager）→ 見えている残りを整える（Lazy）→
  優先度の低い処理を後回しにする（Delayed）」という3段階に処理を分離することで
  Core Web Vitals（特に LCP）を最適化している。

### 2. UEオーサリング（definition/model/filter）

- **対応コード**:
  - ルート集約ファイル: [component-definition.json](component-definition.json) /
    [component-models.json](component-models.json) / [component-filters.json](component-filters.json)
  - 各ブロック個別定義: 例 [blocks/cards/_cards.json](blocks/cards/_cards.json)
  - 集約設定: [models/_component-definition.json](models/_component-definition.json) /
    [models/_component-models.json](models/_component-models.json) /
    [models/_component-filters.json](models/_component-filters.json)
    （`merge-json-cli` で `blocks/*/_*.json` を glob 集約。`npm run build:json` で再生成）
- **デモ場所**: `blocks/cards/_cards.json` を開き、`definitions`（UEのコンポーネントブラウザに出る名前・アイコン）、
  `models`（プロパティパネルのフィールド）、`filters`（子として置ける部品の制限）の3ブロックを指差しで説明。
  その後 `npm run build:json` を実行し、ルートの `component-*.json` に反映されることを見せる。
- **説明**: 1つのブロックにつき「UEツリー上でどう見えるか(definition)」「編集ダイアログに何を出すか(model)」
  「どの部品を子に置けるか(filter)」の3つを1ファイルにまとめて宣言する、というのが xwalk の基本単位。

### 3. Section/auto-blocking の実例

今回は **buildAutoBlocks() に実装するパターン**（Hero自動ブロック化）を採用した。

- **対応コード**: [scripts/scripts.js](scripts/scripts.js) の `buildHeroBlock()` / `buildAutoBlocks()`
  （L66〜93付近）。既存の UE 手動配置ブロックである [blocks/hero](blocks/hero) をそのまま流用し、
  `buildBlock('hero', { elems: [picture, h1] })`（`scripts/aem.js` の `buildBlock`）で
  同じ DOM 構造を合成している。
- **デモ場所**: 本文の一番上に「画像 → 見出し(H1)」の順でプレーンなコンテンツ（Heroブロックを置かずに）
  を配置したページ。レンダリング後にその2要素が自動的に `hero` ブロックとして
  main の先頭に挿入されることを DevTools の Elements タブで確認する。
- **説明**: エディタが明示的に「Hero」ブロックを置かなくても、置き方の“型”（画像の直後に見出し）さえ
  守れば JS 側で自動的にブロック化する仕組み。UEの手動配置（Accordion/Tabs/Carouselなど）と対比させ、
  「オーサリングの自由度 vs 自動化の効率」を議論する材料になる。
  - 補足: もう一方の選択肢（`accordion-item` に `resourceType: Section` を指定して子Blockを自由配置する方式）は
    今回は不採用。理由は、`decorateSections`/`decorateBlocks` が `main` 直下1階層のみを走査する設計のため、
    ブロック内にネストした Section を自動装飾するには追加のランタイム実装が必要になり、デモの複雑度が上がるため。
  - **運用上の注意**: `buildHeroBlock()` は `main` 内の最初の `h1` と最初の `picture` を拾う実装のため、
    既存の本番コンテンツで「画像の後に見出し」という並びがたまたま存在すると意図せず Hero 化される可能性がある。
    本番展開前に対象ページでの動作確認を推奨。

### 4. Accordion Block（新規実装）

- **対応コード**:
  - 定義一式: [blocks/accordion/_accordion.json](blocks/accordion/_accordion.json)
    （`accordion` ブロック + `accordion-item` アイテム、model は `title`/`body`、
    filter で `accordion` の子を `accordion-item` のみに制限）
  - 実装: [blocks/accordion/accordion.js](blocks/accordion/accordion.js)
    （`<details>/<summary>` に変換し、ネイティブの開閉挙動をそのまま利用）
  - スタイル: [blocks/accordion/accordion.css](blocks/accordion/accordion.css)
- **デモ場所**: UEで「Accordion」ブロックをセクションに配置 → 「Accordion Item」を複数追加 →
  プレビューで開閉。ローカルでは [test/accordion-tabs-carousel-test.html](test/accordion-tabs-carousel-test.html)
  でも同じ挙動を確認できる（`npx serve .` などでプロジェクトルートを配信して開く）。
- **説明**: 親ブロック(accordion)と子アイテム(accordion-item)を分離し、
  子は `core/franklin/components/block/v1/block/item` という「item型」resourceTypeで
  親の filter にのみ従属する、という xwalk の定番パターン。

### 5. Tabs Block（新規実装）

- **対応コード**:
  - 定義一式: [blocks/tabs/_tabs.json](blocks/tabs/_tabs.json)（`tabs` + `tab`、model は `label`/`content`）
  - 実装: [blocks/tabs/tabs.js](blocks/tabs/tabs.js)（`role="tablist"/"tab"/"tabpanel"` を付与し、
    クリックで `aria-selected`/`hidden` を切り替え）
  - スタイル: [blocks/tabs/tabs.css](blocks/tabs/tabs.css)
- **デモ場所**: UEで「Tabs」ブロック配下に「Tab」を複数追加。ローカルは同じく
  [test/accordion-tabs-carousel-test.html](test/accordion-tabs-carousel-test.html) の Tabs セクション。
- **説明**: Accordionと同じ「親+item型」の構造だが、装飾JS側の作り方が異なる好例
  （Accordionはネイティブ要素に寄せ、Tabsは独自にARIA属性とイベントを組み立てる）。

### 6. Carousel Block（新規実装）

- **対応コード**:
  - 定義一式: [blocks/carousel/_carousel.json](blocks/carousel/_carousel.json)
    （`carousel` + `carousel-item`、model は `image`/`imageAlt`/`text`）
  - 実装: [blocks/carousel/carousel.js](blocks/carousel/carousel.js)
    （前へ/次へボタン、ドットインジケータ、`aria-hidden` 制御）
  - スタイル: [blocks/carousel/carousel.css](blocks/carousel/carousel.css)
- **デモ場所**: UEで「Carousel」ブロック配下に「Carousel Item」を複数追加（画像+キャプション）。
  ローカルは [test/accordion-tabs-carousel-test.html](test/accordion-tabs-carousel-test.html) の Carousel セクション。
- **説明**: `cards`/`hero` と同じ `reference`(image) + `richtext`(text) の組み合わせを
  item 型モデルに適用した例。ナビゲーションの状態管理（アクティブスライド）をJS側で持つ点が
  Accordion/Tabsとの違い。

---

## 講義3-1 設計思想の転換

| トピック | 対応コード | デモ場所 | 説明 |
|---|---|---|---|
| Blockネスト（item型のみ許可） | [blocks/cards/_cards.json](blocks/cards/_cards.json)、[blocks/accordion/_accordion.json](blocks/accordion/_accordion.json)、[blocks/tabs/_tabs.json](blocks/tabs/_tabs.json)、[blocks/carousel/_carousel.json](blocks/carousel/_carousel.json) の `filters` | 各 `_*.json` の `filters` 配列（例: `"components": ["accordion-item"]`） | 子コンポーネントの resourceType を `block/v1/block/item` にし、親の filter で許可リストを絞ることで「このブロックにはこのitemしか置けない」を強制する設計。自由配置ではなく型で縛るアプローチ。 |
| テンプレート管理（page metadata） | [scripts/scripts.js](scripts/scripts.js) L182-183（`getMetadata('template')` → `styles/${template}.css` を動的読込）、[scripts/aem.js](scripts/aem.js) `decorateTemplateAndTheme()` L360-370（`template`/`theme` メタデータを body class に変換）、[styles/magazine.css](styles/magazine.css)、[models/_page.json](models/_page.json)（ページメタデータのモデル） | `template=magazine` を指定したページ（例: [test/diners-magazine-test.html](test/diners-magazine-test.html) 相当の構成、または dn-magazine-header/footer を使うページ） | ページメタデータの `template` 値1つで「body class 付与」と「専用CSSの追加読込」が連動する仕組み。`_page.json` にモデル化されたフィールドではなく自由記述のメタデータ値で駆動している点も設計上の注目点。 |
| レイアウト（CSS Grid + columns block） | [blocks/columns/_columns.json](blocks/columns/_columns.json)（resourceType が `core/franklin/components/columns/v1/columns` という専用タイプ）、[blocks/columns/columns.js](blocks/columns/columns.js)、[blocks/columns/columns.css](blocks/columns/columns.css) | UEで「Columns」を配置し、列数・行数を指定してテキスト/画像を並べる | 通常の `block/v1/block`（フィールド1件=1セル）とは別系統の「グリッドレイアウト専用」resourceTypeで、CSS Gridベースの段組みをUE上で直接編集できる。他のブロックとの設計思想の違いを比較する好材料。 |
| RTE（semantic + 専用block） | [models/_text.json](models/_text.json)（`richtext` フィールド、素のセマンティックHTMLをそのまま許容） vs [blocks/custom-embed/_custom-embed.json](blocks/custom-embed/_custom-embed.json)（`text` フィールドでDAM上のHTMLパスのみを受け取る専用ブロック） | Text コンポーネントと Custom Embed ブロックをUEで並べて配置 | 「自由記述のリッチテキスト（semantic HTML任せ）」と「用途特化のフィールド設計を持つ専用ブロック」の対比。前者は柔軟だがスタイル崩れのリスクがあり、後者は制約があるが表示が安定する。 |

---

## 講義3-2 コアコンポーネント比較

| # | 比較軸 | 対応コード | デモ場所 | 説明 |
|---|---|---|---|---|
| 1 | 設計単位（definition/model分離） | 各ブロックの `_*.json`（例: [blocks/accordion/_accordion.json](blocks/accordion/_accordion.json)） | 1ファイル内の `definitions` セクションと `models` セクションを並べて表示 | 同じブロックでも「UE上でどう見えるか」の定義と「編集ダイアログのフィールド」の定義が明確に分離されているのが xwalk の設計単位。 |
| 2 | 実装主体（DOM decorate） | [blocks/accordion/accordion.js](blocks/accordion/accordion.js) / [blocks/tabs/tabs.js](blocks/tabs/tabs.js) / [blocks/carousel/carousel.js](blocks/carousel/carousel.js) の `export default function decorate(block)`、呼び出し元は [scripts/aem.js](scripts/aem.js) `loadBlock()` L574-603（`import(...blockName.js)` して `mod.default(block)` を実行） | 3ブロックそれぞれの `decorate()` 実装差分を並べて表示（ネイティブ要素利用 vs 独自ARIA実装 vs 状態管理あり） | 「モデルで定義した素のDOM」を「JSのdecorate関数」がどう作り替えるかがブロックごとの実装の見せ場であり、同じ土台（item型モデル）でも実装の自由度が高いことを示せる。 |
| 3 | オーサリング拡張（フィールド追加） | [blocks/accordion/_accordion.json](blocks/accordion/_accordion.json) の `accordion-item` model（`title`: text, `body`: richtext）、[models/_section.json](models/_section.json) の `style`: multiselect | UEのプロパティパネルでAccordion Itemを選択し、フィールドが即座にダイアログへ反映される様子 | model の `fields` 配列に1件追加するだけで、UEのオーサリング画面に新しい入力項目が増える、という拡張のしやすさを実演する。 |
| 6 | テンプレート管理（filter JSON） | [component-filters.json](component-filters.json)（集約後）、[models/_section.json](models/_section.json) の `filters`（Sectionに置ける部品の許可リストに `accordion`/`tabs`/`carousel` を追加済み）、[blocks/accordion/_accordion.json](blocks/accordion/_accordion.json) など各ブロックの `filters` | `models/_section.json` を開き、`filters[0].components` に新規3ブロックが追加されている行を見せる → `npm run build:json` 後の `component-filters.json` に反映される流れ | 「どのコンテナに、どの部品を置けるか」を一元的にJSONで宣言し、ビルド時に集約する仕組み。テンプレート（＝コンテナごとの許可構成）の管理がコードレベルで完結している。 |

---

## 実装ファイル一覧（今回追加・変更分）

- `scripts/scripts.js` … `buildAutoBlocks()` に `buildHeroBlock()` を実装
- `blocks/accordion/_accordion.json`, `accordion.js`, `accordion.css` … 新規
- `blocks/tabs/_tabs.json`, `tabs.js`, `tabs.css` … 新規
- `blocks/carousel/_carousel.json`, `carousel.js`, `carousel.css` … 新規
- `models/_section.json` … `filters` に `accordion`/`tabs`/`carousel` を追加（Section内に配置可能にするため）
- `component-definition.json` / `component-models.json` / `component-filters.json` … `npm run build:json` で再生成
- `test/accordion-tabs-carousel-test.html` … 3ブロックをAEM本番環境なしでローカル確認するためのテストページ
