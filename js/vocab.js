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

  var learn = null, review = null, curMode = '';

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
    var due = dueList().length, left = newLeft(), open = firstOpenSession(), nd = nextDue();
    var wait = !due && nd ? T('Lần triều kiến tới: ', 'Next audience: ') + new Date(nd).toLocaleString() : '';
    return '<div class="card vsum"><div class="vsum-stats">' +
      '<span><b>' + Object.keys(V().w).length + '</b><small>' + T('thần dân', 'subjects') + '</small></span>' +
      '<span><b>' + due + '</b><small>' + T('chờ triều kiến', 'awaiting audience') + '</small></span>' +
      '<span><b>' + left + '</b><small>' + T('từ mới còn hôm nay', 'new words left today') + '</small></span></div>' +
      '<div class="row">' +
      (due ? '<a class="btn primary" href="' + link('review') + '">' + T('Triều kiến', 'Hold audience') + ' (' + Math.min(due, ROUND) + ')</a>' : '') +
      (left && open ? '<a class="btn' + (due ? '' : ' primary') + '" href="' + link('n5/' + open + '/learn') + '">' + T('Tiếp kiến thần dân mới', 'Meet new subjects') + '</a>' : '') +
      '</div>' + (wait ? '<p class="note center">' + h(wait) + '</p>' : '') + '</div>';
  }

  function viewLevel() {
    var d = D(), html = '<div class="hero">' + jp('語彙', 'eyebrow') + '<h1>' + T('Từ vựng N5', 'N5 Vocabulary') + '</h1><p class="sub">' +
      d.sessions.length + T(' vùng đất · ', ' lands · ') + d.words.length + T(' thần dân', ' subjects') + '</p></div>' + summaryCard() + '<div class="rows">';
    for (var i = 0; i < d.sessions.length; i++) {
      var s = d.sessions[i], n = i + 1, got = countLearned(s), due = dueList(s).length;
      html += '<a class="card rowcard" href="' + link('n5/' + n) + '"><span class="no vno">' + jp(region(n)[0], 'vreg' + (region(n)[0].length > 2 ? ' long' : '')) + '</span>' +
        '<span class="body"><b>' + sess(n) + ' · ' + h(regionName(n)) + '</b><small class="muted">' + h(topic(n)) + '</small>' + bar(got, s.length) + '</span>' +
        '<span class="meta"><b>' + got + '/' + s.length + '</b><small>' + (due ? due + T(' chờ ôn', ' due') : '&nbsp;') + '</small></span></a>';
    }
    return html + '</div>';
  }

  function viewSession(n) {
    var s = D().sessions[n - 1], r = region(n), due = dueList(s).length, left = Math.min(newLeft(), unlearned(s).length);
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
    var count = '<p class="eyebrow center">' + T('Câu ', 'Question ') + (q.i + 1) + '/' + q.qs.length + '</p>' + bar(q.i, q.qs.length);
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
    var list = shuffle(dueList(n ? D().sessions[n - 1] : null)).slice(0, ROUND);
    review = { n: n || 0, list: list, quiz: list.length ? makeQuestions(list) : null, result: null };
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
      return head + '<div class="hero"><h1>' + up + '/' + review.result.length + '</h1><p class="sub">' +
        T(up + ' thần dân được thăng hàm, ' + down + ' cần ôn lại', up + ' promoted, ' + down + ' need more practice') + '</p></div>' +
        '<div class="card narrow vres-list">' + rows + '</div>' +
        '<div class="row">' + (dueList(n ? D().sessions[n - 1] : null).length ? '<button class="btn primary" data-act="vReviewMore">' + T('Triều kiến tiếp', 'Continue') + '</button>' : '') +
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
    }
    curMode = parts[parts.length - 1] || '';
    var home = { back: '', backLabel: T('Trang chủ', 'Home') };
    if (!parts.length) return { html: viewLevel(), title: T('Từ vựng N5', 'N5 Vocabulary'), back: home.back, backLabel: home.backLabel };
    if (parts[0] === 'review' && parts.length === 1) return { html: viewReview(0), title: T('Triều kiến', 'Audience'), back: 'vocab', backLabel: T('Từ vựng', 'Vocabulary') };
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
  function activeQuiz() { return curMode === 'learn' ? learn && learn.quiz : review && review.quiz; }
  function answer(ok) {
    var q = activeQuiz(), item = q.qs[q.i], k = wkey(item.w);
    if (!ok) q.failed[k] = 1;
    q.total++; if (ok) q.right++;
    App.emit('word:answer', { key: k, ok: ok, type: item.type, mode: curMode });
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
      for (i = 0; i < list.length; i++) enlist(list[i]);
      learn.phase = 'done';
      App.emit('word:learnEnd', { n: learn.n, count: list.length });
    } else {
      review.result = [];
      for (i = 0; i < list.length; i++) {
        var ok = !q.failed[wkey(list[i])];
        grade(list[i], ok);
        review.result.push({ w: list[i], ok: ok });
      }
      App.emit('word:reviewEnd', { count: list.length, right: list.length - Object.keys(q.failed).length });
    }
    App.saveProgress();
  }
  A.vLearnNext = function () {
    learn.i++;
    if (learn.i >= learn.list.length) { learn.phase = 'quiz'; learn.quiz = makeQuestions(learn.list); }
    App.render(); window.scrollTo(0, 0);
  };
  A.vLearnMore = function () { learn = null; App.render(); };
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
      var q = activeQuiz();
      return !!(q && q.i < q.qs.length && (curMode === 'learn' ? learn.phase === 'quiz' : !review.result));
    },
    afterRender: function (mine) {
      if (!mine) return;
      var el = document.getElementById('vInput');
      if (el) el.focus();
    },
    home: function () {
      var due = D() ? dueList().length : 0;
      if (!due) return '';
      return '<a class="card kcard vhome" href="' + link('review') + '">' + jp('朝', 'glyph') + '<span class="body"><small>' + T('Triều kiến', 'Audience') + '</small><b>' +
        due + T(' thần dân chờ vào chầu', ' subjects await your audience') + '</b></span><i>→</i></a>';
    },
    badge: function () { return D() ? dueList().length > 0 : false; },
    stat: function () {
      if (!D()) return '';
      return T('Đã tiếp kiến ', 'Met ') + Object.keys(V().w).length + '/' + D().words.length + T(' từ', ' words');
    }
  });

})();
