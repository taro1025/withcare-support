#!/usr/bin/env node
/**
 * 公開の直前（GitHub Actions の Pages ビルド）に、aio-writer が書き出した HTML へ導線と計測を足す。
 * 記事 HTML・記事一覧・article.css・sitemap.xml は aio-writer が公開のたびに書き直すので、リポジトリではなくここで足す。
 * 何度流しても同じ結果になる（足し済みのものは足さない）。
 *
 *   node tools/enhance.mjs [サイトのルート]   # 既定はカレントディレクトリ。ファイルをその場で書き換える
 *
 * - 記事: 結論の下にアプリの紹介と App Store ボタン（article_top）、末尾に関連記事 3 本、ボタンに data-placement
 * - トップ（index.html）: <!-- latest-articles --> の間に新しい記事 6 本
 * - 全ページ: App Store へのリンクが押されたら GA4 に store_click を送る
 * - sitemap.xml: lastmod を記事の更新日（トップと一覧はいちばん新しい記事の日付、ほかは git の最終コミット日）にする
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SITE = {
  name: "WithCare",
  tagline: "カップルで生理周期・体調を共有するアプリ",
  baseUrl: "https://withcare.process-craft-ai.com",
};
const MARK = 'data-enhanced="1"';
const STORE_CLICK = `<script>document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href*="apps.apple.com"]');if(!a||typeof gtag!=='function')return;var p=location.pathname.split('/');var i=p.indexOf('articles');gtag('event','store_click',{article_slug:i>=0&&p[i+1]?p[i+1].replace('.html',''):'',placement:a.getAttribute('data-placement')||'other',link_url:a.href});});</script>`;

export function main(root = process.cwd()) {
  const articles = readArticles(root);
  for (const article of articles) write(article.file, enhanceArticle(article, articles));
  write(path.join(root, "index.html"), enhanceLanding(read(path.join(root, "index.html")), articles));
  for (const file of topLevelHtml(root)) write(file, addStoreClick(read(file)));
  write(path.join(root, "articles/index.html"), addStoreClick(read(path.join(root, "articles/index.html"))));
  write(path.join(root, "sitemap.xml"), rewriteSitemap(root, read(path.join(root, "sitemap.xml")), articles));
  return articles.length;
}

/** articles/*.html（一覧を除く）を読み、題名・説明・キーワード・日付を取り出す */
export function readArticles(root) {
  const dir = path.join(root, "articles");
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".html") && name !== "index.html")
    .map((name) => parseArticle(path.join(dir, name), read(path.join(dir, name))))
    .sort((a, b) => b.published.localeCompare(a.published));
}

export function parseArticle(file, html) {
  const dates = [...html.matchAll(/<time datetime="([\d-]+)"/g)].map((m) => m[1]);
  return {
    file,
    html,
    slug: path.basename(file, ".html"),
    title: decode(match(html, /<h1>([^<]*)<\/h1>/)),
    description: decode(match(html, /<meta name="description" content="([^"]*)"/)),
    keywords: decode(match(html, /<meta name="keywords" content="([^"]*)"/)),
    published: dates[0] ?? "",
    modified: dates[1] ?? dates[0] ?? "",
  };
}

export function enhanceArticle(article, all) {
  let html = article.html;
  if (html.includes(MARK)) return html;
  html = html.replace('<link rel="stylesheet" href="/articles/article.css">',
    '<link rel="stylesheet" href="/articles/article.css">\n  <link rel="stylesheet" href="/articles/extra.css">');
  html = html.replace('class="doc-header-cta"', 'class="doc-header-cta" data-placement="header"');
  html = html.replace('class="doc-cta-button"', 'class="doc-cta-button" data-placement="article_bottom"');
  html = insertAfterAnswer(html, storeLead(storeUrl(html)));
  html = html.replace("</main>", `${relatedSection(relatedArticles(article, all))}\n</main>`);
  return addStoreClick(html.replace("<main class=\"doc\"", `<main class="doc" ${MARK}`));
}

/** 結論（.doc-answer）の直後。結論が無い記事は日付の行の直後 */
function insertAfterAnswer(html, block) {
  const start = html.indexOf('<section class="doc-answer"');
  if (start >= 0) {
    const end = html.indexOf("</section>", start) + "</section>".length;
    return `${html.slice(0, end)}\n  ${block}${html.slice(end)}`;
  }
  return html.replace(/(<p class="doc-meta">.*?<\/p>)/, `$1\n  ${block}`);
}

