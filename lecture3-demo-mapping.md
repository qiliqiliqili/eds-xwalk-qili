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

### 3. Section/auto-blocking の実例（両パターンを実装）

当初は「どちらか一方」の想定だったが、最終的に **両方** 実装した。

#### 3-a. buildAutoBlocks() パターン（Hero自動ブロック化）

- **対応コード**: [scripts/scripts.js](scripts/scripts.js) の `buildHeroBlock()` / `buildAutoBlocks()`
  （L66〜93付近）。既存の UE 手動配置ブロックである [blocks/hero](blocks/hero) をそのまま流用し、
  `buildBlock('hero', { elems: [picture, h1] })`（`scripts/aem.js` の `buildBlock`）で
  同じ DOM 構造を合成している。
- **デモ場所**: 本文の一番上に「画像 → 見出し(H1)」の順でプレーンなコンテンツ（Heroブロックを置かずに）
  を配置したページ。レンダリング後にその2要素が自動的に `hero` ブロックとして
  main の先頭に挿入されることを DevTools の Elements タブで確認する。
- **説明**: エディタが明示的に「Hero」ブロックを置かなくても、置き方の“型”（画像の直後に見出し）さえ
  守れば JS 側で自動的にブロック化する仕組み。
  - **運用上の注意**: `main` 内の最初の `h1` と最初の `picture` を拾う実装のため、
    既存の本番コンテンツで「画像の後に見出し」という並びがたまたま存在すると意図せず Hero 化される可能性がある。
    本番展開前に対象ページでの動作確認を推奨。

#### 3-b. resourceType: Section による子Block自由配置パターン（Accordion Itemに適用）

- **対応コード**: [blocks/accordion/_accordion.json](blocks/accordion/_accordion.json) の
  `accordion-item` 定義。resourceType を `core/franklin/components/block/v1/block/item`（固定フィールド型）
  ではなく `core/franklin/components/section/v1/section` に変更し、model はトップレベルSectionと共通の
  [models/_section.json](models/_section.json)（`section`）をそのまま再利用。filter は新設した
  `accordion-item`（Text/Image/Button/Title/Hero/Cards/Columns/Custom Embed/... を許可）。
  **`template` に `"filter": "accordion-item"` を明示的に指定する必要がある**点が重要
  （後述のUE検証で判明。トップレベルの `_section.json` に `filter` キーが無いのは、AEMがページ直下の
  Section専用に特別扱いしているためで、Block内に置くカスタムのSection型コンポーネントでは
  明示指定が必須。参考: [aem.live 公式ドキュメント](https://www.aem.live/developer/component-model-definitions)
  に掲載されている `"resourceType": "core/franklin/components/section/v1/section"` +
  `"template": {"model": "tab", "filter": "section"}` という実例と同じ書き方）。
- **デモ場所**: [test/accordion-tabs-carousel-test.html](test/accordion-tabs-carousel-test.html) の
  「Item One」— 見出し(H3) + 段落 + **Cardsブロックを1つ自由に配置**した状態で正しく開閉・表示されることを確認済み。
  UEでは Accordion Item を選択した際に「+」ボタンから任意のコンポーネント/ブロックを追加できる。
  - **実際にUEで発生した不具合と修正**: 最初の実装では `template` に `filter` キーを入れておらず、
    UE上で Accordion Item を選択しても子コンポーネントを追加する「+」が機能しなかった
    （`_section.json` のトップレベルSectionが `filter` キー無しで動いていたのを見て、
    「idと同名のfilterが暗黙的に紐付く」と誤って一般化してしまったのが原因）。
    `"filter": "accordion-item"` を明示追加して解消。
- **説明**: `accordion-item` 内の**最初の子要素をクリック可能な見出し(summary)として扱い、残り全部を自由編集可能な本文**
  として扱う実装（[blocks/accordion/accordion.js](blocks/accordion/accordion.js)）。Tabs/Carouselの item型
  （固定フィールドしか持てない）とは対照的に、Accordion Item の中には Text・Image・Button だけでなく
  Cards や Columns など**別のブロックも自由にネスト**できる。
  - **実装上の重要な発見（要説明ポイント）**: `scripts/aem.js` の `decorateSections()`/`decorateBlocks()`/
    `wrapTextNodes()` は「ページ内でブロックは互いにネストしない」ことを前提にした一度きりのグローバル走査
    (`main.querySelectorAll('div.section > div > div')`)で作られている。Accordion Item に Cards ブロックを
    直置きすると、この前提が崩れ、`wrapTextNodes()` が誤ってネストした `<div class="cards">` を
    「ただのテキストセル」とみなして `<p class="cards">` に壊してしまう不具合が実際に発生した
    （ローカル検証で確認）。対処として `wrapTextNodes()`（`scripts/aem.js` L378〜)に
    「セル自身がすでに class を持つ場合はラップ済みとみなす」という1行の防御条件を追加している。
    → これはまさに講義で強調している「Section/auto-blocking の自由度を上げると、フレームワーク側の
    “ブロックは入れ子にならない”という暗黙の前提と衝突し、追加のランタイム実装が必要になる」ことの
    生きた実例。
  - 加えて、`accordion.js` 側で `decorateBlock`/`loadBlock`（`scripts/aem.js` からexport済み）を
    Accordion Item の本文に対して手動で再実行し、ネストしたブロックの CSS/JS を遅延ロードしている
    （通常のページ読み込みフローでは `main` 直下1階層しか自動処理されないため）。

