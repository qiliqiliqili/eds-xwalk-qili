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

当初は「どちらか一方」の想定だったが、最終的に **両方** 実装した。3-bは実装過程で
アーキテクチャの誤りが2回見つかり、最終的に公式ドキュメント通りの形に修正している
（詳細は下記「実装過程で判明した誤りと修正」を参照）。

#### 3-a. buildAutoBlocks() パターン（Hero自動ブロック化）

- **対応コード**: [scripts/scripts.js](scripts/scripts.js) の `buildHeroBlock()` / `buildAutoBlocks()`
  （L64〜92付近）。既存の UE 手動配置ブロックである [blocks/hero](blocks/hero) をそのまま流用し、
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

#### 3-b. 複数Sectionをauto-blockingで結合するパターン（Accordion Itemに適用）

公式ドキュメント（[aem.live: Content modeling for AEM authoring projects](https://www.aem.live/developer/component-model-definitions)）
に明記されている通り、EDSのコンテンツモデルは **「main > Section > (Default Content or Block)」という
1階層のネストしか許可しない**（Section の中に Block、Block の中に Section、を直接ネストすることはできない）。
そのため Tabs や Accordion のように「各アイテムの中身を自由編集にしたい」複合コンポーネントは、
**各アイテムをトップレベルの Section として著者に配置してもらい、クライアントサイドの auto-blocking で
連続するSectionを1つのウィジェットに結合する**、という設計が公式の推奨パターンとなっている。
最終的にAccordionはこの方式で実装した。

- **対応コード**:
  - 定義: [models/_section.json](models/_section.json) の `accordion-item`（トップレベルSectionの一種として定義。
    resourceType は通常のSectionと同じ `core/franklin/components/section/v1/section`、
    `template.filter: "section"` を指定して通常のSectionと同じ自由な子コンポーネント配置を許可）
  - model: 同じく `models/_section.json` の `accordion-item` model（フィールドは `title`
    「Accordion Title」の1つのみ。これがアコーディオンの見出しになる）
  - 結合ロジック: [scripts/scripts.js](scripts/scripts.js) の `buildAccordionBlocks()`
    （`data-accordion-title` を持つ連続したSectionを検出し、1つの `<div class="accordion">` に
    組み立て直す。`decorateSections()` の直後・`decorateBlocks()` の直前に実行する必要がある）
  - 描画: [blocks/accordion/accordion.js](blocks/accordion/accordion.js)（組み立てられた
    `accordion` ブロックを `<details>/<summary>` に変換）
- **メタデータの仕組み**: Section の model にフィールドを追加すると、AEM側がそのフィールド値を
  自動的に「Section Metadata」というkey-valueテーブルとしてSectionの中に追記する
  （公式ドキュメント: “the model is the model of the section metadata block, which will
  automatically be appended to a section as a key-value block if it is not empty”）。
  `scripts/aem.js` の `decorateSections()` が既にこのテーブルを読み取り、
  `section.dataset[toCamelCase(key)]` に変換してテーブル自体を削除する処理を持っている
  （`style` というキーだけは特別扱いでCSSクラスに変換される、というのも同じ仕組み）。
  「Accordion Title」というラベルのフィールドは `section.dataset.accordionTitle` になる。
- **デモ場所**: [test/accordion-tabs-carousel-test.html](test/accordion-tabs-carousel-test.html) の
  Accordionセクション — 3つの連続したSection（`div.section-metadata` に「Accordion Title」を持つ）が
  1つのAccordionブロックに結合され、うち1つには **Cardsブロックを自由に配置**した状態で
  正しく開閉・表示されることを確認済み。

##### 実装過程で判明した誤りと修正（講義でそのまま使える失敗談）

1. **誤り①: `accordion-item` を Block の Item（`core/franklin/components/block/v1/block/item`）として実装した。**
   UE上で「+」が全く出ず、子コンポーネントを追加できなかった。
2. **誤り①の応急修正: `template.filter` キーの追加漏れだと判断し追加したが、まだ直らなかった。**
   実際には `filter` キーの有無は無関係で、そもそも **resourceTypeがSectionの子コンポーネントは、
   Block(resourceType `block/v1/block`)のItemスロットの中に置くこと自体がサポートされていない**、
   という設計より根本的な制約が原因だった（公式ドキュメント: “The content model of Edge Delivery
   Services deliberately allows only a single level of nesting”）。
3. **正しい修正: `accordion-item` を Block の子ではなく、トップレベルSectionの一種として再定義し、
   複数の連続Sectionを `buildAccordionBlocks()`（auto-blocking）でクライアントサイド結合する方式に変更。**
   これにより UE 上で通常のSection同様に「+」から自由にコンポーネント／ブロックを追加できるようになった。
- **副次的に見つかった実装バグ（`scripts/aem.js`）**: Cardsブロックを自由配置した際、
  `wrapTextNodes()`（`main.querySelectorAll('div.section > div > div')` という「ブロックは互いに
  ネストしない」前提のグローバル一括処理）が、ネストした `<div class="cards">` を誤って
  プレーンテキストのセルとみなし `<p class="cards">` に壊してしまう不具合が発生した。
  「セル自身が既に class を持っていればラップ済みとみなす」という防御条件を追加して解消
  （このガード自体にも `firstElementChild` が無いケースでの null 参照バグがあり、二段階で修正した）。

### 4. Accordion Block（新規実装）

- **対応コード**:
  - 定義/model: [models/_section.json](models/_section.json) の `accordion-item`（上記3-bの通り、
    トップレベルSectionとして自由配置）
  - 結合ロジック: [scripts/scripts.js](scripts/scripts.js) の `buildAccordionBlocks()`
  - 描画: [blocks/accordion/accordion.js](blocks/accordion/accordion.js)
    （`<details>/<summary>` に変換し、ネイティブの開閉挙動を利用。本文内のネストブロックは
    `decorateBlock`/`loadBlock` を手動で再実行して装飾・遅延ロード）
  - スタイル: [blocks/accordion/accordion.css](blocks/accordion/accordion.css)
  - 関連パッチ: [scripts/aem.js](scripts/aem.js) `wrapTextNodes()` — ネストブロック保護の防御条件を追加
- **デモ場所**: UEで通常のSectionを追加する要領で「Accordion Item」を連続して複数追加し、
  各Itemの中に「Accordion Title」を設定した上で見出し・段落・別ブロック（Cards等）を自由に配置。
  プレビューでは自動的に1つのアコーディオンとして結合・表示される。ローカルでは
  [test/accordion-tabs-carousel-test.html](test/accordion-tabs-carousel-test.html) でも同じ挙動を確認できる
  （`npx serve .` などでプロジェクトルートを配信して開く）。
- **説明**: Tabs/Carouselが「Blockのitem型（固定フィールドのみ許可）」であるのに対し、Accordionは
  「連続するSectionをauto-blockingで結合する（自由配置）」を採用しており、3種類のブロックを並べることで
  講義3-1の「Blockネスト（item型のみ許可）」との対比を1画面で見せられる構成にした。

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
| Blockネスト（item型のみ許可） | [blocks/cards/_cards.json](blocks/cards/_cards.json)、[blocks/tabs/_tabs.json](blocks/tabs/_tabs.json)、[blocks/carousel/_carousel.json](blocks/carousel/_carousel.json) の `filters`（Blockのitem型・固定フィールド） vs [models/_section.json](models/_section.json) の `accordion-item`（トップレベルSection・自由配置＋auto-blockingで結合） | 各 `_*.json` の `filters` 配列（`card`/`tab`/`carousel-item` は固定フィールドのみ） と `models/_section.json` の `accordion-item` 定義 | Tabs/Carousel/Cardsは resourceType を `block/v1/block/item` にして固定フィールドのみ許可する「型で縛る」設計。対してAccordionは「Block配下にSectionを直接ネストできない」というEDSの制約上、Block化を諦めて代わりに複数のトップレベルSectionをauto-blockingで結合する設計に転換しており、同じ「アイテムの集合」でも実現方法が根本的に異なることを実演している。 |
| テンプレート管理（page metadata） | [scripts/scripts.js](scripts/scripts.js) L182-183（`getMetadata('template')` → `styles/${template}.css` を動的読込）、[scripts/aem.js](scripts/aem.js) `decorateTemplateAndTheme()` L360-370（`template`/`theme` メタデータを body class に変換）、[styles/magazine.css](styles/magazine.css)、[models/_page.json](models/_page.json)（ページメタデータのモデル） | `template=magazine` を指定したページ（例: [test/diners-magazine-test.html](test/diners-magazine-test.html) 相当の構成、または dn-magazine-header/footer を使うページ） | ページメタデータの `template` 値1つで「body class 付与」と「専用CSSの追加読込」が連動する仕組み。`_page.json` にモデル化されたフィールドではなく自由記述のメタデータ値で駆動している点も設計上の注目点。 |
| レイアウト（CSS Grid + columns block） | [blocks/columns/_columns.json](blocks/columns/_columns.json)（resourceType が `core/franklin/components/columns/v1/columns` という専用タイプ）、[blocks/columns/columns.js](blocks/columns/columns.js)、[blocks/columns/columns.css](blocks/columns/columns.css) | UEで「Columns」を配置し、列数・行数を指定してテキスト/画像を並べる | 通常の `block/v1/block`（フィールド1件=1セル）とは別系統の「グリッドレイアウト専用」resourceTypeで、CSS Gridベースの段組みをUE上で直接編集できる。他のブロックとの設計思想の違いを比較する好材料。 |
| RTE（semantic + 専用block） | [models/_text.json](models/_text.json)（`richtext` フィールド、素のセマンティックHTMLをそのまま許容） vs [blocks/custom-embed/_custom-embed.json](blocks/custom-embed/_custom-embed.json)（`text` フィールドでDAM上のHTMLパスのみを受け取る専用ブロック） | Text コンポーネントと Custom Embed ブロックをUEで並べて配置 | 「自由記述のリッチテキスト（semantic HTML任せ）」と「用途特化のフィールド設計を持つ専用ブロック」の対比。前者は柔軟だがスタイル崩れのリスクがあり、後者は制約があるが表示が安定する。 |

---

## 講義3-2 コアコンポーネント比較

| # | 比較軸 | 対応コード | デモ場所 | 説明 |
|---|---|---|---|---|
| 1 | 設計単位（definition/model分離） | 各ブロックの `_*.json`（例: [blocks/tabs/_tabs.json](blocks/tabs/_tabs.json)） | 1ファイル内の `definitions` セクションと `models` セクションを並べて表示 | 同じブロックでも「UE上でどう見えるか」の定義と「編集ダイアログのフィールド」の定義が明確に分離されているのが xwalk の設計単位。 |
| 2 | 実装主体（DOM decorate） | [blocks/accordion/accordion.js](blocks/accordion/accordion.js) / [blocks/tabs/tabs.js](blocks/tabs/tabs.js) / [blocks/carousel/carousel.js](blocks/carousel/carousel.js) の `export default function decorate(block)`、呼び出し元は [scripts/aem.js](scripts/aem.js) `loadBlock()` L574-603（`import(...blockName.js)` して `mod.default(block)` を実行） | 3ブロックそれぞれの `decorate()` 実装差分を並べて表示（ネイティブ要素利用 vs 独自ARIA実装 vs 状態管理あり） | 「モデルで定義した素のDOM」を「JSのdecorate関数」がどう作り替えるかがブロックごとの実装の見せ場であり、同じ土台（item型モデル）でも実装の自由度が高いことを示せる。 |
| 3 | オーサリング拡張（フィールド追加） | [blocks/tabs/_tabs.json](blocks/tabs/_tabs.json) の `tab` model（`label`: text, `content`: richtext）、[models/_section.json](models/_section.json) の `style`: multiselect | UEのプロパティパネルでTabを選択し、フィールドが即座にダイアログへ反映される様子 | model の `fields` 配列に1件追加するだけで、UEのオーサリング画面に新しい入力項目が増える、という拡張のしやすさを実演する。 |
| 6 | テンプレート管理（filter JSON） | [component-filters.json](component-filters.json)（集約後）、[models/_section.json](models/_section.json) の `filters`（Sectionに置ける部品の許可リストに `tabs`/`carousel` を追加済み。`accordion-item` 自体は `main` filterに追加）、[models/_component-filters.json](models/_component-filters.json) の `main` filter | `models/_section.json` と `models/_component-filters.json` を開き、`filters[0].components`/`main.components` に新規要素が追加されている行を見せる → `npm run build:json` 後の `component-filters.json` に反映される流れ | 「どのコンテナに、どの部品を置けるか」を一元的にJSONで宣言し、ビルド時に集約する仕組み。テンプレート（＝コンテナごとの許可構成）の管理がコードレベルで完結している。 |

---

## 実装ファイル一覧（今回追加・変更分）

- `scripts/scripts.js` … `buildAutoBlocks()` に `buildHeroBlock()` を実装。加えて `buildAccordionBlocks()`
  を新設し、`decorateSections()` の直後・`decorateBlocks()` の直前に実行するよう `decorateMain()` を変更
- `scripts/aem.js` … `wrapTextNodes()` にネストブロック保護の防御条件を追加（Accordion Itemの自由配置対応に必須。
  副次的に見つかった `firstElementChild` null参照バグも修正）
- `blocks/accordion/accordion.js`, `accordion.css` … 新規（`buildAccordionBlocks()` が組み立てた
  `accordion` ブロックを `<details>/<summary>` に変換。`_accordion.json` は無し —
  Accordionは著者がUEから直接配置するBlockではなくなったため）
- `blocks/tabs/_tabs.json`, `tabs.js`, `tabs.css` … 新規（`tab` は Blockのitem型・固定フィールド）
- `blocks/carousel/_carousel.json`, `carousel.js`, `carousel.css` … 新規（`carousel-item` は Blockのitem型・固定フィールド）
- `models/_section.json` … `accordion-item`（トップレベルSectionの一種）の定義・modelを追加、
  `filters` に `tabs`/`carousel` を追加（Section内に配置可能にするため。`accordion` は追加していない —
  Blockとして配置するものではなくなったため）
- `models/_component-filters.json` … `main` filter に `accordion-item` を追加
  （トップレベルSectionの選択肢として選べるようにするため）
- `component-definition.json` / `component-models.json` / `component-filters.json` … `npm run build:json` で再生成
- `test/accordion-tabs-carousel-test.html` … 3ブロックをAEM本番環境なしでローカル確認するためのテストページ
  （Accordionは3つの連続Section+`div.section-metadata`として記述。うち1つにCardsブロックを自由に配置した例を含む）
