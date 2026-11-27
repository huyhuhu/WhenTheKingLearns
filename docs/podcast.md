# Podcast: quy cách và quy trình làm tập mới

> Tài liệu này dành cho người (hoặc phiên Claude mới) tiếp tục làm thêm tập podcast. Đọc hết trước khi viết kịch bản. Mọi quy tắc ở đây đều là quyết định đã được chủ dự án duyệt.

## 1. Tính năng đang có

- Mục **Podcast** (tab 聴) mở **trình phát dạng lớp phủ**, kiểu YouTube/Spotify: trang đang xem giữ nguyên bên dưới. Thu nhỏ bằng nút ⌄, phím Esc hoặc nút Back của Android thì trình phát thành **thanh phát nhỏ** ở đáy màn hình (▶, tên tập — chạm để mở lại, ⏭, ✕ tắt hẳn trình phát).
- Mở lên là **tự phát ngẫu nhiên** một tập chưa nghe. Hết tập thì phát **đoạn nhạc chuyển tập 6 giây** (`audio/jingle.mp3`) rồi tự sang tập khác. Bấm ⏭, chọn tập từ danh sách hay bật lặp thì không phát nhạc.
- **Lyric karaoke** sáng theo từng từ, có furigana, romaji, bản dịch (bật/tắt riêng). Chạm vào câu để tua tới câu đó. Có nút chương, chọn tốc độ 0.5x–1.5x, nút lặp 1 tập.
- **Điều khiển từ màn hình khóa và thanh thông báo** qua Media Session API: play/pause, tua, chuyển tập, thanh tiến độ. Chạy trên Chrome Android, PWA cài từ Chrome và Safari iOS 15+. **Không** chạy trên WebView (trình duyệt Via).
- **Tiết kiệm dữ liệu:** chỉ tải tập đang nghe; tải sẵn tập kế tiếp khi nghe được 60%. Nút "Tải 5 tập chưa nghe" lưu vào Cache Storage để nghe offline.
- Tiến độ "đã nghe" đồng bộ qua Firebase (`progress.podcast.heard`). Code phát sự kiện `podcast:done`, `podcast:minute`, `podcast:repeat`, nhưng **chưa** nối vào thành tựu và Chiếu chỉ (có đề xuất, chưa được duyệt).

## 2. File và thư mục

| Đường dẫn | Nội dung | Có commit? |
|---|---|---|
| `podcast/scripts/n5-XXXX.json` | Kịch bản từng tập (nguồn gốc) | Có |
| `podcast/cast.json` | Dàn nhân vật dùng chung, giọng đọc | Có |
| `podcast/config.json` | `audioBase` (URL public của bucket R2), `bucket` | Có |
| `tools/build_podcast.py` | Tạo mp3 + lyric từ kịch bản, ghi lại mục lục | Có |
| `tools/upload_podcast.py` | Đẩy mp3 còn thiếu lên R2 bằng wrangler | Có |
| `tools/build_jingle.py` | Tạo `audio/jingle.mp3` | Có |
| `tools/serve.py` | Máy chủ chạy thử có hỗ trợ Range (tua được) | Có |
| `data/podcast.js` | Mục lục (`window.PODCAST`), builder tự ghi | Có |
| `data/podcast/n5-XXXX.json` | Lyric + thời gian từng từ, builder tự ghi | Có |
| `podcast/audio/*.mp3` | Âm thanh, tên có mã nội dung (`n5-0001.9af66b1a.mp3`) | **Không** (nằm trên R2) |
| `tools/.cache/podcast/` | Cache từng câu đã đọc | Không |
| `js/podcast.js`, `css/style.css` (mục podcast) | Trình phát | Có |

Âm thanh nằm trên **Cloudflare R2**, bucket `wtkl-podcast`, URL public ghi trong `podcast/config.json`. CORS của bucket cho phép `https://huyhuhu.github.io` và `http://localhost:8765`. Khi chạy trên localhost, trình phát lấy âm thanh từ `podcast/audio/` trong máy.

## 3. Người nghe và nguyên tắc nội dung