### 4. Accordion Block（新規実装）

- **対応コード**:
  - 定義一式: [blocks/accordion/_accordion.json](blocks/accordion/_accordion.json)
    （`accordion` ブロック + `accordion-item`。`accordion-item` は上記3-bの通り Section型で自由配置）
  - 実装: [blocks/accordion/accordion.js](blocks/accordion/accordion.js)
    （`<details>/<summary>` に変換し、ネイティブの開閉挙動を利用。最初の子要素を見出しに、
    残りを本文とし、本文内のネストブロックを手動で装飾・遅延ロード）
  - スタイル: [blocks/accordion/accordion.css](blocks/accordion/accordion.css)
  - 関連パッチ: [scripts/aem.js](scripts/aem.js) `wrapTextNodes()` — ネストブロック保護のための防御条件を追加
- **デモ場所**: UEで「Accordion」ブロックをセクションに配置 → 「Accordion Item」を複数追加 →
  各Itemの中に見出し・段落・別ブロック（Cards等）を自由に配置してプレビューで開閉。ローカルでは
  [test/accordion-tabs-carousel-test.html](test/accordion-tabs-carousel-test.html) でも同じ挙動を確認できる
  （`npx serve .` などでプロジェクトルートを配信して開く）。
- **説明**: Tabs/Carouselが「item型（固定フィールドのみ許可）」であるのに対し、Accordionは
  「Section型（自由配置）」を採用しており、3種類のブロックを並べることで講義3-1の
  「Blockネスト（item型のみ許可）」との対比を1画面で見せられる構成にした。

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
| Blockネスト（item型のみ許可） | [blocks/cards/_cards.json](blocks/cards/_cards.json)、[blocks/tabs/_tabs.json](blocks/tabs/_tabs.json)、[blocks/carousel/_carousel.json](blocks/carousel/_carousel.json) の `filters`（item型・固定フィールド） vs [blocks/accordion/_accordion.json](blocks/accordion/_accordion.json) の `accordion-item`（Section型・自由配置） | 各 `_*.json` の `filters` 配列（`card`/`tab`/`carousel-item` は固定フィールドのみ、`accordion-item` は Text/Image/Cards等を自由に許可） | Tabs/Carousel/Cardsは resourceType を `block/v1/block/item` にして固定フィールドのみ許可する「型で縛る」設計。対してAccordionは `accordion-item` の resourceType を `section/v1/section` にすることで、同じ「item」の位置づけでも自由配置に転換できることを実演している。 |
| テンプレート管理（page metadata） | [scripts/scripts.js](scripts/scripts.js) L182-183（`getMetadata('template')` → `styles/${template}.css` を動的読込）、[scripts/aem.js](scripts/aem.js) `decorateTemplateAndTheme()` L360-370（`template`/`theme` メタデータを body class に変換）、[styles/magazine.css](styles/magazine.css)、[models/_page.json](models/_page.json)（ページメタデータのモデル） | `template=magazine` を指定したページ（例: [test/diners-magazine-test.html](test/diners-magazine-test.html) 相当の構成、または dn-magazine-header/footer を使うページ） | ページメタデータの `template` 値1つで「body class 付与」と「専用CSSの追加読込」が連動する仕組み。`_page.json` にモデル化されたフィールドではなく自由記述のメタデータ値で駆動している点も設計上の注目点。 |
| レイアウト（CSS Grid + columns block） | [blocks/columns/_columns.json](blocks/columns/_columns.json)（resourceType が `core/franklin/components/columns/v1/columns` という専用タイプ）、[blocks/columns/columns.js](blocks/columns/columns.js)、[blocks/columns/columns.css](blocks/columns/columns.css) | UEで「Columns」を配置し、列数・行数を指定してテキスト/画像を並べる | 通常の `block/v1/block`（フィールド1件=1セル）とは別系統の「グリッドレイアウト専用」resourceTypeで、CSS Gridベースの段組みをUE上で直接編集できる。他のブロックとの設計思想の違いを比較する好材料。 |
| RTE（semantic + 専用block） | [models/_text.json](models/_text.json)（`richtext` フィールド、素のセマンティックHTMLをそのまま許容） vs [blocks/custom-embed/_custom-embed.json](blocks/custom-embed/_custom-embed.json)（`text` フィールドでDAM上のHTMLパスのみを受け取る専用ブロック） | Text コンポーネントと Custom Embed ブロックをUEで並べて配置 | 「自由記述のリッチテキスト（semantic HTML任せ）」と「用途特化のフィールド設計を持つ専用ブロック」の対比。前者は柔軟だがスタイル崩れのリスクがあり、後者は制約があるが表示が安定する。 |

