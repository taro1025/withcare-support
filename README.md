# withcare-support

WithCare のサポート・プライバシーポリシー・利用規約の静的サイト（GitHub Pages）。

## アクセス解析

GA4（プロパティ「記事サイト（aio-writer）」`556990736`、測定 ID `G-JPVTMQNGNM`）を 各ページの `<head>`（記事は aio-writer が同じタグを入れて書き出す） で入れている。
Google シグナルと広告のパーソナライズは切っている。プライバシーポリシーにも書いてある。
記事ごとの閲覧数は `~/asc-insight` が毎日取り込み、週次の改善提案に使う。

## 検索結果の見え方（SEO）

- トップ（`index.html`）はアプリの紹介ページ。`WebSite` の JSON-LD（name=WithCare）と `og:site_name` で、Google のサイト名を「WithCare」にしている（無いと親ドメインの「Process Craft AI」が出る）。
- ファビコンはアプリアイコン（`~/WithCare/.../AppIcon-1024.png`）から作った `favicon.ico`（16/32/48）・`icon-192.png`・`icon-512.png`・`apple-touch-icon.png`。全ページの `<head>` に入れている。記事は aio-writer の `iconTags()` が書き出す。