- **Người nghe:** người Việt trình độ **JLPT N5**, hay nghe trên tàu điện bằng 4G. Nghe toàn tiếng Nhật thì chán, nên phải như có người giảng bài bằng tiếng Việt.
- **Người dẫn:** **Thái phó** (giọng Việt `vi-VN-NamMinhNeural`), xưng "thần", gọi người nghe là "Bệ hạ", hài hước nhẹ. Hợp với chủ đề nhà vua của web.
- **Format ưu tiên cho tập mới là `fact` (Kiến thức):**
  - Kể kiến thức **thật, có số liệu**, gần như toàn bằng tiếng Việt (khoảng 90–97% thời lượng).
  - Mỗi tập chỉ dạy **1–2 từ hoặc 1 câu ngắn tiếng Nhật N5**, lặp vài lần kèm "nói theo". Cuối tập có thể ghép thành một câu.
  - Tập mẫu chuẩn: `podcast/scripts/n5-0012.json` ("Tàu chạy sớm 20 giây").
- **Các format khác vẫn dùng được:** `dialogue` (hội thoại + giải thích), `story` (truyện kể), `news` (bản tin), `shadow` (luyện nói), `lesson` (bài giảng).
- **Chủ đề càng đa dạng càng tốt:**
  - Đời sống và văn hóa Nhật, lịch sử, khoa học, động vật, công nghệ, kinh tế, thể thao, giải trí, con người, chuyện Việt – Nhật.
  - Tin công nghệ, showbiz Việt/Trung/Hàn, diễn viên Hollywood. Chủ đề khó so với N5 thì được dùng nhiều tiếng Việt hơn.
  - Tin tức được phép cũ đi theo thời gian.
- **Sự thật:**
  - Tra nguồn trước khi viết. Số liệu phải khớp nguồn; nguồn mâu thuẫn thì nói chung chung hoặc bỏ.
  - Ghi URL vào `sources`.
  - Với người thật, chỉ nêu điều đã được ghi nhận rộng rãi, không đồn đoán.
  - Tự viết lại bằng lời mình, không chép nguyên văn.
- **Độ dài:** 4–6 phút (khoảng 40–55 dòng `flow`); truyện dài tối đa khoảng 9 phút.
- **Ngắt nghỉ nhiều** (chủ dự án nhấn mạnh): 8–12 điểm dừng mỗi tập.
  - **Đoán** (`think`, 4–5 giây): sau câu hỏi móc ở đầu tập, trước các con số thú vị, và cho câu đố cuối tập.
  - **Nói theo** (`repeat`, `"auto"`): ngay sau mỗi dòng tiếng Nhật cần học.
- **Dàn nhân vật cố định kiểu sitcom** (`podcast/cast.json`): Yuki (nhân viên văn phòng đãng trí), Kenta (đồng nghiệp mê công nghệ, thầm thích Yuki), trưởng phòng Tanaka (chuyện cười nhạt), bà Sato (chủ nhà), mèo Tama, phát thanh viên. Nhắc lại chuyện cũ khi tự nhiên.

## 4. Định dạng kịch bản

```json
{
  "id": "n5-0051",
  "level": "n5",
  "format": "fact",
  "title": {"vi": "Tên tập tiếng Việt", "ja": "{早|はや}い"},
  "summary": "Một câu tiếng Việt gây tò mò, hiện trong danh sách.",
  "topics": ["văn hóa", "đời sống"],
  "sources": ["https://…"],
  "dialogue": [],
  "flow": [
    {"sec": "Mở đầu"},
    {"spk": "thaipho", "text": "Muôn tâu Bệ hạ! … Bệ hạ đoán xem …?"},
    {"pause": 5, "cue": "think"},
    {"spk": "thaipho", "ja": "{早|はや}い。", "ro": "Hayai.", "vi": "Sớm."},
    {"pause": "auto", "cue": "repeat"},
    {"spk": "thaipho", "text": "Từ 「{新幹線|しんかんせん}」 nghĩa là tàu cao tốc."}
  ]
}
```

