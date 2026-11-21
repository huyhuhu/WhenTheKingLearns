// Muc Tu vung: moi tu la mot than dan, on tap ngat quang theo pham ham. Cu phap ES5.
(function () {
  'use strict';

  var App = window.App, T = App.T, h = App.h, jp = App.jp, say = App.say, shuffle = App.shuffle, bar = App.bar;
  var DATA = window.VOCAB_DATA || {};
  var KANJI = (window.KANJI_DATA || {}).n5 || { kanji: {}, sessions: [] };
  var HOUR = 3600000, DAY = 24 * HOUR;
  var INTERVAL = [0, 4 * HOUR, 8 * HOUR, DAY, 2 * DAY, 7 * DAY, 14 * DAY, 30 * DAY, 120 * DAY];
  var BURNED = 9;
  var RANKS = [null, ['Lưu dân I', 'Wanderer I'], ['Lưu dân II', 'Wanderer II'], ['Thứ dân I', 'Commoner I'], ['Thứ dân II', 'Commoner II'],
    ['Binh sĩ', 'Soldier'], ['Võ tướng', 'General'], ['Đại thần', 'Minister'], ['Trung thần', 'Loyal Minister'], ['Trung thần điện', 'Hall of Loyalty']];
  var BATCH = 5, ROUND = 20;
  var POS = {
    n: ['danh từ', 'noun'], pron: ['đại từ', 'pronoun'], v1: ['động từ nhóm 1', 'godan verb'], v2: ['động từ nhóm 2', 'ichidan verb'],
    v3: ['động từ nhóm 3', 'irregular verb'], 'adj-i': ['tính từ い', 'i-adjective'], 'adj-na': ['tính từ な', 'na-adjective'],
    adv: ['phó từ', 'adverb'], conj: ['liên từ', 'conjunction'], int: ['thán từ', 'interjection'], exp: ['cụm từ', 'expression'],
    num: ['số từ', 'numeral'], ctr: ['đơn vị đếm', 'counter'], suf: ['hậu tố', 'suffix'], pre: ['tiền tố', 'prefix'], adn: ['từ bổ nghĩa', 'pre-noun adjectival']
  };
  var TAGS = {
    ghep: ['🏯', 'Ghép quân', 'Known kanji'], song: ['👯', 'Song sinh Hán Việt', 'Sino-Vietnamese twin'], gia: ['🎭', 'Kẻ giả mạo', 'False friend'],
    su: ['🌍', 'Sứ thần phương Tây', 'Loanword'], na: ['🔊', 'Âm na ná', 'Sound-alike'], am: ['☯', 'Âm dương', 'Pair'], trung: ['🎐', 'Song trùng', 'Homophone']
  };
  // Vung dat cua tung buoi: [chu Han, cach doc, Han Viet, chu de VI, chu de EN, y nghia VI, y nghia EN, romaji]
  var REGIONS = [
    ['京都', 'きょうと', 'Kinh Đô', 'Chào hỏi, こ・そ・あ・ど', 'Greetings, ko-so-a-do',
      'Kinh đô của Nhật hơn một nghìn năm (794–1869). Nơi bắt đầu của mọi lễ nghi, nên học chào hỏi ở đây.',
      'Japan\'s capital for over a thousand years (794–1869). Every courtesy starts here, so we learn greetings.', 'Kyōto'],
    ['九州', 'きゅうしゅう', 'Cửu Châu', 'Số đếm, đơn vị đếm', 'Numbers and counters',
      '"Chín châu", vì xưa gồm 9 tỉnh cổ. Vùng mang con số trong tên, học số đếm.',
      '"Nine provinces", after its nine ancient provinces. A region with a number in its name: we learn numbers.', 'Kyūshū'],
    ['奈良', 'なら', 'Nại Lương', 'Thời gian, lịch', 'Time and calendar',
      'Kinh đô 710–784. Hai bộ sử cổ nhất của Nhật ra đời thời này, nên học thời gian. Hươu ở Nara biết cúi chào.',
      'Capital in 710–784, when Japan\'s two oldest chronicles were written, so we learn time words. Nara\'s deer bow to visitors.', 'Nara'],
    ['中国', 'ちゅうごく', 'Trung Quốc', 'Gia đình, con người', 'Family and people',
      'Không phải nước Trung Quốc: tên nghĩa là "vùng ở giữa". Quê truyện Momotarō, cậu bé được ông bà nhặt từ quả đào.',
      'Not China: the name means "the middle lands". Home of Momotarō, the peach boy raised by an old couple.', 'Chūgoku'],
    ['四国', 'しこく', 'Tứ Quốc', 'Cơ thể, sức khoẻ', 'Body and health',
      '"Bốn nước", xưa gồm 4 tỉnh. Có đường hành hương 88 ngôi chùa dài khoảng 1.200 km đi bộ.',
      '"Four countries", after its four old provinces. Its 88-temple pilgrimage is about 1,200 km on foot.', 'Shikoku'],
    ['大阪', 'おおさか', 'Đại Phản', 'Ăn uống', 'Food and drink',
      'Thời Edo gọi là "Bếp của thiên hạ" (天下の台所). Người Osaka có câu "ăn đến sạt nghiệp" (食い倒れ).',
      'Called "the nation\'s kitchen" in the Edo period. Locals say kuidaore: eat until you drop (or go broke).', 'Ōsaka'],
    ['岐阜', 'ぎふ', 'Kỳ Phụ', 'Nhà cửa, đồ dùng', 'Home and things',
      'Có làng Shirakawa-go với nhà mái tranh dốc "chắp tay" (合掌造り), di sản UNESCO.',
      'Home of Shirakawa-go and its steep "praying hands" thatched houses, a UNESCO site.', 'Gifu'],
    ['東京', 'とうきょう', 'Đông Kinh', 'Phố xá, giao thông', 'Town and transport',
      '"Kinh đô phía Đông", đổi tên từ Edo năm 1868. Có những nhà ga đông nhất thế giới.',
      '"Eastern capital", renamed from Edo in 1868. It has the busiest train stations in the world.', 'Tōkyō'],
    ['愛知', 'あいち', 'Ái Tri', 'Trường học, công việc', 'School and work',
      '"Yêu sự hiểu biết". Quê của Toyota và thành phố Nagoya công nghiệp.',
      '"Love of knowledge". Home of Toyota and industrial Nagoya.', 'Aichi'],
    ['北陸', 'ほくりく', 'Bắc Lục', 'Mua sắm, tiền, quần áo, màu sắc', 'Shopping, money, clothes, colours',
      '"Đất liền phía Bắc". Kanazawa (金沢, "đầm vàng") làm ra gần như toàn bộ vàng lá của Nhật.',
      '"Northern land". Kanazawa ("marsh of gold") makes almost all of Japan\'s gold leaf.', 'Hokuriku'],
    ['北海道', 'ほっかいどう', 'Bắc Hải Đạo', 'Thiên nhiên, thời tiết, các thứ trong tuần', 'Nature, weather, weekdays',
      '"Đạo biển phía Bắc". Tuyết dày, gấu nâu, lễ hội tuyết Sapporo.',
      '"Northern sea circuit". Deep snow, brown bears and the Sapporo Snow Festival.', 'Hokkaidō'],
    ['長崎', 'ながさき', 'Trường Kỳ', 'Từ katakana', 'Katakana words',
      '"Mũi đất dài". Hơn 200 năm bế quan toả cảng, đảo Dejima ở đây là cửa ngõ duy nhất với phương Tây.',
      '"Long cape". For over 200 years of isolation, its Dejima island was Japan\'s only window to the West.', 'Nagasaki'],
    ['東北', 'とうほく', 'Đông Bắc', 'Động từ hằng ngày', 'Everyday verbs',
      'Năm 1689 nhà thơ Bashō đi bộ khoảng 2.400 km qua vùng này, vừa đi vừa ngắm vừa viết.',
      'In 1689 the poet Bashō walked about 2,400 km through here, walking, looking and writing.', 'Tōhoku'],
    ['関東', 'かんとう', 'Quan Đông', 'Động từ di chuyển, cho nhận', 'Moving, giving, receiving',
      '"Phía Đông cửa ải" Hakone. Muốn qua ải phải đi, đến, mang, gửi.',
      '"East of the barrier" at Hakone. Crossing it means going, coming, carrying and handing over.', 'Kantō'],
    ['東海', 'とうかい', 'Đông Hải', 'Tính từ', 'Adjectives',
      '"Biển phía Đông". Có núi Phú Sĩ cao 3.776 m, cao nhất, đẹp nhất Nhật Bản.',
      '"Eastern sea". Home of Mount Fuji, 3,776 m: the tallest and most beautiful in Japan.', 'Tōkai'],
    ['沖縄', 'おきなわ', 'Xung Thằng', 'Phó từ, liên từ, từ để hỏi', 'Adverbs, conjunctions, questions',
      'Từng là vương quốc Lưu Cầu (1429–1879) với nhà vua riêng. Vùng cuối cùng để thống nhất thiên hạ.',
      'Once the Ryukyu Kingdom (1429–1879) with its own king. The last land to unify the realm.', 'Okinawa']
  ];

  var STATES = {
    wild: ['Chưa khai phá', 'Unexplored'], war: ['Đang chinh phạt', 'On campaign'], held: ['Chiếm đóng', 'Occupied'],
    annex: ['Sáp nhập', 'Annexed'], peace: ['Thái bình', 'At peace']
  };
  var MAP_RANK = 3, WAVE = 20, TRUCE_WAVE = 10;

  var GAMES = [
    ['envoy', '使', ['Sứ thần phương Tây', 'Envoys from the West'], ['Đọc từ katakana, chọn từ tiếng Anh gốc, hoặc ngược lại', 'Read a katakana word and pick its English source, or the reverse']],
    ['treasury', '庫', ['Quốc khố', 'Royal Treasury'], ['Chọn đơn vị đếm và cách đọc đúng cho đồ vật', 'Pick the right counter and reading for each item']],
    ['feast', '宴', ['Ngự yến', 'Royal Banquet'], ['Ghép 6 cặp từ với nghĩa, tính giờ', 'Match 6 words with their meanings against the clock']]
  ];
  // [goi y VI, goi y EN, cach doc 1-10, cac duoi de tao dap an nhieu]
  var COUNTERS = {
    '本': ['vật dài', 'long things', ['いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん', 'じゅっぽん'], ['ほん', 'ぼん', 'ぽん']],
    '枚': ['vật mỏng, phẳng', 'flat things', ['いちまい', 'にまい', 'さんまい', 'よんまい', 'ごまい', 'ろくまい', 'ななまい', 'はちまい', 'きゅうまい', 'じゅうまい'], ['まい']],
    '匹': ['con vật nhỏ', 'small animals', ['いっぴき', 'にひき', 'さんびき', 'よんひき', 'ごひき', 'ろっぴき', 'ななひき', 'はっぴき', 'きゅうひき', 'じゅっぴき'], ['ひき', 'びき', 'ぴき']],
    '台': ['máy móc, xe cộ', 'machines, vehicles', ['いちだい', 'にだい', 'さんだい', 'よんだい', 'ごだい', 'ろくだい', 'ななだい', 'はちだい', 'きゅうだい', 'じゅうだい'], ['だい']],
    '冊': ['sách, vở', 'books', ['いっさつ', 'にさつ', 'さんさつ', 'よんさつ', 'ごさつ', 'ろくさつ', 'ななさつ', 'はっさつ', 'きゅうさつ', 'じゅっさつ'], ['さつ', 'ざつ']],
    '人': ['người', 'people', ['ひとり', 'ふたり', 'さんにん', 'よにん', 'ごにん', 'ろくにん', 'ななにん', 'はちにん', 'きゅうにん', 'じゅうにん'], ['にん']],
    'つ': ['đồ vật nói chung', 'things in general', ['ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'], ['つ']]
  };
  var COUNT_OBJ = [['鉛筆', '本'], ['傘', '本'], ['木', '本'], ['万年筆', '本'], ['ボールペン', '本'], ['ネクタイ', '本'],
    ['紙', '枚'], ['切手', '枚'], ['写真', '枚'], ['シャツ', '枚'], ['葉書', '枚'], ['切符', '枚'],
    ['犬', '匹'], ['猫', '匹'], ['魚', '匹'], ['車', '台'], ['自転車', '台'], ['テレビ', '台'], ['自動車', '台'],
    ['本', '冊'], ['辞書', '冊'], ['ノート', '冊'], ['雑誌', '冊'], ['学生', '人'], ['先生', '人'], ['子供', '人'], ['友達', '人'],
    ['卵', 'つ'], ['箱', 'つ'], ['コップ', 'つ']];
  var NUM_K = '一二三四五六七八九十', NUM_R = ['いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'],
    NUM_G = ['いっ', 'に', 'さん', 'よん', 'ご', 'ろっ', 'なな', 'はっ', 'きゅう', 'じゅっ'];

  var learn = null, review = null, hunt = null, game = null, curMode = '', mapSel = 0, calmDay = 0, byKey = null;

  // ---------- du lieu ----------
  function D() { return DATA.n5; }
  function wkey(w) { return w[0] + '|' + w[1]; }
  function V() {
    var p = App.progress();
    if (!p.vocab) p.vocab = { w: {} };
    if (!p.vocab.w) p.vocab.w = {};
    return p.vocab;
  }
  // Ban ghi: [bac, han on, so lan sai, chuoi dung, lan on cuoi, lan tiep kien dau]
  function rec(w) { return V().w[wkey(w)] || null; }
  function stage(w) { var r = rec(w); return r ? r[0] : 0; }
  function isDue(r, now) { return r && r[0] < BURNED && r[1] <= now; }
  function dayStart() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function dailyLimit() { var d = V().daily; return d ? d[0] : 10; }
  function learnedToday() {
    var t = dayStart(), n = 0, all = V().w;
    for (var k in all) if (all[k][5] >= t) n++;
    return n;
  }
  function newLeft() { return Math.max(0, dailyLimit() - learnedToday()); }
  function words(ids) { var out = []; for (var i = 0; i < ids.length; i++) out.push(D().words[ids[i]]); return out; }
  function dueList(ids) {
    var now = Date.now(), out = [], all = ids ? words(ids) : D().words;
    for (var i = 0; i < all.length; i++) if (isDue(rec(all[i]), now)) out.push(all[i]);
    return out;
  }
  function unlearned(ids) {
    var out = [], all = words(ids);
    for (var i = 0; i < all.length; i++) if (!rec(all[i])) out.push(all[i]);
    return out;
  }
  function countLearned(ids) { var n = 0; for (var i = 0; i < ids.length; i++) if (rec(D().words[ids[i]])) n++; return n; }
  function nextDue() {
    var min = 0, all = V().w;
    for (var k in all) if (all[k][0] < BURNED && (!min || all[k][1] < min)) min = all[k][1];
    return min;
  }
  function firstOpenSession() {
    var s = D().sessions;
    for (var i = 0; i < s.length; i++) if (unlearned(s[i]).length) return i + 1;
    return 0;
  }
  function sessionOf(w) {
    var idx = D().words.indexOf(w), s = D().sessions;
    for (var i = 0; i < s.length; i++) if (s[i].indexOf(idx) >= 0) return i + 1;
    return 1;
  }
  function wordOf(k) {
    if (!byKey) { byKey = {}; for (var i = 0; i < D().words.length; i++) byKey[wkey(D().words[i])] = D().words[i]; }
    return byKey[k];
  }
  function lastActive() { var m = 0, all = V().w; for (var k in all) if (all[k][4] > m) m = all[k][4]; return m; }
  function truceOn() { var t = V().truce; return !!t && Date.now() < t[0]; }

  // ---------- Bang truy na: [luc dan len, so lan dung, ngay dung cuoi, luc bat duoc] ----------
  function board() { var v = V(); if (!v.wanted) v.wanted = {}; return v.wanted; }
  function isWanted(k) { var e = board()[k]; return !!e && !e[3]; }
  function wantedList() { var out = [], b = board(); for (var k in b) if (!b[k][3] && wordOf(k)) out.push(wordOf(k)); return out; }
  function post(k, silent) {
    if (isWanted(k)) return;
    board()[k] = [Date.now(), 0, 0, 0];
    if (!silent) App.emit('word:wanted', { key: k, size: wantedList().length });
  }
  // Moi tu moi ngay chi tinh mot lan dung de khong bat duoc bang cach hoc don
  function chase(k, ok) {
    var e = board()[k], today = dayStart();
    if (!e || e[3]) return;
    if (!ok) { e[1] = 0; return; }
    if (e[2] === today) return;
    e[1]++; e[2] = today;
    if (e[1] >= 3) { e[3] = Date.now(); App.emit('word:caught', { key: k, size: wantedList().length }); }
  }

  // ---------- Vong quan ----------
  function waveLeft(w) {
    var out = [], now = Date.now();
    if (!w) return out;
    for (var i = 0; i < w.k.length; i++) {
      var x = wordOf(w.k[i]);
      if (x && isDue(rec(x), now)) out.push(x);
    }
    return out;
  }
  // Dot sau chi den khi dot truoc da bi day lui het
  function wave() {
    var v = V(), w = v.wave, today = dayStart(), now = Date.now(), fresh = !w || w.d !== today;
    if (fresh) {
      var last = lastActive();
      // Tru 2 gio cho ngay doi gio mua he
      if (last && today - new Date(last).setHours(0, 0, 0, 0) >= 7 * DAY - 2 * HOUR) v.truce = [today + 3 * DAY, now];
    }
    if (!fresh && waveLeft(w).length) return w;
    var od = dueList();
    if (!od.length && calmDay !== today && Object.keys(v.w).length) { calmDay = today; App.emit('map:calm'); }
    if (!fresh && !od.length) return w;
    od.sort(function (a, b) { return rec(a)[1] - rec(b)[1]; });
    v.wave = { d: today, t: now, k: od.slice(0, truceOn() ? TRUCE_WAVE : WAVE).map(wkey) };
    return v.wave;
  }
  function besieged(ids) {
    var left = waveLeft(wave());
    if (!ids) return left;
    var set = {}, out = [], i;
    for (i = 0; i < ids.length; i++) set[wkey(D().words[ids[i]])] = 1;
    for (i = 0; i < left.length; i++) if (set[wkey(left[i])]) out.push(left[i]);
    return out;
  }
  function siegeSince() {
    var out = [], s = D().sessions, now = Date.now();
    for (var i = 0; i < s.length; i++) {
      var min = 0;
      for (var j = 0; j < s[i].length; j++) {
        var r = rec(D().words[s[i][j]]);
        if (isDue(r, now) && (!min || r[1] < min)) min = r[1];
      }
      out.push(min);
    }
    return out;
  }
  function landLabel(n) { var r = region(n); return r[0] + ' ' + (App.isEn() ? r[7] : r[2]); }
  function checkLands(silent) {
    var v = V(), total = D().sessions.length;
    if (!v.annex) v.annex = {};
    for (var n = 1; n <= total; n++) {
      if (v.annex[n]) continue;
      var st = landState(n).st;
      if (st !== 'annex' && st !== 'peace') continue;
      v.annex[n] = Date.now();
      if (!silent) App.emit('map:region', { n: n, st: 'annex', name: landLabel(n), all: Object.keys(v.annex).length === total });
    }
  }

  function grade(w, ok) {
    var k = wkey(w), r = V().w[k], now = Date.now();
    if (!r) return;
    var before = r[0];
    if (ok) { r[0] = Math.min(BURNED, r[0] + 1); r[3]++; }
    else { r[0] = Math.max(1, r[0] - (r[0] >= 5 ? 2 : 1)); r[2]++; r[3] = 0; }
    r[1] = r[0] >= BURNED ? 0 : now + INTERVAL[r[0]];
    r[4] = now;
    App.emit('word:review', { key: k, ok: ok });
    if (r[0] !== before) App.emit('word:rank', { key: k, from: before, to: r[0] });
    if (!ok && r[2] >= 4) post(k);
  }
  function enlist(w) {
    var now = Date.now();
    V().w[wkey(w)] = [1, now + INTERVAL[1], 0, 0, now, now];
    App.emit('word:learn', { key: wkey(w) });
  }

  // Moi tu giu ban ghi co lan on cuoi moi hon; han muc tu moi lay lua chon moi hon.
  App.addMerger('vocab', function (a, b) {
    a = a || {}; b = b || {};
    var out = { w: {} }, k, aw = a.w || {}, bw = b.w || {};
    for (k in aw) out.w[k] = aw[k];
    for (k in bw) if (!out.w[k] || bw[k][4] > out.w[k][4]) out.w[k] = bw[k];
    var ad = a.daily, bd = b.daily;
    if (ad || bd) out.daily = !ad ? bd : !bd ? ad : (bd[1] > ad[1] ? bd : ad);
    var at = a.truce, bt = b.truce;
    if (at || bt) out.truce = !at ? bt : !bt ? at : (bt[1] > at[1] ? bt : at);
    var aw2 = a.wave, bw2 = b.wave;
    if (aw2 || bw2) out.wave = !aw2 ? bw2 : !bw2 ? aw2 : (bw2.t > aw2.t ? bw2 : aw2);
    var an = {}, has = false;
    for (k in a.annex || {}) { an[k] = a.annex[k]; has = true; }
    for (k in b.annex || {}) { an[k] = an[k] ? Math.min(an[k], b.annex[k]) : b.annex[k]; has = true; }
    if (has) out.annex = an;
    var wa = a.wanted || {}, wb = b.wanted || {}, wo = {};
    has = false;
    for (k in wa) { wo[k] = wa[k]; has = true; }
    for (k in wb) {
      var x = wo[k], y = wb[k];
      if (!x || y[0] > x[0] || (y[0] === x[0] && (y[3] > x[3] || (!y[3] && !x[3] && y[1] > x[1])))) wo[k] = y;
      has = true;
    }
    if (has) out.wanted = wo;
    return out;
  });

  // ---------- romaji sang kana ----------
  var ROMA = {
    a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
    ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ', ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
    sa: 'さ', si: 'し', shi: 'し', su: 'す', se: 'せ', so: 'そ', za: 'ざ', zi: 'じ', ji: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
    ta: 'た', ti: 'ち', chi: 'ち', tu: 'つ', tsu: 'つ', te: 'て', to: 'と', da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
    na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の', ha: 'は', hi: 'ひ', hu: 'ふ', fu: 'ふ', he: 'へ', ho: 'ほ',
    ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ', pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
    ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も', ya: 'や', yu: 'ゆ', yo: 'よ',
    ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ', la: 'ら', li: 'り', lu: 'る', le: 'れ', lo: 'ろ',
    wa: 'わ', wo: 'を', "n'": 'ん', xn: 'ん',
    kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ', gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
    sha: 'しゃ', shu: 'しゅ', sho: 'しょ', she: 'しぇ', sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
    ja: 'じゃ', ju: 'じゅ', jo: 'じょ', je: 'じぇ', jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ', zya: 'じゃ', zyu: 'じゅ', zyo: 'じょ',
    cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ', che: 'ちぇ', tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ', cya: 'ちゃ', cyu: 'ちゅ', cyo: 'ちょ',
    nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ', hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ', bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
    pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ', mya: 'みゃ', myu: 'みゅ', myo: 'みょ', rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
    fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ', thi: 'てぃ', dhi: 'でぃ', vu: 'ゔ', va: 'ゔぁ', vi: 'ゔぃ', ve: 'ゔぇ', vo: 'ゔぉ',
    xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ', xtu: 'っ', xtsu: 'っ', xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ', '-': 'ー'
  };
  function toKana(s, final) {
    var out = '', i = 0;
    s = s.toLowerCase();
    while (i < s.length) {
      var c = s.charAt(i), hit = '';
      if (!/[a-z'\-]/.test(c)) { out += c; i++; continue; }
      var nx = s.charAt(i + 1), nx2 = s.charAt(i + 2);
      // "nn" la ん, nhung "nni" la ん + に (konnichiha); khi dang go, giu "nn" cuoi chuoi cho chu sau quyet dinh
      if (c === 'n' && nx === 'n') {
        if (!nx2 && !final) { out += s.substr(i); break; }
        out += 'ん'; i += /[aiueoy]/.test(nx2) ? 1 : 2; continue;
      }
      if (c === 't' && nx === 'c' && nx2 === 'h') { out += 'っ'; i++; continue; }
      for (var len = 4; len >= 1 && !hit; len--) if (ROMA.hasOwnProperty(s.substr(i, len))) hit = s.substr(i, len);
      if (hit) { out += ROMA[hit]; i += hit.length; continue; }
      if (c === 'n' && nx && !/[aiueoyn']/.test(nx)) { out += 'ん'; i++; continue; }
      if (c === 'n' && !nx && final) { out += 'ん'; i++; continue; }
      if (c !== 'n' && /[bcdfghjkmpqrstvwxyz]/.test(c) && nx === c) { out += 'っ'; i++; continue; }
      out += s.substr(i); break;
    }
    return out;
  }
  var VOWEL = { a: 'あかがさざただなはばぱまやらわぁゃ', i: 'いきぎしじちぢにひびぴみりぃ', u: 'うくぐすずつづぬふぶぷむゆるぅゅゔ', e: 'えけげせぜてでねへべぺめれぇ', o: 'おこごそぞとどのほぼぽもよろをぉょ' };
  function vowelOf(c) { for (var v in VOWEL) if (VOWEL[v].indexOf(c) >= 0) return v; return ''; }
  function strictKey(s) {
    s = window.Speech.norm(String(s).replace(/～/g, ''));
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === 'ー') c = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' }[vowelOf(out.charAt(out.length - 1))] || '';
      out += c;
    }
    return out;
  }
  // Chao hoi viet は doc "wa" (こんにちは): go "wa" cung tinh dung
  function matches(input, w) {
    var a = strictKey(input), b = strictKey(w[1]);
    return a === b || (w[3] === 'exp' && a === b.replace(/は$/, 'わ'));
  }
  // Bo っ va nguyen am keo dai de nhan ra loi "gan dung" (thieu truong am, thieu っ)
  function looseKey(s) {
    s = strictKey(s).replace(/っ/g, '');
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i), pv = vowelOf(out.charAt(out.length - 1));
      var pure = 'あいうえお'.indexOf(c) >= 0 ? 'aiueo'.charAt('あいうえお'.indexOf(c)) : '';
      if (pure && pv && (pure === pv || (pure === 'u' && pv === 'o') || (pure === 'i' && pv === 'e'))) continue;
      out += c;
    }
    return out;
  }

  // ---------- noi dung theo ngon ngu ----------
  function mean(w) { return App.isEn() ? w[5] : w[4]; }
  function exTr(w) { return App.isEn() ? w[8] : w[7]; }
  function rankName(s) { return s ? App.L(RANKS[s]) : T('Chưa tiếp kiến', 'Not met yet'); }
  function sess(n) { return T('Buổi ', 'Session ') + n; }
  function region(n) { return REGIONS[n - 1]; }
  function regionName(n) { var r = region(n); return App.isEn() ? r[7] : r[2] + ' (' + r[7] + ')'; }
  function topic(n) { return region(n)[App.isEn() ? 4 : 3]; }
  function link(rest) { return '#/vocab' + (rest ? '/' + rest : ''); }
  function wlink(w) { return link('n5/' + sessionOf(w) + '/w/' + D().words.indexOf(w)); }
  function ruby(ex, w) {
    var target = w[0].replace(/～/g, ''), stem = /^(v1|v2|adj-i)$/.test(w[3]) && target.length > 1 ? target.slice(0, -1) : target;
    return h(ex).replace(/\{([^|}]+)\|([^}]+)\}/g, function (m, base, rt) {
      var hit = base.indexOf(stem) >= 0 || stem.indexOf(base) >= 0;
      return '<ruby' + (hit ? ' class="tw"' : '') + '>' + base + '<rt>' + rt + '</rt></ruby>';
    });
  }
  function plainEx(ex) { return ex.replace(/\{([^|}]+)\|[^}]+\}/g, '$1'); }
  function wordGlyph(w) {
    var out = '';
    for (var i = 0; i < w[0].length; i++) {
      var c = w[0].charAt(i), k = KANJI.kanji[c];
      if (k) {
        var si = 0;
        for (var j = 0; j < KANJI.sessions.length; j++) if (KANJI.sessions[j].indexOf(c) >= 0) si = j + 1;
        out += '<a class="kj' + (App.isKnown(c) ? ' known' : '') + '" href="#/kanji/n5/' + si + '/list/' + encodeURIComponent(c) + '">' + c + '</a>';
      } else out += h(c);
    }
    return '<span lang="ja" class="jp">' + out + '</span>';
  }
  function tagChips(w) {
    var out = '', list = w[9].split(' ');
    for (var i = 0; i < list.length; i++) {
      if (!list[i]) continue;
      var parts = list[i].split('='), t = TAGS[parts[0]];
      if (!t) continue;
      out += '<span class="vtag">' + t[0] + ' ' + T(t[1], t[2]) + (parts[1] ? ' · ' + jp(parts[1]) : '') + '</span>';
    }
    return out;
  }
  function rankBadge(s) { return '<span class="vrank r' + s + '">' + h(rankName(s)) + '</span>'; }
  function exButton(w) { return '<button class="icon-btn vex" data-act="vSayEx" data-k="' + h(wkey(w)) + '" title="' + T('Nghe câu', 'Play sentence') + '">▶</button>'; }

  // ---------- man hinh ----------
  function summaryCard() {
    var due = besieged().length, queued = Math.max(0, dueList().length - due), left = newLeft(), open = firstOpenSession(), nd = nextDue();
    var wait = !due && nd ? T('Lần triều kiến tới: ', 'Next audience: ') + new Date(nd).toLocaleString() : '';
    var notes = (truceOn() ? '<p class="note center vtruce">' + T('Thái phó: "Bệ hạ hồi cung! Mấy ngày đầu, mỗi đợt Vong quân chỉ ' + TRUCE_WAVE + ' tên."',
      'Tutor: "Welcome back, Your Majesty! For the first days, each Oblivion wave has only ' + TRUCE_WAVE + ' soldiers."') + '</p>' : '') +
      (queued ? '<p class="note center">' + T(queued + ' thần dân khác xếp hàng chờ đợt sau', queued + ' more subjects wait for the next wave') + '</p>' : '') +
      (wait ? '<p class="note center">' + h(wait) + '</p>' : '');
    return '<div class="card vsum"><div class="vsum-stats">' +
      '<span><b>' + Object.keys(V().w).length + '</b><small>' + T('thần dân', 'subjects') + '</small></span>' +
      '<span><b>' + due + '</b><small>' + (mapOpen() ? T('bị Vong quân vây', 'besieged') : T('chờ triều kiến', 'awaiting audience')) + '</small></span>' +
      '<span><b>' + left + '</b><small>' + T('từ mới còn hôm nay', 'new words left today') + '</small></span></div>' +
      '<div class="row">' +
      (due ? '<a class="btn primary" href="' + link('review') + '">' + T('Triều kiến', 'Hold audience') + ' (' + due + ')</a>' : '') +
      (left && open ? '<a class="btn' + (due ? '' : ' primary') + '" href="' + link('n5/' + open + '/learn') + '">' + T('Tiếp kiến thần dân mới', 'Meet new subjects') + '</a>' : '') +
      '</div>' + notes + '</div>';
  }
  function bossCard() {
    var b = App.king && App.king.boss ? App.king.boss() : null;
    if (!b || !mapOpen()) return '';
    var hp = Math.max(0, b.hp - b.dmg);
    return '<div class="card vboss' + (b.down ? ' down' : '') + '">' + jp(b.kanji, 'vboss-k') + '<span class="body"><small>' + T('Vong tướng tuần này', 'This week\'s Oblivion General') + '</small>' +
      '<b>' + h(App.L(b.name)) + '</b><div class="bar vhp"><i style="width:' + Math.round(hp * 100 / b.hp) + '%"></i></div>' +
      '<small>' + (b.down ? T('Đã bị hạ · +100 Uy vọng', 'Defeated · +100 Prestige')
        : T('Máu ' + hp + '/' + b.hp + ' · mỗi câu Triều kiến đúng là một đòn · còn ' + b.daysLeft + ' ngày',
          'HP ' + hp + '/' + b.hp + ' · each correct audience answer is a blow · ' + b.daysLeft + ' days left')) + '</small></span>' +
      (b.down ? '<span class="seal r2 vboss-stamp"><span class="jp" lang="ja">討</span></span>' : '') + '</div>';
  }

  // Bac 5 (Binh si) tro len tinh la vung da vung; bac 9 la Trung than dien
  function landState(n) {
    var ids = D().sessions[n - 1], got = 0, sol = 0, burned = 0;
    for (var i = 0; i < ids.length; i++) {
      var r = rec(D().words[ids[i]]);
      if (!r) continue;
      got++;
      if (r[0] >= 5) sol++;
      if (r[0] >= BURNED) burned++;
    }
    // Da sap nhap thi giu nguyen du sau nay co tu bi ha bac
    var kept = V().annex && V().annex[n];
    var st = !got ? 'wild' : got < ids.length ? 'war' : burned === ids.length ? 'peace' : (kept || sol >= 0.9 * ids.length) ? 'annex' : 'held';
    return { st: st, got: got, total: ids.length, due: besieged(ids).length };
  }
  function mapOpen() { return !App.king || App.king.rankOf(App.king.totalXp()) >= MAP_RANK; }
  function stateChip(st) { return '<span class="vstate st-' + st + '">' + h(App.L(STATES[st])) + '</span>'; }
  function mapCard(lands) {
    if (!window.VocabMap) return '';
    var open = mapOpen(), list = [];
    for (var i = 0; i < lands.length; i++) list.push({ st: lands[i].st, due: lands[i].due, kanji: region(i + 1)[0], name: App.isEn() ? region(i + 1)[7] : region(i + 1)[2] });
    if (mapSel && !open) mapSel = 0;
    var info;
    if (mapSel) {
      var L = lands[mapSel - 1], r = region(mapSel);
      info = '<div class="vmap-info"><button class="icon-btn vmap-x" data-act="vMapClose" title="' + T('Đóng', 'Close') + '">✕</button>' +
        '<p class="vmi-head">' + jp(r[0], 'vmi-k') + '<b>' + h(App.isEn() ? r[7] : r[2]) + '</b> <small>' + jp(r[1]) + ' · ' + r[7] + '</small></p>' +
        '<p>' + stateChip(L.st) + ' <small class="muted">' + L.got + '/' + L.total + T(' thần dân', ' subjects') + (L.due ? ' · ' + L.due + T(' bị Vong quân vây', ' besieged') : '') + '</small></p>' +
        '<p class="vmi-story">' + h(r[App.isEn() ? 6 : 5]) + '</p>' +
        '<a class="btn primary" href="' + link('n5/' + mapSel) + '">' + sess(mapSel) + ' · ' + h(topic(mapSel)) + ' →</a></div>';
    } else {
      info = '<div class="vmap-info vmap-key">';
      for (var k in STATES) info += stateChip(k);
      info += '<span class="vstate st-siege">' + T('敵 Bị Vong quân vây', '敵 Besieged by Oblivion') + '</span><p class="muted">' + T('Chạm vào một vùng để xem.', 'Tap a land to see it.') + '</p></div>';
    }
    var ctl = '<div class="vmap-ctl"><button class="icon-btn" data-act="vZoom" data-z="1.6" title="' + T('Phóng to', 'Zoom in') + '">+</button>' +
      '<button class="icon-btn" data-act="vZoom" data-z="0.625" title="' + T('Thu nhỏ', 'Zoom out') + '">−</button>' +
      '<button class="icon-btn" data-act="vZoomReset" title="' + T('Toàn cảnh', 'Whole map') + '">⤢</button></div>';
    if (!open) {
      return '<div class="card vmapcard locked"><div class="vmap-box">' + window.VocabMap.svg(list, { locked: true }) +
        '<div class="vmap-lock">' + jp('🔒') + '<b>' + T('Đăng quang Tân vương để mở bản đồ vương quốc', 'Be crowned New King to open the map of your realm') + '</b></div></div></div>';
    }
    var rl = App.king && App.king.realm ? App.king.realm() : null;
    return '<div class="card vmapcard"><h3>' + T('BẢN ĐỒ VƯƠNG QUỐC', 'MAP OF THE REALM') + '</h3>' +
      (rl ? '<p class="vrealm">' + jp(rl.kanji) + ' <b>' + h(rl.name) + '</b> <small class="muted">' + rl.n + '/' + lands.length + T(' vùng sáp nhập', ' lands annexed') +
        (rl.next ? T(' · ' + rl.next + ' vùng để lên bậc', ' · ' + rl.next + ' for the next title') : '') + '</small></p>' : '') + '<div class="vmap-box">' +
      window.VocabMap.svg(list, { sel: mapSel }) + ctl + '</div>' + info + '</div>';
  }

  function extraCards() {
    var nw = wantedList().length, open = 0;
    for (var i = 0; i < GAMES.length; i++) if (!gameLock(GAMES[i][0])) open++;
    return '<div class="rows vextra">' +
      '<a class="card mode" href="' + link('wanted') + '">' + jp('捕', 'glyph') + '<span class="body"><b>' + T('Bảng truy nã', 'Wanted board') + '</b><small>' +
      (nw ? T(nw + ' thần dân hay quên đang bị truy nã', nw + ' forgetful subjects are wanted') : T('Chưa ai bị truy nã', 'No one is wanted')) + '</small></span><i>→</i></a>' +
      '<a class="card mode" href="' + link('games') + '">' + jp('遊', 'glyph') + '<span class="body"><b>' + T('Trò chơi nhỏ', 'Mini games') + '</b><small>' +
      open + '/' + GAMES.length + T(' trò đã mở', ' games open') + '</small></span><i>→</i></a></div>';
  }

  // ---------- bang truy na ----------
  function hitMarks(n) { var s = ''; for (var i = 0; i < 3; i++) s += '<i class="' + (i < n ? 'on' : '') + '">★</i>'; return '<span class="vp-hits">' + s + '</span>'; }
  function huntable() {
    var today = dayStart(), b = board(), all = wantedList(), out = [];
    for (var i = 0; i < all.length; i++) if (b[wkey(all[i])][2] !== today) out.push(all[i]);
    return out;
  }
  function viewBoard() {
    var list = wantedList(), b = board(), cards = '', caught = 0, k;
    for (k in b) if (b[k][3]) caught++;
    list.sort(function (x, y) { return rec(y)[2] - rec(x)[2]; });
    for (var i = 0; i < list.length; i++) {
      var w = list[i], e = b[wkey(w)];
      cards += '<a class="card vposter" href="' + wlink(w) + '"><span class="vp-head">' + jp('手配') + '</span><span class="vp-word' + (w[0].length > 4 ? ' long' : '') + '">' + jp(w[0]) + '</span>' +
        (w[0] !== w[1] ? '<span class="vp-read">' + jp(w[1]) + '</span>' : '') + '<span class="vp-mean">' + h(mean(w)) + '</span>' +
        '<span class="vp-meta">' + T('Sai ', 'Missed ') + rec(w)[2] + T(' lần · ', ' times · ') + hitMarks(e[1]) + '</span>' +
        (w[10] && !App.isEn() ? '<span class="vp-tip">' + h(w[10]) + '</span>' : '') + '</a>';
    }
    var can = huntable().length;
    return '<div class="hero">' + jp('手配', 'eyebrow') + '<h1>' + T('Bảng truy nã', 'Wanted board') + '</h1><p class="sub">' +
      T('Thần dân sai từ 4 lần bị dán lên đây. Đúng 3 ngày liền thì bắt được.', 'Subjects missed 4 times are posted here. Get them right on 3 days in a row to catch them.') + '</p></div>' +
      (list.length ? '<div class="row"><a class="btn primary' + (can ? '' : ' off') + '" href="' + link('wanted/hunt') + '">' + T('Truy bắt', 'Hunt them') + ' (' + can + ')</a></div>' +
        (can ? '' : '<p class="note center">' + T('Hôm nay đã truy bắt hết, mai đuổi tiếp.', 'You have chased everyone today. More tomorrow.') + '</p>') +
        '<p class="note center">' + T('Trong Triều kiến, kẻ bị truy nã là gián điệp của Vong quân: trả lời đúng gây gấp đôi sát thương lên Vong tướng.', 'In audiences, wanted subjects are Oblivion spies: a right answer hits the general twice as hard.') + '</p>' +
        '<div class="grid vposters">' + cards + '</div>'
        : '<div class="card narrow center"><p>' + T('Bảng đang trống. Thần dân nào sai từ 4 lần sẽ bị dán lên đây.', 'The board is empty. Anyone you miss 4 times will be posted here.') + '</p></div>') +
      (caught ? '<p class="note center">' + T('Đã bắt được ' + caught + ' kẻ.', caught + ' caught so far.') + '</p>' : '');
  }
  function startHunt() {
    var list = shuffle(huntable()).slice(0, 10);
    hunt = { list: list, quiz: list.length ? makeQuestions(list) : null, result: null };
  }
  function viewHunt() {
    if (!hunt) startHunt();
    var head = '<div class="hero slim"><p class="eyebrow">' + T('Truy bắt', 'Manhunt') + '</p></div>', back = '<div class="row"><a class="btn" href="' + link('wanted') + '">' + T('Về Bảng truy nã', 'Back to the board') + '</a></div>';
    if (!hunt.quiz) return head + '<div class="card narrow center"><p>' + (wantedList().length ? T('Hôm nay đã truy bắt hết, mai đuổi tiếp.', 'You have chased everyone today. More tomorrow.') : T('Bảng truy nã đang trống.', 'The wanted board is empty.')) + '</p></div>' + back;
    if (hunt.result) {
      var rows = '', got = 0;
      for (var i = 0; i < hunt.result.length; i++) {
        var x = hunt.result[i], e = board()[wkey(x.w)];
        if (e[3]) got++;
        rows += '<a class="vres-row ' + (x.ok ? 'good' : 'bad') + '" href="' + wlink(x.w) + '">' + jp(x.w[0]) + '<span>' + h(mean(x.w)) + '</span>' +
          (e[3] ? '<span class="vcaught">' + jp('捕') + ' ' + T('Bắt được!', 'Caught!') + '</span>' : hitMarks(e[1])) + '</a>';
      }
      return head + '<div class="hero"><h1>' + (got ? T('Bắt được ' + got + ' kẻ!', got + ' caught!') : T('Đã truy đuổi', 'The chase is on')) + '</h1><p class="sub">' +
        T('Mỗi kẻ cần đúng 3 ngày liền. Sai thì đếm lại từ đầu.', 'Each needs 3 right days in a row. A miss starts the count again.') + '</p></div>' +
        '<div class="card narrow vres-list">' + rows + '</div>' + back;
    }
    return head + viewQuestion(hunt.quiz);
  }

  // ---------- tro choi nho ----------
  function gameDef(id) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i][0] === id) return GAMES[i]; return null; }
  function isSu(w) { return (' ' + w[9] + ' ').indexOf(' su ') >= 0; }
  function gameLock(id) {
    var n;
    if (id === 'envoy') { n = countLearned(D().sessions[11]); return n >= 10 ? '' : T('Tiếp kiến 10 thần dân ở Trường Kỳ (' + n + '/10)', 'Meet 10 subjects in Nagasaki (' + n + '/10)'); }
    if (id === 'treasury') { var s = D().sessions[1]; n = countLearned(s); return n === s.length ? '' : T('Tiếp kiến hết thần dân Cửu Châu (' + n + '/' + s.length + ')', 'Meet everyone in Kyūshū (' + n + '/' + s.length + ')'); }
    n = Object.keys(V().w).length;
    return n >= 12 ? '' : T('Tiếp kiến 12 thần dân (' + n + '/12)', 'Meet 12 subjects (' + n + '/12)');
  }
  function viewGames() {
    var cards = '';
    for (var i = 0; i < GAMES.length; i++) {
      var g = GAMES[i], lock = gameLock(g[0]);
      cards += lock ? '<span class="card mode off">' + jp(g[1], 'glyph') + '<span class="body"><b>' + h(App.L(g[2])) + '</b><small>' + h(App.L(g[3])) + '</small><small>🔒 ' + h(lock) + '</small></span></span>'
        : '<a class="card mode" href="' + link('games/' + g[0]) + '">' + jp(g[1], 'glyph') + '<span class="body"><b>' + h(App.L(g[2])) + '</b><small>' + h(App.L(g[3])) + '</small></span><i>→</i></a>';
    }
    return '<div class="hero">' + jp('遊', 'eyebrow') + '<h1>' + T('Trò chơi nhỏ', 'Mini games') + '</h1><p class="sub">' +
      T('Mỗi lượt +5 Uy vọng, tối đa 10 lượt mỗi ngày. Không ảnh hưởng lịch ôn.', '+5 Prestige per round, up to 10 rounds a day. Your review schedule is not affected.') + '</p></div><div class="rows narrow">' + cards + '</div>';
  }
  function gloss(w) { return w[5].split(';')[0].replace(/\s*\([^)]*\)/g, '').trim(); }
  function startEnvoy() {
    var su = D().words.filter(isSu), pool = su.filter(function (w) { return !!rec(w); });
    var qs = shuffle(pool).slice(0, 10).map(function (w) {
      var opts = [w], used = {}, others = shuffle(su), k2e = Math.random() < 0.5;
      used[gloss(w)] = 1;
      for (var i = 0; i < others.length && opts.length < 4; i++) {
        if (used[gloss(others[i])]) continue;
        used[gloss(others[i])] = 1; opts.push(others[i]);
      }
      opts = shuffle(opts);
      return {
        prompt: k2e ? jp(w[0]) : '<span class="vgloss">' + h(gloss(w)) + '</span>',
        ask: k2e ? T('Từ tiếng Anh gốc là gì?', 'Which English word is it from?') : T('Viết bằng katakana thế nào?', 'How is it written in katakana?'),
        opts: opts.map(function (o) { return k2e ? h(gloss(o)) : jp(o[0]); }), ans: opts.indexOf(w), say: w[1],
        after: say(w[0]) + ' · ' + h(gloss(w)) + (App.isEn() ? '' : ' · ' + h(w[4]))
      };
    });
    game = { id: 'envoy', qs: qs, i: 0, picked: -1, right: 0, total: qs.length, miss: 0, t0: Date.now(), done: false };
  }
  function readingOpts(c, n) {
    var C = COUNTERS[c], right = C[2][n], seen = {}, cand = [], i;
    seen[right] = 1;
    for (i = 0; i < C[3].length; i++) [NUM_R[n] + C[3][i], NUM_G[n] + C[3][i]].forEach(function (x) { if (!seen[x]) { seen[x] = 1; cand.push(x); } });
    cand = shuffle(cand).slice(0, 3);
    var near = shuffle([n - 1, n + 1, n + 2, n - 2]);
    for (i = 0; i < near.length && cand.length < 3; i++) if (near[i] >= 0 && near[i] < 10 && !seen[C[2][near[i]]]) { seen[C[2][near[i]]] = 1; cand.push(C[2][near[i]]); }
    return shuffle([right].concat(cand));
  }
  function startTreasury() {
    var objs = shuffle(COUNT_OBJ).slice(0, 10), qs = [];
    for (var i = 0; i < objs.length; i++) {
      var w = wordOf(objs[i][0] + '|' + objs[i][0]) || D().words.filter(function (x) { return x[0] === objs[i][0]; })[0], c = objs[i][1], n = Math.floor(Math.random() * 10);
      if (!w) continue;
      var item = w[0] + (w[0] !== w[1] ? ' (' + w[1] + ')' : ''), num = NUM_K.charAt(n) + c, rd = COUNTERS[c][2][n];
      var after = jp(w[0]) + ' ' + say(num, '', rd) + ' · ' + jp(rd) + ' · ' + h(App.L([COUNTERS[c][0], COUNTERS[c][1]]));
      if (i % 2 === 0) {
        var cs = shuffle(Object.keys(COUNTERS).filter(function (x) { return x !== c; })).slice(0, 3).concat([c]);
        cs = shuffle(cs);
        qs.push({ prompt: jp(item), ask: h(mean(w)) + ' · ' + T('Đếm bằng đơn vị nào?', 'Which counter?'), say: rd, after: after, ans: cs.indexOf(c),
          opts: cs.map(function (x) { return jp(x) + '<small>' + h(App.L([COUNTERS[x][0], COUNTERS[x][1]])) + '</small>'; }) });
      } else {
        var ro = readingOpts(c, n);
        qs.push({ prompt: jp(w[0]) + ' ' + jp(num), ask: h(mean(w)) + ' · ' + T('Đọc thế nào?', 'How is it read?'), say: rd, after: after, ans: ro.indexOf(rd),
          opts: ro.map(function (x) { return jp(x); }) });
      }
    }
    game = { id: 'treasury', qs: qs, i: 0, picked: -1, right: 0, total: qs.length, miss: 0, t0: Date.now(), done: false };
  }
  function startFeast() {
    var learned = shuffle(D().words.filter(function (w) { return !!rec(w); })), used = {}, pick = [], cards = [], i;
    for (i = 0; i < learned.length && pick.length < 6; i++) {
      if (used[mean(learned[i])] || used[learned[i][0]]) continue;
      used[mean(learned[i])] = 1; used[learned[i][0]] = 1; pick.push(learned[i]);
    }
    for (i = 0; i < pick.length; i++) cards.push({ p: i, t: 'w' }, { p: i, t: 'm' });
    game = { id: 'feast', words: pick, cards: shuffle(cards), sel: -1, got: {}, bad: null, right: 0, total: pick.length, miss: 0, t0: 0, done: false };
  }
  function endGame() {
    game.done = true;
    game.ms = Date.now() - game.t0;
    App.emit('game:end', { g: game.id, right: game.right, total: game.total, miss: game.miss, ms: game.ms });
    App.saveProgress();
  }
  function viewGameEnd() {
    var g = game, perfect = g.right === g.total && !g.miss;
    var sub = g.id === 'feast' ? T(Math.round(g.ms / 1000) + ' giây · ghép sai ' + g.miss + ' lần', Math.round(g.ms / 1000) + ' seconds · ' + g.miss + ' misses')
      : T('câu đúng', 'correct');
    return '<div class="hero"><h1>' + (g.id === 'feast' ? '🍶 ' + g.right + '/' + g.total : g.right + '/' + g.total) + '</h1><p class="sub">' + sub + '</p>' +
      (perfect ? '<p class="vrepel">' + T('Hoàn hảo!', 'Perfect!') + '</p>' : '') + '</div>' +
      '<div class="row"><button class="btn primary" data-act="vgAgain">' + T('Chơi lại', 'Play again') + '</button><a class="btn" href="' + link('games') + '">' + T('Về trò chơi', 'All games') + '</a></div>';
  }
  function viewChoice() {
    var it = game.qs[game.i], answered = game.picked >= 0, html = '';
    html += '<p class="eyebrow center">' + T('Câu ', 'Question ') + (game.i + 1) + '/' + game.qs.length + '</p>' + bar(game.i, game.qs.length) +
      '<div class="card prompt"><div class="mid">' + it.prompt + '</div><div class="muted">' + it.ask + '</div></div><div class="opts vgopts">';
    for (var i = 0; i < it.opts.length; i++) {
      var cls = 'opt';
      if (answered && i === it.ans) cls += ' right';
      else if (answered && i === game.picked) cls += ' wrong';
      html += '<button class="' + cls + '" data-act="vgPick" data-i="' + i + '"' + (answered ? ' disabled' : '') + '>' + it.opts[i] + '</button>';
    }
    html += '</div>';
    if (answered) html += '<p class="center">' + it.after + '</p><div class="row"><button class="btn primary" id="vNext" data-act="vgNext">' +
      (game.i === game.qs.length - 1 ? T('Xong', 'Finish') : T('Câu tiếp', 'Next')) + '</button></div>';
    return '<div class="quiz">' + html + '</div>';
  }
  function viewFeast() {
    var html = '<p class="center muted">' + T('Chạm một từ rồi chạm nghĩa của nó. Ghép sai: ', 'Tap a word, then its meaning. Misses: ') + game.miss + '</p><div class="vfeast">';
    for (var i = 0; i < game.cards.length; i++) {
      var c = game.cards[i], w = game.words[c.p], label = c.t === 'w' ? jp(w[0]) : h(mean(w));
      if (game.got[c.p]) { html += '<span class="vcard done ' + c.t + '">' + label + '</span>'; continue; }
      html += '<button class="vcard ' + c.t + (game.sel === i ? ' sel' : '') + (game.bad && game.bad.indexOf(i) >= 0 ? ' bad' : '') + '" data-act="vfTap" data-i="' + i + '">' + label + '</button>';
    }
    return '<div class="narrow">' + html + '</div></div>';
  }
  function viewGame(id) {
    var g = gameDef(id), lock = gameLock(id), head = '<div class="hero slim"><p class="eyebrow">' + jp(g[1]) + ' ' + h(App.L(g[2])) + '</p></div>';
    if (lock) return head + '<div class="card narrow center"><p>🔒 ' + h(lock) + '</p></div>';
    if (!game || game.id !== id) { if (id === 'envoy') startEnvoy(); else if (id === 'treasury') startTreasury(); else startFeast(); }
    if (game.done) return head + viewGameEnd();
    return head + (id === 'feast' ? viewFeast() : viewChoice());
  }

  function viewLevel() {
    var d = D(), lands = [], i;
    for (i = 0; i < d.sessions.length; i++) lands.push(landState(i + 1));
    var html = '<div class="hero">' + jp('語彙', 'eyebrow') + '<h1>' + T('Từ vựng N5', 'N5 Vocabulary') + '</h1><p class="sub">' +
      d.sessions.length + T(' vùng đất · ', ' lands · ') + d.words.length + T(' thần dân', ' subjects') + '</p></div>' + summaryCard() + mapCard(lands) + bossCard() + extraCards() +
      '<h3 class="heading">' + T('CÁC VÙNG ĐẤT', 'THE LANDS') + '</h3><div class="rows">';
    for (i = 0; i < d.sessions.length; i++) {
      var s = d.sessions[i], n = i + 1, L = lands[i];
      html += '<a class="card rowcard vland" href="' + link('n5/' + n) + '"><span class="no vno">' + jp(region(n)[0], 'vreg' + (region(n)[0].length > 2 ? ' long' : '')) + '</span>' +
        '<span class="body"><b>' + sess(n) + ' · ' + h(regionName(n)) + '</b><small class="muted">' + h(topic(n)) + '</small>' +
        '<small class="vstory">' + h(region(n)[App.isEn() ? 6 : 5]) + '</small>' + bar(L.got, s.length) + '</span>' +
        '<span class="meta"><b>' + L.got + '/' + s.length + '</b>' + stateChip(L.st) + '<small>' + (L.due ? L.due + T(' chờ ôn', ' due') : '&nbsp;') + '</small></span></a>';
    }
    return html + '</div>';
  }

  function viewSession(n) {
    var s = D().sessions[n - 1], r = region(n), due = besieged(s).length, left = Math.min(newLeft(), unlearned(s).length);
    function mode(path, glyph, name, note, off) {
      return off ? '<span class="card mode off">' + jp(glyph, 'glyph') + '<span class="body"><b>' + name + '</b><small>' + note + '</small></span></span>'
        : '<a class="card mode" href="' + link('n5/' + n + '/' + path) + '">' + jp(glyph, 'glyph') + '<span class="body"><b>' + name + '</b><small>' + note + '</small></span><i>→</i></a>';
    }
    var learnNote = !unlearned(s).length ? T('Đã tiếp kiến hết thần dân vùng này', 'You have met everyone here')
      : !left ? T('Hết hạn mức từ mới hôm nay', 'Daily new-word limit reached') : T('Học ' + Math.min(BATCH, left) + ' từ mới', 'Learn ' + Math.min(BATCH, left) + ' new words');
    return '<div class="hero"><p class="eyebrow">' + sess(n) + ' · ' + h(topic(n)) + '</p><h1>' + jp(r[0]) + ' ' + h(App.isEn() ? '' : r[2]) + '</h1>' +
      '<p class="sub">' + jp(r[1]) + ' · ' + r[7] + ' · ' + countLearned(s) + '/' + s.length + T(' thần dân', ' subjects') + '</p></div>' +
      '<div class="card story narrow"><h3>' + T('VÙNG ĐẤT', 'THE LAND') + '</h3><p>' + h(r[App.isEn() ? 6 : 5]) + '</p></div>' +
      '<div class="rows narrow">' +
      mode('list', '覧', T('Danh sách', 'List'), T('Hồ sơ từng thần dân', 'Every subject\'s profile')) +
      mode('learn', '謁', T('Tiếp kiến', 'Meet'), learnNote, !left) +
      mode('review', '朝', T('Triều kiến', 'Audience'), due ? due + T(' thần dân chờ ôn', ' subjects due') : T('Chưa có ai đến hạn', 'No one is due yet'), !due) +
      '</div>';
  }

  function wordCard(w, n) {
    var st = stage(w);
    return '<a class="card word vword' + (st ? ' met' : '') + '" href="' + link('n5/' + n + '/w/' + D().words.indexOf(w)) + '">' +
      '<div class="top">' + jp(w[0], 'w') + (w[0] !== w[1] ? jp(w[1], 'r') : '') + '</div>' +
      '<div class="bottom"><b>' + h(App.isEn() ? '' : w[2]) + '</b><span>' + h(mean(w)) + '</span></div>' +
      (st ? rankBadge(st) : '') + '</a>';
  }
  function viewList(n) {
    var s = D().sessions[n - 1], cards = '';
    for (var i = 0; i < s.length; i++) cards += wordCard(D().words[s[i]], n);
    return '<div class="hero"><p class="eyebrow">' + sess(n) + ' · ' + h(regionName(n)) + '</p><h1>' + T('Danh sách', 'List') + '</h1><p class="sub">' + s.length + T(' thần dân', ' subjects') + '</p></div>' +
      '<div class="grid vocab">' + cards + '</div>';
  }

  function profile(w) {
    var st = stage(w), tip = w[10];
    var r = w[1].replace(/～/g, ''), btn = '<button class="icon-btn" data-say="' + h(r) + '" title="' + T('Nghe', 'Listen') + '">🔊</button>';
    return '<div class="card vprof"><div class="vhead"><div class="vword-big' + (w[0].length > 5 ? ' long' : '') + '">' + wordGlyph(w) + (w[0] === w[1] ? ' ' + btn : '') + '</div>' +
      (w[0] === w[1] ? '' : '<div class="vread">' + say(r, 'r') + ' ' + btn + '</div>') +
      (st ? rankBadge(st) : '') + '</div>' +
      '<div class="vmean">' + (w[2] && !App.isEn() ? '<b class="vhv">' + h(w[2]) + '</b>' : '') + '<span>' + h(mean(w)) + '</span>' +
      '<small class="muted">' + h(App.L(POS[w[3]] || [w[3], w[3]])) + '</small></div>' +
      '<div class="vtags">' + tagChips(w) + '</div>' +
      '<div class="vex-box">' + exButton(w) + '<div><p lang="ja" class="jp vexj">' + ruby(w[6], w) + '</p><p class="muted">' + h(exTr(w)) + '</p></div></div>' +
      (tip && !App.isEn() ? '<div class="vtip"><b>Mẹo của Thái phó</b><p>' + h(tip) + '</p></div>' : '') + '</div>';
  }

  function viewWord(n, idx) {
    var s = D().sessions[n - 1], w = D().words[idx], pos = s.indexOf(idx);
    if (!w || pos < 0) return null;
    function nav(j, label) {
      return j >= 0 && j < s.length ? '<a class="btn" href="' + link('n5/' + n + '/w/' + s[j]) + '">' + label + '</a>' : '<span class="btn" disabled>' + label + '</span>';
    }
    var r = rec(w), info = r && r[0] < BURNED ? '<p class="note center">' + T('Lần ôn tới: ', 'Next review: ') + new Date(r[1]).toLocaleString() + '</p>' : '';
    return profile(w) + info +
      '<div class="row">' + nav(pos - 1, T('‹ Từ trước', '‹ Previous')) + '<span class="pos">' + (pos + 1) + '/' + s.length + '</span>' + nav(pos + 1, T('Từ sau ›', 'Next ›')) + '</div>';
  }

  // ---------- tiep kien ----------
  function startLearn(n) {
    var list = unlearned(D().sessions[n - 1]).slice(0, Math.min(BATCH, newLeft()));
    learn = { n: n, list: list, i: 0, phase: list.length ? 'show' : 'none', quiz: null };
  }
  function viewLearn(n) {
    if (!learn || learn.n !== n) startLearn(n);
    var head = '<div class="hero slim"><p class="eyebrow">' + T('Tiếp kiến', 'Meet') + ' · ' + h(regionName(n)) + '</p></div>';
    if (learn.phase === 'none') {
      return head + '<div class="card narrow center"><p>' + (newLeft() ? T('Đã tiếp kiến hết thần dân vùng này.', 'You have met everyone in this land.') : T('Hôm nay đã đủ ' + dailyLimit() + ' thần dân mới. Mai Bệ hạ tiếp kiến tiếp nhé.', 'You have met ' + dailyLimit() + ' new subjects today. More tomorrow.')) + '</p></div>' +
        '<div class="row"><a class="btn primary" href="' + link('n5/' + n) + '">' + T('Về vùng đất', 'Back to the land') + '</a></div>';
    }
    if (learn.phase === 'show') {
      var w = learn.list[learn.i];
      return head + '<div class="narrow">' + bar(learn.i, learn.list.length) + '</div>' +
        '<p class="center muted">' + T('Thái phó: "Muôn tâu Bệ hạ, xin giới thiệu thần dân thứ ', 'Tutor: "Your Majesty, may I present subject no. ') + (learn.i + 1) + '/' + learn.list.length + '"</p>' +
        profile(w) + '<div class="row"><button class="btn primary" data-act="vLearnNext">' +
        (learn.i < learn.list.length - 1 ? T('Thần dân tiếp theo', 'Next subject') : T('Kiểm tra trước khi thu nhận', 'Quick check before enlisting')) + '</button></div>';
    }
    if (learn.phase === 'quiz') return head + viewQuestion(learn.quiz);
    return head + '<div class="hero"><h1>' + T('Đã thu nhận ', 'Enlisted ') + learn.list.length + T(' thần dân', ' subjects') + '</h1><p class="sub">' +
      T('Họ sẽ vào chầu lần đầu sau 4 giờ nữa.', 'Their first audience is in 4 hours.') + '</p></div>' +
      '<div class="row">' + (newLeft() && unlearned(D().sessions[n - 1]).length ? '<button class="btn primary" data-act="vLearnMore">' + T('Tiếp kiến thêm', 'Meet more') + '</button>' : '') +
      '<a class="btn" href="' + link('n5/' + n) + '">' + T('Về vùng đất', 'Back to the land') + '</a></div>';
  }

  // ---------- cau hoi (dung chung cho tiep kien va trieu kien) ----------
  function makeQuestions(list) {
    var qs = [];
    for (var i = 0; i < list.length; i++) {
      var w = list[i], hasKanji = w[0] !== w[1];
      qs.push({ w: w, type: hasKanji ? 'meaning' : (Math.random() < 0.5 ? 'listen' : 'meaning') });
      qs.push({ w: w, type: 'read' });
    }
    qs = shuffle(qs);
    for (i = 0; i < qs.length; i++) if (qs[i].type !== 'read') qs[i].opts = meaningOptions(qs[i].w);
    return { qs: qs, i: 0, picked: -1, typed: null, near: false, failed: {}, done: {}, right: 0, total: 0 };
  }
  function meaningOptions(w) {
    var all = D().words, same = [], other = [], used = {}, opts = [w];
    used[mean(w)] = 1;
    for (var i = 0; i < all.length; i++) (all[i][3] === w[3] ? same : other).push(all[i]);
    var pool = shuffle(same).concat(shuffle(other));
    for (i = 0; i < pool.length && opts.length < 4; i++) {
      if (used[mean(pool[i])]) continue;
      used[mean(pool[i])] = 1;
      opts.push(pool[i]);
    }
    return shuffle(opts);
  }
  function viewQuestion(q) {
    var item = q.qs[q.i], w = item.w, answered = q.picked >= 0 || q.typed !== null, html = '', i;
    var count = '<p class="eyebrow center">' + T('Câu ', 'Question ') + (q.i + 1) + '/' + q.qs.length + '</p>' + bar(q.i, q.qs.length) +
      (curMode === 'review' && isWanted(wkey(w)) ? '<p class="center"><span class="vspy">' + jp('手配') + ' ' + T('Gián điệp: đúng gây gấp đôi sát thương', 'Spy: a right answer hits twice as hard') + '</span></p>' : '');
    if (item.type === 'read') {
      var ok = q.typed !== null && matches(q.typed, w);
      html = w[0] === w[1]
        ? '<div class="card prompt"><div class="mid">' + h(mean(w)) + '</div><div class="muted">' + T('Gõ từ tiếng Nhật (romaji hoặc kana)', 'Type the Japanese word (romaji or kana)') + '</div></div>'
        : '<div class="card prompt"><div class="mid">' + jp(w[0]) + '</div><div class="muted">' + h(mean(w)) + ' · ' + T('Gõ cách đọc (romaji hoặc kana)', 'Type the reading (romaji or kana)') + '</div></div>';
      if (!answered) {
        html += '<form class="vtype" onsubmit="return false"><input id="vInput" class="field" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ja" data-input="vType"' +
          (q.near ? ' placeholder="' + T('Gần đúng rồi, gõ lại nhé', 'Almost, try again') + '"' : '') + '>' +
          '<button class="btn primary" data-act="vSubmit">' + T('Trả lời', 'Answer') + '</button></form>' +
          '<p class="center"><button class="btn small" data-act="vGiveUp">' + T('Không nhớ', 'I don\'t know') + '</button></p>';
      } else {
        html += '<p class="center vres ' + (ok ? 'good' : 'bad') + '">' + (ok ? '✓ ' : '✗ ' + (q.typed ? h(q.typed) + ' → ' : '')) + say(w[1].replace(/～/g, '')) + '</p>';
      }
    } else {
      var prompt = item.type === 'listen'
        ? '<button class="icon-btn big-say" data-say="' + h(w[1].replace(/～/g, '')) + '">🔊</button>'
        : jp(w[0], 'mid');
      html = '<div class="card prompt"><div>' + prompt + '</div><div class="muted">' + (item.type === 'listen' ? T('Nghe và chọn nghĩa', 'Listen and choose the meaning') : T('Chọn nghĩa đúng', 'Choose the meaning')) + '</div></div><div class="opts">';
      for (i = 0; i < item.opts.length; i++) {
        var cls = 'opt';
        if (answered && item.opts[i] === w) cls += ' right';
        else if (answered && i === q.picked) cls += ' wrong';
        html += '<button class="' + cls + '" data-act="vPick" data-i="' + i + '"' + (answered ? ' disabled' : '') + '>' + h(mean(item.opts[i])) + '</button>';
      }
      html += '</div>';
      if (answered) html += '<p class="center">' + say(w[0], '', w[1].replace(/～/g, '')) + (w[0] !== w[1] ? ' (' + say(w[1].replace(/～/g, '')) + ')' : '') + ' · ' + h(mean(w)) + '</p>';
    }
    if (answered) html += '<div class="row"><button class="btn primary" id="vNext" data-act="vNext">' + (q.i === q.qs.length - 1 ? T('Xong', 'Finish') : T('Câu tiếp', 'Next')) + '</button></div>';
    return '<div class="quiz">' + count + html + '</div>';
  }

  // ---------- trieu kien ----------
  function startReview(n) {
    var list = shuffle(besieged(n ? D().sessions[n - 1] : null)).slice(0, ROUND);
    review = { n: n || 0, list: list, quiz: list.length ? makeQuestions(list) : null, result: null, repelled: false };
  }
  function viewReview(n) {
    if (!review || review.n !== (n || 0)) startReview(n);
    var head = '<div class="hero slim"><p class="eyebrow">' + T('Triều kiến', 'Audience') + (n ? ' · ' + h(regionName(n)) : '') + '</p></div>';
    if (!review.quiz) {
      return head + '<div class="card narrow center"><p>' + T('Chưa có thần dân nào đến hạn vào chầu.', 'No subject is due for an audience.') + '</p></div>' +
        '<div class="row"><a class="btn primary" href="' + link(n ? 'n5/' + n : '') + '">' + T('Quay lại', 'Back') + '</a></div>';
    }
    if (review.result) {
      var up = 0, down = 0, rows = '';
      for (var i = 0; i < review.result.length; i++) {
        var x = review.result[i];
        if (x.ok) up++; else down++;
        rows += '<a class="vres-row ' + (x.ok ? 'good' : 'bad') + '" href="' + wlink(x.w) + '">' + jp(x.w[0]) + '<span>' + h(mean(x.w)) + '</span>' + rankBadge(stage(x.w)) + '</a>';
      }
      var more = besieged(n ? D().sessions[n - 1] : null).length;
      return head + '<div class="hero"><h1>' + up + '/' + review.result.length + '</h1><p class="sub">' +
        T(up + ' thần dân được thăng hàm, ' + down + ' cần ôn lại', up + ' promoted, ' + down + ' need more practice') + '</p>' +
        (review.repelled ? '<p class="vrepel">' + jp('守') + ' ' + T('Đã đẩy lui đợt Vong quân!', 'The Oblivion wave is repelled!') + '</p>' : '') + '</div>' +
        '<div class="card narrow vres-list">' + rows + '</div>' +
        '<div class="row">' + (more ? '<button class="btn primary" data-act="vReviewMore">' + (review.repelled ? T('Đánh đợt tiếp theo', 'Fight the next wave') : T('Triều kiến tiếp', 'Continue')) + ' (' + more + ')</button>' : '') +
        '<a class="btn" href="' + link(n ? 'n5/' + n : '') + '">' + T('Quay lại', 'Back') + '</a></div>';
    }
    return head + viewQuestion(review.quiz);
  }

  // ---------- dieu huong ----------
  function route(parts, changed) {
    if (!D()) return null;
    if (changed) {
      if (parts[2] !== 'learn' && learn && learn.phase !== 'quiz') learn = null;
      if (parts[parts.length - 1] !== 'review') review = null;
      hunt = null; game = null;
    }
    curMode = parts[parts.length - 1] || '';
    var home = { back: '', backLabel: T('Trang chủ', 'Home') };
    if (!parts.length) return { html: viewLevel(), title: T('Từ vựng N5', 'N5 Vocabulary'), back: home.back, backLabel: home.backLabel, after: true };
    if (parts[0] === 'review' && parts.length === 1) return { html: viewReview(0), title: T('Triều kiến', 'Audience'), back: 'vocab', backLabel: T('Từ vựng', 'Vocabulary') };
    var toVocab = { back: 'vocab', backLabel: T('Từ vựng', 'Vocabulary') };
    if (parts[0] === 'wanted' && parts.length === 1) return { html: viewBoard(), title: T('Bảng truy nã', 'Wanted board'), back: toVocab.back, backLabel: toVocab.backLabel };
    if (parts[0] === 'wanted' && parts[1] === 'hunt' && parts.length === 2) return { html: viewHunt(), title: T('Truy bắt', 'Manhunt'), back: 'vocab/wanted', backLabel: T('Bảng truy nã', 'Wanted board'), after: true };
    if (parts[0] === 'games' && parts.length === 1) return { html: viewGames(), title: T('Trò chơi nhỏ', 'Mini games'), back: toVocab.back, backLabel: toVocab.backLabel };
    if (parts[0] === 'games' && parts.length === 2 && gameDef(parts[1])) return { html: viewGame(parts[1]), title: App.L(gameDef(parts[1])[2]), back: 'vocab/games', backLabel: T('Trò chơi', 'Games'), after: true };
    if (parts[0] !== 'n5') return null;
    var n = parseInt(parts[1], 10);
    if (!(n >= 1 && n <= D().sessions.length)) return null;
    var html = null, label = sess(n), back = 'vocab/n5/' + n;
    if (parts.length === 2) { html = viewSession(n); label = T('Từ vựng', 'Vocabulary'); back = 'vocab'; }
    else if (parts[2] === 'list' && parts.length === 3) html = viewList(n);
    else if (parts[2] === 'learn' && parts.length === 3) html = viewLearn(n);
    else if (parts[2] === 'review' && parts.length === 3) html = viewReview(n);
    else if (parts[2] === 'w' && parts.length === 4) {
      html = viewWord(n, parseInt(parts[3], 10)); label = T('Danh sách', 'List'); back = 'vocab/n5/' + n + '/list';
      if (changed && html) App.emit('word:view', { key: wkey(D().words[parseInt(parts[3], 10)]) });
    }
    if (!html) return null;
    return { html: html, title: T('Từ vựng', 'Vocabulary') + ' · ' + regionName(n), back: back, backLabel: label, after: true,
      remember: ['Từ vựng · ' + REGIONS[n - 1][2], 'Vocabulary · ' + REGIONS[n - 1][0]] };
  }

  // ---------- hanh dong ----------
  var A = App.actions;
  function activeQuiz() { return curMode === 'learn' ? learn && learn.quiz : curMode === 'hunt' ? hunt && hunt.quiz : curMode === 'review' ? review && review.quiz : null; }
  function answer(ok) {
    var q = activeQuiz(), item = q.qs[q.i], k = wkey(item.w);
    if (!ok) q.failed[k] = 1;
    q.total++; if (ok) q.right++;
    App.emit('word:answer', { key: k, ok: ok, type: item.type, mode: curMode, retry: !!item.retry, spy: curMode === 'review' && isWanted(k) });
    if (!ok) q.qs.push({ w: item.w, type: item.type, opts: item.opts ? shuffle(item.opts) : null, retry: true });
    App.render();
    var nx = document.getElementById('vNext');
    if (nx) nx.focus();
  }
  function finishQuiz() {
    var q = activeQuiz(), seen = {}, list = [], i;
    for (i = 0; i < q.qs.length; i++) {
      var k = wkey(q.qs[i].w);
      if (seen[k]) continue;
      seen[k] = 1; list.push(q.qs[i].w);
    }
    if (curMode === 'learn') {
      var ids = D().sessions[learn.n - 1], had = countLearned(ids);
      for (i = 0; i < list.length; i++) enlist(list[i]);
      learn.phase = 'done';
      App.emit('word:learnEnd', { n: learn.n, count: list.length });
      if (had < ids.length && countLearned(ids) === ids.length) App.emit('map:region', { n: learn.n, st: 'held', name: landLabel(learn.n) });
    } else if (curMode === 'hunt') {
      hunt.result = [];
      for (i = 0; i < list.length; i++) {
        var hit = !q.failed[wkey(list[i])];
        chase(wkey(list[i]), hit);
        hunt.result.push({ w: list[i], ok: hit });
      }
    } else {
      var w = V().wave, wasLeft = waveLeft(w).length, since = siegeSince(), now = Date.now();
      review.result = [];
      for (i = 0; i < list.length; i++) {
        var ok = !q.failed[wkey(list[i])];
        chase(wkey(list[i]), ok);
        grade(list[i], ok);
        review.result.push({ w: list[i], ok: ok });
      }
      App.emit('word:reviewEnd', { count: list.length, right: list.length - Object.keys(q.failed).length });
      if (wasLeft && !waveLeft(w).length) { review.repelled = true; App.emit('map:repel', { count: w.k.length }); }
      var after = siegeSince();
      for (i = 0; i < since.length; i++) {
        if (since[i] && !after[i] && now - since[i] >= 3 * DAY) App.emit('map:restore', { n: i + 1, name: landLabel(i + 1) });
      }
      checkLands(false);
      wave();
    }
    App.saveProgress();
  }
  A.vLearnNext = function () {
    learn.i++;
    if (learn.i >= learn.list.length) { learn.phase = 'quiz'; learn.quiz = makeQuestions(learn.list); }
    App.render(); window.scrollTo(0, 0);
  };
  A.vLearnMore = function () { learn = null; App.render(); };
  A.vZoom = function (el) { window.VocabMap.zoom(parseFloat(el.getAttribute('data-z'))); };
  A.vZoomReset = function () { window.VocabMap.reset(); };
  A.vMapClose = function () { mapSel = 0; App.render(); };
  A.vReviewMore = function () { review = null; App.render(); };
  A.vPick = function (el) {
    var q = activeQuiz();
    if (q.picked >= 0) return;
    q.picked = parseInt(el.getAttribute('data-i'), 10);
    var item = q.qs[q.i];
    window.Speech.say(item.w[1].replace(/～/g, ''));
    answer(item.opts[q.picked] === item.w);
  };
  A.vType = function (el) {
    var v = toKana(el.value, false);
    if (v !== el.value) { el.value = v; try { el.setSelectionRange(v.length, v.length); } catch (e) { /* trinh duyet cu */ } }
  };
  A.vSubmit = function () {
    var el = document.getElementById('vInput'), q = activeQuiz();
    if (!el || q.typed !== null) return;
    var v = toKana(el.value, true).replace(/\s/g, '');
    if (!v) return;
    var w = q.qs[q.i].w;
    if (!matches(v, w) && looseKey(v) === looseKey(w[1]) && !q.near) {
      q.near = true; App.render();
      var again = document.getElementById('vInput');
      if (again) again.focus();
      return;
    }
    q.typed = v;
    window.Speech.say(w[1].replace(/～/g, ''));
    answer(matches(v, w));
  };
  A.vGiveUp = function () { var q = activeQuiz(); q.typed = ''; answer(false); };
  A.vNext = function () {
    var q = activeQuiz();
    q.i++; q.picked = -1; q.typed = null; q.near = false;
    if (q.i >= q.qs.length) finishQuiz();
    App.render(); window.scrollTo(0, 0);
  };
  A.vgPick = function (el) {
    if (!game || game.picked >= 0) return;
    var it = game.qs[game.i];
    game.picked = parseInt(el.getAttribute('data-i'), 10);
    if (game.picked === it.ans) game.right++; else game.miss++;
    window.Speech.say(it.say);
    App.render();
    var nx = document.getElementById('vNext');
    if (nx) nx.focus();
  };
  A.vgNext = function () {
    game.i++; game.picked = -1;
    if (game.i >= game.qs.length) endGame();
    App.render(); window.scrollTo(0, 0);
  };
  A.vgAgain = function () { game = null; App.render(); window.scrollTo(0, 0); };
  A.vfTap = function (el) {
    var i = parseInt(el.getAttribute('data-i'), 10), c = game.cards[i];
    if (!game.t0) game.t0 = Date.now();
    game.bad = null;
    if (game.sel < 0 || game.cards[game.sel].t === c.t) { game.sel = i; App.render(); return; }
    if (game.cards[game.sel].p === c.p) {
      game.got[c.p] = 1; game.right++;
      window.Speech.say(game.words[c.p][1].replace(/～/g, ''));
      if (game.right === game.total) endGame();
    } else { game.miss++; game.bad = [game.sel, i]; }
    game.sel = -1;
    App.render();
  };
  A.vSayEx = function (el) {
    var k = el.getAttribute('data-k'), w = null, all = D().words;
    for (var i = 0; i < all.length; i++) if (wkey(all[i]) === k) w = all[i];
    if (w) window.Speech.sayEx(k, plainEx(w[6]), el);
  };
  [5, 10, 15, 20].forEach(function (n) {
    A['vDaily' + n] = function () { V().daily = [n, Date.now()]; App.saveProgress(); App.refreshChrome(); };
  });

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.keyCode === 13) && e.target && e.target.id === 'vInput') { e.preventDefault(); A.vSubmit(); }
  });

  App.on(function (type) {
    if (type !== 'start' || !D()) return;
    checkLands(true);
    var all = V().w;
    for (var k in all) if (all[k][2] >= 4 && !board()[k]) post(k, true);
  });

  App.addSettingsRow(function (setRow, seg) {
    var cur = dailyLimit(), items = [];
    [5, 10, 15, 20].forEach(function (n) { items.push([String(n), 'vDaily' + n, cur === n]); });
    return setRow(T('Từ mới mỗi ngày', 'New words per day'), seg(items));
  });

  App.section({
    id: 'vocab',
    name: ['Từ vựng', 'Vocabulary'],
    glyph: '語',
    desc: ['Thần dân của nhà vua: học từ và ôn tập ngắt quãng', 'Your subjects: learn words with spaced repetition'],
    ready: true,
    route: route,
    busy: function () {
      if (game && !game.done && curMode === game.id) return true;
      var q = activeQuiz();
      return !!(q && q.i < q.qs.length && (curMode === 'learn' ? learn.phase === 'quiz' : curMode === 'hunt' ? !hunt.result : !review.result));
    },
    afterRender: function (mine) {
      if (!mine) return;
      if (window.VocabMap) window.VocabMap.bind(function (n) { mapSel = mapSel === n ? 0 : n; App.render(); });
      var el = document.getElementById('vInput');
      if (el) el.focus();
    },
    home: function () {
      var left = D() ? besieged() : [];
      if (!left.length) return '';
      var lands = {}, nl = 0;
      for (var i = 0; i < left.length; i++) { var n = sessionOf(left[i]); if (!lands[n]) { lands[n] = 1; nl++; } }
      return '<a class="card kcard vhome" href="' + link('review') + '">' + jp('朝', 'glyph') + '<span class="body"><small>' + T('Triều kiến', 'Audience') + '</small><b>' +
        left.length + T(' thần dân chờ vào chầu', ' subjects await your audience') + '</b>' +
        (mapOpen() ? '<em>' + T('Vong quân đang vây ' + nl + ' vùng', 'The Oblivion Army besieges ' + nl + (nl > 1 ? ' lands' : ' land')) + '</em>' : '') + '</span><i>→</i></a>';
    },
    badge: function () { return D() ? besieged().length > 0 : false; },
    stat: function () {
      if (!D()) return '';
      return T('Đã tiếp kiến ', 'Met ') + Object.keys(V().w).length + '/' + D().words.length + T(' từ', ' words');
    }
  });

})();
