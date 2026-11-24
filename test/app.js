// 生理の理解度テスト。流れ: つくる（彼女）→ 送る → 挑戦（彼氏）→ 1 問ずつ答え合わせ → 結果 → 彼女へ届ける。
// 名前と結果は URL の ?from= と ?r= にだけ入れる（サーバーには保存しない）。
(function () {
  var QUIZ = window.WC_QUIZ, RANKS = window.WC_RANKS;
  var BASE = "https://withcare.process-craft-ai.com/test/";
  var STORE = "https://apps.apple.com/jp/app/withcare/id6807024261";
  var app = document.getElementById("app");
  var state = { name: "", answers: [] };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; });
  }
  function track(name, params) { if (typeof gtag === "function") gtag("event", name, params || {}); }
  function show(html) { app.innerHTML = html; window.scrollTo(0, 0); }
  function on(id, fn) { var el = document.getElementById(id); if (el) el.addEventListener("click", fn); }
  function cleanName(s) { return String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 12); }
  function who(name) { return name ? "「" + esc(name) + "」さんの彼氏" : "あなた"; }
  function query(name, bits, mine) {
    var q = [];
    if (name) q.push("from=" + encodeURIComponent(name));
    if (bits) q.push("r=" + bits);
    if (mine) q.push("me=1");
    return q.length ? "?" + q.join("&") : "";
  }
  function link(name, bits) { return BASE + query(name, bits, false); }
  function lineUrl(text, url) { return "https://line.me/R/share?text=" + encodeURIComponent(text + "\n" + url); }
  function xUrl(text, url) { return "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url); }
  function rankOf(score) { return RANKS.filter(function (r) { return score >= r.min; })[0]; }

  function toast(text) {
    var el = document.createElement("div");
    el.className = "toast"; el.textContent = text;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1800);
  }
  function copy(url) {
    var done = function () { toast("リンクをコピーしました"); };
    if (navigator.clipboard) return navigator.clipboard.writeText(url).then(done, function () { prompt("コピーしてください", url); });
    prompt("コピーしてください", url);
  }

  // ---- つくる（彼女） ----
  function viewCreate() {
    show('<section class="card"><p class="eyebrow">理解度テスト</p>' +
      "<h1>彼氏は、生理のこと<br>どれだけ知ってる？</h1>" +
      '<p class="lead">ホントかウソかの全10問・約2分。リンクを送って、彼氏に解いてもらおう。</p>' +
      '<input id="name" class="field" maxlength="12" placeholder="あなたのニックネーム" autocomplete="off" enterkeyhint="done">' +
      '<button id="make" class="btn">彼氏に送るリンクをつくる</button>' +
      '<button id="self" class="sub">まずは自分で解いてみる</button>' +
      '<p class="note">登録なし・無料。ニックネームは彼氏の画面の見出しに出ます。</p></section>');
    on("make", function () {
      var name = cleanName(document.getElementById("name").value);
      if (!name) return toast("ニックネームを入れてね");
      track("test_create"); viewSend(name);
    });
    on("self", function () { startQuiz(""); });
  }

  // ---- 送る（彼女） ----
  function viewSend(name) {
    var url = link(name), text = "生理のこと、どれだけ知ってる？ 全10問のテスト、やってみて！";
    show('<section class="card"><p class="eyebrow">リンクができました</p><h1>彼氏に送ろう</h1>' +
      '<p class="lead">彼氏が解くと、結果が LINE であなたに届きます。</p>' +
      '<div class="urlbox">' + esc(url) + "</div>" +
      '<button id="copy" class="btn ghost">リンクをコピー</button>' +
      '<div class="row"><a id="line" class="btn line" href="' + esc(lineUrl(text, url)) + '">LINEで送る</a>' +
      '<a id="x" class="btn x" target="_blank" rel="noopener" href="' + esc(xUrl(text + " #生理の理解度テスト", url)) + '">Xでポスト</a></div>' +
      '<button id="self" class="btn dark">先に自分で解いてみる</button>' +
      '<p class="note">LINE では、送る相手に彼氏を選んでください。</p></section>');
    on("copy", function () { track("test_share", { method: "copy", step: "send" }); copy(url); });
    on("line", function () { track("test_share", { method: "line", step: "send" }); });
    on("x", function () { track("test_share", { method: "x", step: "send" }); });
    on("self", function () { startQuiz(""); });
  }

  // ---- 挑戦（彼氏） ----
  function viewChallenge(name) {
    show('<section class="card"><p class="eyebrow">理解度テスト</p>' +
      "<h1>「" + esc(name) + "」さんから<br>テストが届きました</h1>" +
      '<p class="lead">生理のこと、どれだけ知ってる？<br>ホントかウソかの全10問・約2分。</p>' +
      '<button id="go" class="btn">挑戦する</button>' +
      '<p class="note">1 問ごとに答え合わせが出ます。結果は「' + esc(name) + "」さんに LINE で送れます。</p></section>");
    on("go", function () { startQuiz(name); });
  }

  // ---- 設問と答え合わせ ----
  function startQuiz(name) {
    state = { name: name, answers: [] };
    track("test_start", { invited: name ? 1 : 0 });
    viewQuestion(0);
  }
  function progress(i) {
    return '<div class="prog"><span><b>Q' + (i + 1) + "</b> <small>/ " + QUIZ.length + '</small></span><span class="bar"><i style="width:' +
      ((i + 1) / QUIZ.length * 100) + '%"></i></span></div>';
  }
  function viewQuestion(i) {
    show(progress(i) + '<section class="card"><p class="q">' + esc(QUIZ[i].q) + "</p>" +
      '<div class="ans"><button id="yes" class="yes"><span>○</span>ホント</button>' +
      '<button id="no" class="no"><span>×</span>ウソ</button></div></section>');
    on("yes", function () { answer(i, true); });
    on("no", function () { answer(i, false); });
  }
  function answer(i, value) {
    var ok = QUIZ[i].a === value;
    state.answers[i] = ok ? 1 : 0;
    viewAnswer(i, ok);
  }
  function viewAnswer(i, ok) {
    var item = QUIZ[i], last = i === QUIZ.length - 1;
    show(progress(i) + '<section class="card"><div class="mark' + (ok ? "" : " ng") + '"><small>' + (ok ? "せいかい" : "ざんねん") + "</small>" +
      (ok ? "正解" : "不正解") + '</div><p class="truth">答えは「' + (item.a ? "ホント" : "ウソ") + "」</p>" +
      '<p class="why">' + esc(item.why) + '</p><p class="src">出典: <a target="_blank" rel="noopener nofollow" href="' + esc(item.src[1]) + '">' + esc(item.src[0]) + "</a></p>" +
      '<button id="next" class="btn">' + (last ? "結果を見る" : "つぎの問題へ") + "</button></section>");
    on("next", function () { return last ? finish() : viewQuestion(i + 1); });
  }
  function finish() {
    var bits = state.answers.join("");
    track("test_complete", { score: bits.split("1").length - 1, invited: state.name ? 1 : 0 });
    history.replaceState(null, "", location.pathname + query(state.name, bits, true));
    viewResult(state.name, bits, true);
  }

  // ---- 結果 ----
  function ring(score) {
    var c = 2 * Math.PI * 80, pct = Math.round(score / QUIZ.length * 100);
    return '<div class="ring"><svg width="190" height="190" viewBox="0 0 190 190"><circle cx="95" cy="95" r="80" fill="none" stroke="#ffe1d6" stroke-width="18"/>' +
      '<circle cx="95" cy="95" r="80" fill="none" stroke="#ff5c8a" stroke-width="18" stroke-linecap="round" stroke-dasharray="' + (c * pct / 100) + " " + c + '"/></svg>' +
      "<div><b>" + score + "<small> /" + QUIZ.length + "</small></b><span>" + pct + "%</span></div></div>";
  }
  function reviewList(bits) {
    return '<ul class="list">' + QUIZ.map(function (item, i) {
      var ok = bits.charAt(i) === "1";
      return '<li><span class="' + (ok ? "o" : "x") + '">' + (ok ? "○" : "×") + "</span><div><strong>" + esc(item.q) + "</strong><em>答えは「" +
        (item.a ? "ホント" : "ウソ") + "」。" + esc(item.why) + "</em></div></li>";
    }).join("") + "</ul>";
  }
  function appCard(placement) {
    return '<section class="card"><div class="app"><img src="/icon-192.png" width="64" height="64" alt="WithCare"><div>' +
      "<strong>次の生理と今日の体調を、ふたりで共有</strong><span>WithCare は、生理周期と体調をパートナーに共有する iPhone アプリ。記録する人は無料です。</span></div></div>" +
      '<a class="btn" data-placement="' + placement + '" href="' + STORE + '">App Store で見る</a></section>';
  }
  function deliver(name, bits, score, rank) {
    var url = link(name, bits);
    var text = "生理の理解度テスト、" + QUIZ.length + "問中" + score + "問正解でした（" + rank.title + "）。結果はこちら";
    var target = name ? "「" + esc(name) + "」さんに結果をとどけよう" : "結果をシェアしよう";
    return '<hr class="sep"><p class="turn">' + target + "</p>" +
      '<a id="line" class="btn line" href="' + esc(lineUrl(text, url)) + '">LINEでとどける</a>' +
      '<div class="row"><a id="x" class="btn x" target="_blank" rel="noopener" href="' + esc(xUrl(text + " #生理の理解度テスト", BASE)) + '">Xでポスト</a>' +
      '<button id="copy" class="btn dark">リンクをコピー</button></div>';
  }
  function viewResult(name, bits, mine) {
    var score = bits.split("1").length - 1, rank = rankOf(score);
    var head = mine ? "あなたの理解度" : who(name) + "の理解度";
    show('<section class="card"><p class="eyebrow">' + head + "</p>" + ring(score) +
      '<p class="rank">' + rank.title + '</p><p class="copy">' + rank.copy + "</p>" +
      (mine ? deliver(name, bits, score, rank) : '<hr class="sep"><p class="turn">まちがえた所を、ふたりで話してみよう</p>') +
      "</section>" + appCard(mine ? "test_result" : "test_result_shared") +
      '<section class="card"><h2>答え合わせ</h2>' + reviewList(bits) + "</section>" +
      '<section class="card"><p class="turn">' + "じぶんもテストを送る？" + '</p><a class="btn" href="' + BASE + '">じぶんのリンクをつくる</a></section>');
    bindShare(link(name, bits));
    if (!mine) track("test_result_view", { score: score });
  }
  function bindShare(url) {
    on("line", function () { track("test_share", { method: "line", step: "result" }); });
    on("x", function () { track("test_share", { method: "x", step: "result" }); });
    on("copy", function () { track("test_share", { method: "copy", step: "result" }); copy(url); });
  }

  function route() {
    var p = new URLSearchParams(location.search), name = cleanName(p.get("from")), bits = p.get("r") || "";
    var valid = new RegExp("^[01]{" + QUIZ.length + "}$").test(bits);
    if (valid) return viewResult(name, bits, p.get("me") === "1");
    return name ? viewChallenge(name) : viewCreate();
  }
  route();
})();