function storeUrl(html) {
  return match(html, /<a class="doc-cta-button" href="([^"]+)"/) || match(html, /href="(https:\/\/apps\.apple\.com[^"]+)"/);
}

function storeLead(href) {
  return `<aside class="doc-store-lead" aria-label="アプリの紹介">
    <img src="/icon-192.png" alt="" width="48" height="48">
    <div class="doc-store-lead-text"><p class="doc-store-lead-name">${SITE.name}</p><p>${SITE.tagline}</p></div>
    <a class="doc-store-lead-button" href="${href}" data-placement="article_top">App Store で見る</a>
  </aside>`;
}

/** 同じサイトの関連記事。キーワードの語が多く重なる順、同点なら新しい順 */
export function relatedArticles(article, all, count = 3) {
  const mine = keywordSet(article);
  const overlap = (other) => [...keywordSet(other)].filter((word) => mine.has(word)).length;
  return all
    .filter((other) => other.slug !== article.slug)
    .map((other) => ({ other, score: overlap(other) }))
    .sort((a, b) => b.score - a.score || b.other.published.localeCompare(a.other.published))
    .slice(0, count)
    .map(({ other }) => other);
}

function keywordSet(article) {
  return new Set(article.keywords.split(/[,、\s]+/).filter(Boolean));
}

function relatedSection(articles) {
  if (articles.length === 0) return "";
  return `  <nav class="doc-related" aria-label="関連する記事">
    <h2>あわせて読みたい記事</h2>
    <div class="doc-related-cards">
${articles.map((a) => card(a, `/articles/${a.slug}.html`)).join("\n")}
    </div>
  </nav>`;
}

function card(article, href) {
  return `      <a class="doc-card" href="${href}">
        <p class="doc-card-date"><time datetime="${article.published}">${article.published}</time></p>
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.description)}</p>
      </a>`;
}

/** トップの <!-- latest-articles --> 〜 <!-- /latest-articles --> を新しい記事 6 本で書き直す */
export function enhanceLanding(html, articles) {
  const pattern = /<!-- latest-articles -->[\s\S]*?<!-- \/latest-articles -->/;
  if (!pattern.test(html) || articles.length === 0) return addStoreClick(html);
  const items = articles.slice(0, 6).map((a) => `      <li><a href="articles/${a.slug}.html">${escapeHtml(a.title)}</a><span class="muted"> ${a.published}</span></li>`);
  const block = `<!-- latest-articles -->
  <section class="card latest-articles" aria-labelledby="latest-articles">
    <h2 id="latest-articles">新しい記事</h2>
    <ul>
${items.join("\n")}
    </ul>
    <p><a href="articles/index.html">記事をすべて見る</a></p>
  </section>
  <!-- /latest-articles -->`;
  return addStoreClick(html.replace(pattern, block));
}

/** GA4 のタグがあり、まだ入っていないページにだけ store_click の送信を足す */
export function addStoreClick(html) {
  if (!html.includes("googletagmanager.com/gtag/js") || html.includes("'store_click'")) return html;
  return html.replace("</body>", `${STORE_CLICK}\n</body>`);
}

export function rewriteSitemap(root, xml, articles) {
  const bySlug = new Map(articles.map((a) => [a.slug, a.modified]));
  const newest = articles.map((a) => a.modified).sort().at(-1);
  return xml.replace(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g, (whole, loc, lastmod) => {
    const rel = loc.replace(SITE.baseUrl, "").replace(/^\//, "");
    const slug = rel.match(/^articles\/(.+)\.html$/)?.[1];
    const date = slug && slug !== "index" ? bySlug.get(slug)
      : ["", "articles/", "index.html", "articles/index.html"].includes(rel) ? newest
        : commitDate(root, rel);
    return `<url><loc>${loc}</loc><lastmod>${date || lastmod}</lastmod></url>`;
  });
}

function commitDate(root, rel) {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", rel], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function topLevelHtml(root) {
  return fs.readdirSync(root).filter((name) => name.endsWith(".html") && name !== "index.html").map((name) => path.join(root, name));
}

function match(text, pattern) {
  return text.match(pattern)?.[1] ?? "";
}

function decode(text) {
  return text.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const read = (file) => fs.readFileSync(file, "utf8");
const write = (file, content) => fs.writeFileSync(file, content);

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`enhanced ${main(path.resolve(process.argv[2] ?? "."))} articles`);
}