**Các loại dòng trong `flow`:**
- `{"sec": "Tên chương"}`: mở chương mới, hiện thành nút chương và vạch trên thanh tua.
- `{"spk": id, "text": "…"}`: lời tiếng Việt. Chữ Nhật bên trong phải bọc `「…」`; đoạn trong 「」 do giọng Nhật đọc chậm (`jaInline`, mặc định -25%).
- `{"spk": id, "ja": "…", "ro": "…", "vi": "…"}`: câu tiếng Nhật trọn vẹn (mặc định -15%), kèm romaji Hepburn (ō, ū; trợ từ viết wa/e/o) và bản dịch.
- `{"pause": giây hoặc "auto", "cue": "think" | "repeat"}`: khoảng lặng. `"auto"` bằng 1,3 lần độ dài câu vừa nói cộng 1 giây.
- `{"d": số | "all"}`: phát lại câu trong mảng `dialogue` (dùng cho format hội thoại).

**Markup furigana:**
- `{漢字|かな}`: mọi kanji đều phải có furigana. Builder cảnh báo nếu thiếu.
- `{漢字|!かな}`: ép máy đọc theo kana. Dùng cho từ máy dễ đọc sai: 今日, 一日, số đếm + lượng từ (十本, 二つ, 七百円), 何, 一人…

**Nhân vật:** `spk` lấy từ `podcast/cast.json`. Nhân vật riêng của tập khai báo trong `"speakers"` của kịch bản, ví dụ `{"tenin": {"name": "Nhân viên", "ja": "ja-JP-KeitaNeural", "pitch": "+4Hz"}}`. Giọng có sẵn trong edge-tts: Nhật chỉ có Nanami (nữ) và Keita (nam), Việt có NamMinh (nam) và HoaiMy (nữ). Muốn có nhiều nhân vật thì đổi `pitch` và `rate` cho mỗi người.

**Câu tiếng Anh:** khai báo nhân vật có `"vi"` là giọng tiếng Anh, rồi viết dòng `text` bằng tiếng Anh; builder không cảnh báo romaji với giọng `en-`. Loạt "Loa trên tàu" (n5-0051 – n5-0056) dùng `{"loaen": {"name": "Loa tiếng Anh", "vi": "en-US-JennyNeural", "ja": "ja-JP-NanamiNeural", "rate": "-8%"}}`.

## 5. Quy tắc phát âm (quan trọng)

- **Tên và từ tiếng Nhật trong lời tiếng Việt phải viết bằng chữ Nhật trong 「」,** không viết romaji.
  - Ví dụ: `「{桃太郎|ももたろう}」`, `「{東京|とうきょう}」`, `「{渋沢栄一|しぶさわえいいち}」`, `「カラオケ」`, `「ユキ」`.
  - Lý do: giọng Việt đọc romaji sai, ví dụ "Momotarō" thành "momota", "Shibusawa" thành "shibusa". Giọng Nhật đọc phần trong 「」 chậm hơn để nghe kịp.
  - Builder cảnh báo khi thấy từ Latin trông giống tiếng Nhật trong lời Việt.
- Tên người nước ngoài khác (Brad Pitt, Edison…) để nguyên chữ Latin cho giọng Việt đọc, nhưng nên hạn chế và tránh tên quá dài.
- Không dùng viết tắt. Giờ giấc viết bằng chữ ("chín giờ bốn mươi phút"). Năm viết số ("1964") là được.
- Không để kana hoặc kanji ngoài 「」 trong câu tiếng Việt (builder cảnh báo).
- Từ tiếng Nhật trong lời Việt nên đặt ở đầu hoặc cuối câu, để đỡ phải đổi giọng giữa câu.

## 6. Quy trình làm tập mới

1. **Chọn id kế tiếp.** Xem `podcast/scripts/`; id nối tiếp số lớn nhất, ví dụ `n5-0051`. Đọc tiêu đề các tập trong `data/podcast.js` để tránh trùng chủ đề.
2. **Viết kịch bản** theo mục 3–5. Bám sát `n5-0012.json`.
3. **Build:**
   ```bash
   tools/.venv/Scripts/python.exe tools/build_podcast.py n5-0051 n5-0052
   ```
   - Sửa đến khi **không còn cảnh báo** và dòng báo cáo có `tu X/X` khớp hết (mọi từ đều có mốc thời gian).
   - Gặp `TTS loi` là lỗi tạm thời của edge-tts, chạy lại là được.
   - Không truyền id thì builder build lại tất cả. Câu đã đọc nằm trong cache nên nhanh.
4. **Nghe thử trên máy:**
   - Chạy `python tools/serve.py 8765` (hoặc cấu hình `kanji-web` trong `.claude/launch.json`), mở `http://localhost:8765`, vào tab Podcast → ☰ → chọn tập.
   - Claude không nghe được âm thanh, nên phát âm phải do người kiểm tra.
