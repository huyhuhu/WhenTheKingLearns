// Cac muc chua lam. Khi lam xong mot muc: tao file rieng nhu kanji.js,
// dat ready: true va them ham route(parts, changed) tra ve { html, title }.
(function () {
  'use strict';

  window.App.section({
    id: 'vocab',
    name: ['Từ vựng', 'Vocabulary'],
    glyph: '語',
    desc: ['Từ vựng theo bài và theo cấp độ JLPT', 'Vocabulary by lesson and JLPT level'],
    ready: false,
    planned: [['Danh sách từ theo bài', 'Word lists by lesson'], 'Flashcard', ['Trắc nghiệm nghĩa và cách đọc', 'Quizzes on meaning and reading'], ['Ôn tập ngắt quãng (SRS)', 'Spaced repetition (SRS)']]
  });

  window.App.section({
    id: 'grammar',
    name: ['Ngữ pháp', 'Grammar'],
    glyph: '文',
    desc: ['Mẫu câu kèm giải thích, ví dụ và bài tập', 'Patterns with explanations, examples and exercises'],
    ready: false,
    planned: [['Danh sách mẫu ngữ pháp theo cấp độ', 'Grammar patterns by level'], ['Giải thích và ví dụ', 'Explanations and examples'], ['Bài tập điền và sắp xếp câu', 'Fill-in and sentence-ordering exercises']]
  });

  window.App.section({
    id: 'exam',
    name: ['Luyện đề', 'Mock exams'],
    glyph: '試',
    desc: ['Đề thi thử JLPT có chấm điểm và giải thích', 'JLPT practice tests with scoring and explanations'],
    ready: false,
    planned: [['Đề thi thử theo cấp độ', 'Practice tests by level'], ['Tính giờ làm bài', 'Timed sessions'], ['Chấm điểm và xem lại đáp án', 'Scoring and answer review']]
  });
})();
