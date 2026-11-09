# withcare-support

WithCare のサポート・プライバシーポリシー・利用規約の静的サイト（GitHub Pages）。

## アクセス解析

GA4（プロパティ「記事サイト（aio-writer）」`556990736`、測定 ID `G-JPVTMQNGNM`）を 各ページの `<head>`（記事は aio-writer が同じタグを入れて書き出す） で入れている。
Google シグナルと広告のパーソナライズは切っている。プライバシーポリシーにも書いてある。
記事ごとの閲覧数は `~/asc-insight` が毎日取り込み、週次の改善提案に使う。

## 公開のしかた（2026-11-07 から GitHub Actions）

GitHub Pages は Actions でビルドする（`.github/workflows/pages.yml`。Pages の設定は build_type=workflow）。main に push すると、
`tools/enhance.mjs` が公開用のコピーに次のものを足してから公開する。記事 HTML・記事一覧・`articles/article.css`・`sitemap.xml` は
aio-writer が公開のたびに書き直すため、リポジトリのファイルではなく公開の直前に足している（何度流しても同じ結果になる）。

- 記事: 結論のすぐ下にアプリの紹介と App Store へのボタン（`data-placement="article_top"`）、末尾に同じサイトの関連記事 3 本
  （キーワードの語が多く重なる順、同点なら新しい順）。末尾のボタンは `article_bottom`、ヘッダーのボタンは `header`。見た目は `articles/extra.css`
- トップ: `index.html` の `<!-- latest-articles -->` 〜 `<!-- /latest-articles -->` を新しい記事 6 本で書き直す（公開のたびに作り直すので、手で直さなくてよい）
- 全ページ: App Store へのリンク（`apps.apple.com`）が押されたら GA4 に `store_click` を送る。パラメータは `article_slug`・`placement`・`link_url`。`~/asc-insight` は記事ごとの App Store へのクリックをこのイベントで数える
- GA4 はイベントを数秒ためてから送り、ページが隠れたときは送るが、同じタブで別のページへ移ると送らずに捨てる（2026-11-07 に GA4 のリアルタイムで確かめた）。そこで iPhone・iPad 以外では App Store へのリンクを新しいタブで開き、元のページを残す（ポップアップが止められたら同じタブで移る）。iPhone・iPad は App Store アプリに切り替わってページが隠れるだけなので、リンクの動きは変えていない
- `sitemap.xml`: lastmod を記事の更新日に直す（トップと記事一覧はいちばん新しい記事の日付、ほかのページは git の最終コミット日）。aio-writer は全部を公開した日にしている
- IndexNow の鍵ファイル `c65a37c56704841a81632679afb7bb9d.txt` をルートに置いている（中身は鍵の文字列だけ）

## 検索結果の見え方（SEO）

- トップ（`index.html`）はアプリの紹介ページ。`WebSite` の JSON-LD（name=WithCare）と `og:site_name` で、Google のサイト名を「WithCare」にしている（無いと親ドメインの「Process Craft AI」が出る）。
- ファビコンはアプリアイコン（`~/WithCare/.../AppIcon-1024.png`）から作った `favicon.ico`（16/32/48）・`icon-192.png`・`icon-512.png`・`apple-touch-icon.png`。全ページの `<head>` に入れている。記事は aio-writer の `iconTags()` が書き出す。

## 英語・ドイツ語のページ（2026-11-09 から）

欧州向けに、法務・サポートの 4 ページ（`privacy` `terms` `support` `community`）の英語版を `en/`、ドイツ語版を `de/` に置いている。
アプリは表示言語に合わせて開くページを変える（日本語は今までのページ、ドイツ語は `de/`、それ以外は `en/`）。

- 英独のプライバシーポリシーは日本語版の訳に、GDPR で求められる項目（管理者、法的根拠〔健康・性生活のデータは Art. 9(2)(a) の明示的な同意〕、提供先、国外移転、保存期間、権利、監督機関への苦情）を足したもの。**日本語版を変えたら英独も同じ内容に直す**
- EU・英国の代理人（Art. 27）は置いていない。置いたら英独のプライバシーポリシーの 1 章に書く
- 日本語の 4 ページは、ブラウザの第一言語が日本語でない人を `en/`（ドイツ語なら `de/`）へ移す（`<head>` の先頭のスクリプト。GA より前に置いているので、移す人には Cookie を置かない）。
  言語の切り替えで「日本語」を選ぶと `?lang=ja` が付き、その端末では以後移さない（localStorage の `wc-lang`）。検索エンジンのクローラーは移さない
- どのページにも言語の切り替えと `hreflang`（ja / en / de、x-default は en）を入れている
- 英独のページには GA を入れていない（EU の Cookie の同意を取らずに済ませるため）。GA を入れるなら同意のバナーが要る