5. **Upload lên R2:**
   ```bash
   python tools/upload_podcast.py
   ```
   - Lần đầu trên máy mới thì chạy `npx wrangler login` trước.
   - Script chỉ đẩy file chưa có trên bucket.
6. **Commit và push lên `main`.** GitHub Actions sẽ deploy lên GitHub Pages.
   - Commit: `podcast/scripts/`, `data/podcast.js`, `data/podcast/`. Không commit `podcast/audio/`.
   - GitHub Pages cache khoảng 10 phút. Muốn trình duyệt lấy ngay mục lục mới thì tăng `?v=` của `data/podcast.js` trong `index.html`.
   - Repo thuộc tài khoản GitHub `huyhuhu`. Nếu `gh` đang dùng tài khoản khác thì push sẽ bị từ chối (403): chạy `gh auth switch --user huyhuhu`, push xong thì chuyển lại.

## 7. Làm nhiều tập một lúc bằng subagent

- Chia mỗi subagent khoảng 5–10 tập, danh sách chủ đề không trùng nhau, gợi ý sẵn 1–2 từ tiếng Nhật cho mỗi tập.
- Giao việc bằng agent mới (`general-purpose`) với brief tự đủ, không cần cả lịch sử hội thoại.
- Chạy nhiều agent song song tốn nhiều lượt dùng và dễ chạm giới hạn 5 giờ. Khi đó agent dừng nhưng phần đã làm vẫn còn; gửi tin nhắn cho agent để nó làm tiếp.
- Mẫu brief:

> Viết kịch bản podcast học tiếng Nhật cho dự án D:\WhenTheKingLearns. Đọc trước `docs/podcast.md` (quy cách, bắt buộc), `podcast/scripts/n5-0012.json` (tập mẫu), `podcast/cast.json`. Viết các tập: n5-00AA — chủ đề — gợi ý từ; n5-00BB — … Tra nguồn bằng WebSearch, ghi `sources`. Build bằng `tools/.venv/Scripts/python.exe tools/build_podcast.py <id…>` đến khi sạch cảnh báo và `tu X/X` khớp hết. Chỉ tạo file kịch bản của mình, không sửa file khác, không commit. Báo cáo mỗi tập một dòng (id, tên, thời lượng, từ tiếng Nhật đã dạy, nguồn chính) và các chỗ không chắc.

## 8. Thông số kỹ thuật

| Mục | Giá trị |
|---|---|
| TTS | edge-tts (miễn phí), có mốc thời gian theo từng từ |
| Tốc độ | Câu tiếng Nhật -15%, tiếng Nhật chen trong lời Việt -25%, tiếng Việt 0% |
| Khoảng nghỉ | Nhật→Nhật 1,3 s · Nhật→Việt 1,2 s · Việt→Nhật 0,8 s · Việt→Việt 0,7 s · giữa chương 2 s |
| Âm thanh | mp3 mono 24 kHz, 32 kbps (khoảng 0,25 MB/phút) |
| Lyric | Khoảng 30–40 KB mỗi tập (nén còn khoảng 8 KB), tải khi mở tập |
| Nhạc chuyển tập | 6 giây. Chrome Android có thể ẩn điều khiển màn hình khóa với audio từ 5 giây trở xuống, nên không rút ngắn hơn. |
| Cú pháp JS | ES5 (để chạy được trên WebView cũ), xem `js/core.js` |

## 9. Việc còn mở

- **Nối Podcast vào thành tựu và Chiếu chỉ** (`js/king.js`). Đã có đề xuất, chưa được duyệt:
  - Thành tựu: nghe xong 1/10/30/100/300 tập; tổng 1/10/50 giờ nghe; nghe đủ 6 chủ đề; nghe xong 10 bản tin; hai thành tựu ẩn.
  - Chiếu chỉ: Dễ nghe xong 1 tập, Vừa nghe 15 phút, Khó nghe xong 3 tập.
  - Nghị sự: nghe xong 10 tập trong tuần.
- Các cấp N4 trở lên: trình phát đã hỗ trợ lọc theo cấp (`level`), chỉ cần thêm kịch bản `n4-XXXX`.
