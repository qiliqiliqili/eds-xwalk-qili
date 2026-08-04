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

**Accordionへの適用は最終的に不採用にした。** 実装過程で2つのアーキテクチャ上の誤りと、
実機のUniversal Editorで検証不能な挙動（後述）に突き当たったため、Accordionは講義3-1の
「Blockネスト（item型のみ許可）」の典型例として、素直な Block + Item 設計（4節）に戻した。
その代わり、**公式ドキュメントの「Tab」の例に忠実な、独立したデモ**として実装し直している。

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

#### 3-b. 複数Sectionをauto-blockingで結合するパターン（公式の「Tab」例に忠実な実装）

公式ドキュメント（[aem.live: Content modeling for AEM authoring projects](https://www.aem.live/developer/component-model-definitions)）
に明記されている通り、EDSのコンテンツモデルは **「main > Section > (Default Content or Block)」という
1階層のネストしか許可しない**（Section の中に Block、Block の中に Section、を直接ネストすることはできない）。
そのため Tabs や Accordion のように「各アイテムの中身を自由編集にしたい」複合コンポーネントは、
**各アイテムをトップレベルの Section として著者に配置してもらい、クライアントサイドの auto-blocking で
連続するSectionを1つのウィジェットに結合する**、という設計が公式の推奨パターンであり、
ドキュメントには実際にこの構造の「Tab」コンポーネントの定義例が掲載されている:

```json
{
  "title": "Tab",
  "id": "tab",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/section/v1/section",
        "template": { "name": "Tab", "model": "tab", "filter": "section" }
      }
    }
  }
}
```

この例をそのまま実装したのが以下の「Section Tab」デモ（`tab` という id は既存の Tabs Block の
item と衝突するため `auto-tab` に変更しているのみで、構造は完全に同一）。

- **対応コード**:
  - 定義/model: [models/_section.json](models/_section.json) の `auto-tab`
    （resourceType は通常のSectionと同じ `core/franklin/components/section/v1/section`、
    `template.filter: "section"` で通常のSectionと同じ自由な子コンポーネント配置を許可。
    model には `label`（"Tab Label"）フィールドを1つ持つ）
  - `models/_component-filters.json` の `main` filter に `auto-tab` を追加し、
    通常の「Section」と並ぶトップレベルの選択肢として選べるようにしている
  - 結合ロジック: [scripts/scripts.js](scripts/scripts.js) の `buildSectionTabsBlocks()`
    （`Tab Label` を持つ連続したSectionを検出し、Tabs Blockと全く同じ形 = 1つの
    `<div class="tabs">`（行ごとに [ラベルセル, コンテンツセル]）に組み立て直す。
    `decorateSections()` の直後・`decorateBlocks()` の直前に実行する必要がある）
  - 描画は**新規コード不要**: 組み立てられた `<div class="tabs">` は手動配置した Tabs Block と
    区別がつかないため、既存の [blocks/tabs/tabs.js](blocks/tabs/tabs.js) がそのまま処理する。
    「Tabsブロックを手動配置する」か「連続するSection Tabを書く」かの**2つの異なるオーサリング経路が
    同じレンダリングに収束する**、という構成そのものが auto-blocking の面白さを表している
- **デモ場所**: [test/accordion-tabs-carousel-test.html](test/accordion-tabs-carousel-test.html) の
  “Section Tab” セクション — 2つの連続したSection（`div.section-metadata` に `Tab Label` を持つ）が
  1つのTabsブロックに結合され、うち1つには **Cardsブロックを自由に配置**した状態で
  正しく表示・タブ切り替えできることを確認済み。同じページの「Tabs（手動配置、比較用）」と
  並べて見せると2つの経路の違いが分かりやすい。

##### Accordionでこの方式を試して分かったこと（講義でそのまま使える失敗談）

最初はこの「Section auto-blocking」パターンをAccordionに適用しようとしたが、以下の順で
問題に突き当たり、最終的に「Accordionは素直にBlock+Itemに戻し、Section/auto-blockingの
デモは公式のTab例に忠実な形で別途作る」という整理に落ち着いた。

1. **誤り①: `accordion-item` を Block の Item（`core/franklin/components/block/v1/block/item`）として実装した。**
   UE上で「+」が全く出ず、子コンポーネントを追加できなかった。
2. **誤り①の応急修正: `template.filter` キーの追加漏れだと判断し追加したが、まだ直らなかった。**
   実際には `filter` キーの有無は無関係で、そもそも **resourceTypeがSectionの子コンポーネントは、
   Block(resourceType `block/v1/block`)のItemスロットの中に置くこと自体がサポートされていない**、
   という設計より根本的な制約が原因だった（公式ドキュメント: “The content model of Edge Delivery
   Services deliberately allows only a single level of nesting”）。
3. **修正: `accordion-item` をトップレベルSectionの一種として再定義し、公式の「Tab」例通りに
   カスタムmodelフィールド（`title` → 応急修正で `accordionTitle`）で見出しを持たせた。**
   ところがUE上でタイトルが「[object Object]」と表示され、編集するとエラーになった（誤り②）。
   原因は xwalk の **フィールド名の予約サフィックス（Field Collapse）** — `Alt`/`Text`/`Title`/`Type`/`Mime Type`
   で終わるフィールド名は「対応するベースフィールド（例: `link` + `linkTitle` → linkのtitle属性）に
   自動的に折りたたまれる」という特殊な意味を持つため、対応するベースフィールドが存在しない
   「孤立したcollapsibleフィールド」になっていたことだった（`eslint-plugin-xwalk` の
   `no-orphan-collapsible-fields` ルールが実際にこれを検出した）。
4. **フィールド名を `accordionHeading` に変更して②は解消したが、依然としてUE上でAccordionの
   折り畳みUIが一切現れず、ただのSectionの見た目のままだった。** カスタムmodelフィールドが
   「Section Metadataとして自動的にHTML化される」という公式ドキュメントの記述通りの挙動が、
   この実機のUniversal Editorでは確認できなかった（原因はこちらでは特定できず）。
   応急対応として実績のある `style→CSSクラス変換`だけに依存する形に作り直したが、これは
   公式の「Tab」例そのものからは外れた独自実装になってしまうため、**Accordionへの適用は取りやめ、
   標準的なBlock+Item設計に戻した**（4節）。公式の「Tab」例に忠実な実装は、代わりに
   上記3-bの「Section Tab」として、Accordionとは切り離した独立のデモに仕立て直した。
- **副次的に見つかった実装バグ（`scripts/aem.js`）**: いずれの試行でも、Section内にCardsブロックを
  自由配置すると `wrapTextNodes()`（`main.querySelectorAll('div.section > div > div')` という
  「ブロックは互いにネストしない」前提のグローバル一括処理）が、ネストした `<div class="cards">` を
  誤ってプレーンテキストのセルとみなし `<p class="cards">` に壊してしまう不具合が発生した。
  「セル自身が既に class を持っていればラップ済みとみなす」という防御条件を追加して解消
  （このガード自体にも `firstElementChild` が無いケースでの null 参照バグがあり、二段階で修正した）。
  この修正は3-bの「Section Tab」デモにもそのまま必要（`buildSectionTabsBlocks()` が構築する
  ラベル/コンテンツのセルに、構築時点で意図的にダミーのclassNameを付けているのはこのため）。

### 4. Accordion Block（新規実装）

- **対応コード**:
  - 定義一式: [blocks/accordion/_accordion.json](blocks/accordion/_accordion.json)
    （`accordion` ブロック + `accordion-item` アイテム、model は `heading`/`body`、
    filter で `accordion` の子を `accordion-item` のみに制限。Tabs/Carouselと同じ
    「item型（固定フィールドのみ許可）」の標準的な設計）
  - 実装: [blocks/accordion/accordion.js](blocks/accordion/accordion.js)
    （`<details>/<summary>` に変換し、ネイティブの開閉挙動をそのまま利用）
  - スタイル: [blocks/accordion/accordion.css](blocks/accordion/accordion.css)
- **デモ場所**: UEで「Accordion」ブロックをセクションに配置 → 「Accordion Item」を複数追加 →
  プレビューで開閉。ローカルでは [test/accordion-tabs-carousel-test.html](test/accordion-tabs-carousel-test.html)
  でも同じ挙動を確認できる（`npx serve .` などでプロジェクトルートを配信して開く）。
- **説明**: 親ブロック(accordion)と子アイテム(accordion-item)を分離し、
  子は `core/franklin/components/block/v1/block/item` という「item型」resourceTypeで
  親の filter にのみ従属する、という xwalk の定番パターン。上記3節の通り
  「Section auto-blocking」化も試したが実機で検証できなかったため、最終的にこの
  最も標準的で確実な設計に統一した。

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
  3-bの「Section Tab」auto-blockingデモも、結合後は同じ `tabs.js` で描画される
  （手動配置とauto-blockingの2経路が同じ実装に収束する例）。

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
| Blockネスト（item型のみ許可） | [blocks/cards/_cards.json](blocks/cards/_cards.json)、[blocks/accordion/_accordion.json](blocks/accordion/_accordion.json)、[blocks/tabs/_tabs.json](blocks/tabs/_tabs.json)、[blocks/carousel/_carousel.json](blocks/carousel/_carousel.json) の `filters`（すべてBlockのitem型・固定フィールド） vs [models/_section.json](models/_section.json) の `auto-tab`（トップレベルSection・自由配置＋auto-blockingで結合） | 各 `_*.json` の `filters` 配列（`card`/`accordion-item`/`tab`/`carousel-item` はすべて固定フィールドのみ） と `models/_section.json` の `auto-tab` 定義 | Accordion/Tabs/Carousel/Cardsはいずれも resourceType を `block/v1/block/item` にして固定フィールドのみ許可する「型で縛る」設計に統一。一方、EDSは「Block配下にSectionを直接ネストできない」という制約があるため、Sectionの中身をそのまま自由編集にしたい場合は、Block化ではなく複数のトップレベルSectionをauto-blockingで結合する（`auto-tab`）という全く別の設計に切り替える必要がある、という対比を実演している。 |
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
| 6 | テンプレート管理（filter JSON） | [component-filters.json](component-filters.json)（集約後）、[models/_section.json](models/_section.json) の `filters`（Sectionに置ける部品の許可リストに `accordion`/`tabs`/`carousel` を追加済み。`auto-tab` 自体は `main` filterに追加）、[models/_component-filters.json](models/_component-filters.json) の `main` filter | `models/_section.json` と `models/_component-filters.json` を開き、`filters[0].components`/`main.components` に新規要素が追加されている行を見せる → `npm run build:json` 後の `component-filters.json` に反映される流れ | 「どのコンテナに、どの部品を置けるか」を一元的にJSONで宣言し、ビルド時に集約する仕組み。テンプレート（＝コンテナごとの許可構成）の管理がコードレベルで完結している。 |

---

## 実装ファイル一覧（今回追加・変更分）

- `scripts/scripts.js` … `buildAutoBlocks()` に `buildHeroBlock()` を実装。加えて `buildSectionTabsBlocks()`
  を新設し、`decorateSections()` の直後・`decorateBlocks()` の直前に実行するよう `decorateMain()` を変更
  （公式の「Tab」例に忠実な、連続Section→Tabsブロック結合のauto-blockingデモ）
- `scripts/aem.js` … `wrapTextNodes()` にネストブロック保護の防御条件を追加（Section内に自由配置した
  ブロックが壊れる不具合の修正。副次的に見つかった `firstElementChild` null参照バグも修正）
- `blocks/accordion/_accordion.json`, `accordion.js`, `accordion.css` … 新規（`accordion` + `accordion-item`、
  標準的なBlockのitem型・固定フィールド。Section auto-blocking化は実機で検証できず不採用）
- `blocks/tabs/_tabs.json`, `tabs.js`, `tabs.css` … 新規（`tab` は Blockのitem型・固定フィールド。
  `buildSectionTabsBlocks()` が組み立てる auto-blocking版もこの同じ実装で描画される）
- `blocks/carousel/_carousel.json`, `carousel.js`, `carousel.css` … 新規（`carousel-item` は Blockのitem型・固定フィールド）
- `models/_section.json` … 公式の「Tab」例に忠実な `auto-tab`（トップレベルSectionの一種、
  `filter: "section"` で自由配置）の定義・modelを追加、`filters` に `accordion`/`tabs`/`carousel` を追加
  （Section内に配置可能にするため）
- `models/_component-filters.json` … `main` filter に `auto-tab` を追加
  （トップレベルSectionの選択肢として選べるようにするため）
- `component-definition.json` / `component-models.json` / `component-filters.json` … `npm run build:json` で再生成
- `test/accordion-tabs-carousel-test.html` … 4ブロック（Accordion / Section Tab / Tabs / Carousel）を
  AEM本番環境なしでローカル確認するためのテストページ。Section Tabの1つにCardsブロックを
  自由に配置した例を含む