---

## 講義3-2 コアコンポーネント比較

| # | 比較軸 | 対応コード | デモ場所 | 説明 |
|---|---|---|---|---|
| 1 | 設計単位（definition/model分離） | 各ブロックの `_*.json`（例: [blocks/accordion/_accordion.json](blocks/accordion/_accordion.json)） | 1ファイル内の `definitions` セクションと `models` セクションを並べて表示 | 同じブロックでも「UE上でどう見えるか」の定義と「編集ダイアログのフィールド」の定義が明確に分離されているのが xwalk の設計単位。 |
| 2 | 実装主体（DOM decorate） | [blocks/accordion/accordion.js](blocks/accordion/accordion.js) / [blocks/tabs/tabs.js](blocks/tabs/tabs.js) / [blocks/carousel/carousel.js](blocks/carousel/carousel.js) の `export default function decorate(block)`、呼び出し元は [scripts/aem.js](scripts/aem.js) `loadBlock()` L574-603（`import(...blockName.js)` して `mod.default(block)` を実行） | 3ブロックそれぞれの `decorate()` 実装差分を並べて表示（ネイティブ要素利用 vs 独自ARIA実装 vs 状態管理あり） | 「モデルで定義した素のDOM」を「JSのdecorate関数」がどう作り替えるかがブロックごとの実装の見せ場であり、同じ土台（item型モデル）でも実装の自由度が高いことを示せる。 |
| 3 | オーサリング拡張（フィールド追加） | [blocks/tabs/_tabs.json](blocks/tabs/_tabs.json) の `tab` model（`label`: text, `content`: richtext）、[models/_section.json](models/_section.json) の `style`: multiselect | UEのプロパティパネルでTabを選択し、フィールドが即座にダイアログへ反映される様子 | model の `fields` 配列に1件追加するだけで、UEのオーサリング画面に新しい入力項目が増える、という拡張のしやすさを実演する。 |
| 6 | テンプレート管理（filter JSON） | [component-filters.json](component-filters.json)（集約後）、[models/_section.json](models/_section.json) の `filters`（Sectionに置ける部品の許可リストに `accordion`/`tabs`/`carousel` を追加済み）、[blocks/accordion/_accordion.json](blocks/accordion/_accordion.json) など各ブロックの `filters` | `models/_section.json` を開き、`filters[0].components` に新規3ブロックが追加されている行を見せる → `npm run build:json` 後の `component-filters.json` に反映される流れ | 「どのコンテナに、どの部品を置けるか」を一元的にJSONで宣言し、ビルド時に集約する仕組み。テンプレート（＝コンテナごとの許可構成）の管理がコードレベルで完結している。 |

---

## 実装ファイル一覧（今回追加・変更分）

- `scripts/scripts.js` … `buildAutoBlocks()` に `buildHeroBlock()` を実装
- `scripts/aem.js` … `wrapTextNodes()` にネストブロック保護の防御条件を追加（Accordion Itemの自由配置対応に必須）
- `blocks/accordion/_accordion.json`, `accordion.js`, `accordion.css` … 新規（`accordion-item` は Section型・自由配置）
- `blocks/tabs/_tabs.json`, `tabs.js`, `tabs.css` … 新規（`tab` は item型・固定フィールド）
- `blocks/carousel/_carousel.json`, `carousel.js`, `carousel.css` … 新規（`carousel-item` は item型・固定フィールド）
- `models/_section.json` … `filters` に `accordion`/`tabs`/`carousel` を追加（Section内に配置可能にするため）
- `component-definition.json` / `component-models.json` / `component-filters.json` … `npm run build:json` で再生成
- `test/accordion-tabs-carousel-test.html` … 3ブロックをAEM本番環境なしでローカル確認するためのテストページ
  （Accordionの1項目にCardsブロックを自由に入れ子配置した例を含む）
