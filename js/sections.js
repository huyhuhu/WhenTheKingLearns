// Cac muc chua lam. Khi lam xong mot muc: tao file rieng nhu kanji.js,
// dat ready: true va them ham route(parts, changed) tra ve { html, title }.
(function () {
  'use strict';

  window.App.section({
    id: 'exam',
    name: ['Luyện đề', 'Mock exams'],
    glyph: '試',
    desc: ['Đề thi thử JLPT có chấm điểm và giải thích', 'JLPT practice tests with scoring and explanations'],
    ready: false,
    planned: [['Đề thi thử theo cấp độ', 'Practice tests by level'], ['Tính giờ làm bài', 'Timed sessions'], ['Chấm điểm và xem lại đáp án', 'Scoring and answer review']]
  });
})();
