# Thiết kế mục Ngữ pháp: "Kiến thiết vương quốc"

> Trạng thái: **đã triển khai** (`js/grammar.js`, `js/gscene.js`). Các quyết định ở mục 15.

## 1. Ý tưởng

Từ vựng đem lại **thần dân** và **bờ cõi**. Ngữ pháp là thứ dựng nên **kinh thành**: mỗi mẫu ngữ pháp là một **công trình**, mỗi bài là một **quần thể** (chợ, quán trà, bến cảng, lâu đài...). Vùng đất nào đã có dân thì vua đến đó **khởi công**. Công trình xây dần từ móng lên mái theo số lần ôn đúng; lâu không ôn thì **phong hoá** (rêu phủ, nứt vữa), ôn lại là **tu bổ**. Thái phó tiếp tục giảng bài.

Năm nguyên tắc:

1. **Giữ nguyên nguyên tắc của hệ thống thành tựu:** chỉ thưởng việc học thật, không bao giờ trừ điểm, dữ liệu đồng bộ theo người học.
2. **Ngữ pháp đi sau từ vựng:** bài ngữ pháp mở theo số từ đã tiếp kiến. Câu ví dụ và bài tập ưu tiên từ đã học, nên học ngữ pháp cũng là ôn từ.
3. **Học từng ngày, có ôn:** mỗi ngày một bài mới, mẫu cũ ôn theo lịch giãn cách.
4. **Giải thích bằng tư duy người Việt:** so với cấu trúc câu tiếng Việt (は ≈ "thì", trật tự chủ–tân–động), chỉ ra chỗ người Việt hay sai.
5. **Đẹp như game, không phân tâm khi học:** hoạ ảnh và hoạt ảnh chỉ ở trang chủ mục, trang kết quả và bản đồ; màn hình làm bài giữ tĩnh (mục 8.4).

---

## 2. Dữ liệu

### 2.1 Danh sách mẫu

- **78 mẫu N5**, chia **16 bài**, mỗi bài 4–6 mẫu, xếp theo thứ tự sư phạm (danh từ → động từ ます → tính từ → các thể て/ない/từ điển/た).
- Danh sách tự soạn từ các mẫu N5 phổ biến; JLPT không công bố danh sách chính thức. Mọi mẫu được đối chiếu lại với ít nhất hai nguồn trước khi đưa lên.
- Một số mẫu biên giới N5/N4 (〜とき, 〜でしょう, thể thường) được giữ vì hay gặp trong đề N5; đánh dấu "mở rộng" trong dữ liệu.

### 2.2 Các bài (quần thể)

Mỗi bài là một quần thể có chủ đề khớp với nghĩa của các mẫu trong bài.

| Bài | Mẫu | Quần thể |
|---|---|---|
| 1 | N は N です · じゃありません · 〜か (câu hỏi) · N の N · も | 関所 **Trạm gác**: "Ngươi là ai, từ đâu đến?" |
| 2 | これ/それ/あれ · この/その/あの N · ここ/そこ/あそこ/どこ · だれ/なん · 〜ね/〜よ | 物見櫓 **Vọng lâu**: nhìn gần, nhìn xa |
| 3 | いくら · なんじ/なんぷん · 〜から〜まで · 〜ごろ/〜ぐらい · N と N | 鐘楼 **Lầu chuông**: giờ giấc, giá cả |
| 4 | V ます/ません/ました/ませんでした · N を V · (thời điểm) に V · N へ 行きます/来ます/帰ります · N で (phương tiện, nơi chốn) | 宿場 **Trạm dịch**: đi, đến, về |
| 5 | N と (cùng ai) · V ませんか · V ましょう · V ましょうか · なにも/どこも + phủ định | 茶屋 **Quán trà**: mời, rủ |
| 6 | い-adj です · な-adj です · くないです/じゃありません · かったです/でした · adj + N | 庭園 **Ngự uyển**: khen cảnh, tả vật |
| 7 | あります/います · N に N が あります · N は N に あります · 上/下/中/前/後ろ/となり · 〜や〜など | 蔵 **Kho lẫm**: cái gì ở đâu |
| 8 | N が すき/きらい · じょうず/へた · わかります · 〜が (nhưng) · 〜から (lý do) · どうして | 道場 **Võ đường**: thích, giỏi, kém |
| 9 | A は B より adj · A と B と どちらが · A のほうが · 〜の中で〜が いちばん · どれ/どちら | 市場 **Chợ phiên**: so hàng, so giá |
| 10 | N が ほしい · V たい · V(ます) に 行きます · どこか/なにか | 神社 **Đền thần**: điều ước, mục đích |
| 11 | Cách chia thể て · V てください · V ています (đang) · V ても いいです · V ては いけません | 奉行所 **Phủ đường**: lệnh, cho phép, cấm |
| 12 | V て、V て (chuỗi hành động) · V てから · adj くて / adj で · V ています (trạng thái, thói quen) | 工房 **Xưởng thủ công**: làm A rồi B |
| 13 | Cách chia thể ない · V ないでください · V なければなりません · V なくても いいです | 寺 **Chùa**: giới luật, điều phải làm |
| 14 | Thể từ điển · V ことが できます · 趣味は V ことです · V まえに · Thể thường (だ) | 学問所 **Học đường**: khả năng, sở thích |
| 15 | Cách chia thể た · V たことが あります · V たり V たり します · V たあとで / N のあとで · もう/まだ | 港 **Bến cảng**: chuyện đã qua, chuyến đi |
| 16 | Mệnh đề bổ nghĩa danh từ · adj く/に なります · N に なります · 〜でしょう · 〜とき | 天守閣 **Thiên thủ các**: biến đổi, đỉnh cao |

### 2.3 Ngưỡng mở bài

Bài mở khi **đủ số từ đã tiếp kiến** và **đã học xong bài trước**. Ngưỡng dồn đầu để người mới sớm có ngữ pháp: bài 1 ở 20 từ, sau đó mỗi bài thêm 45 từ.

| Bài | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Số từ | 20 | 65 | 110 | 155 | 200 | 245 | 290 | 335 | 380 | 425 | 470 | 515 | 560 | 605 | 650 | 695 |

- Từ vựng học tự do theo buổi, nên ngưỡng không bảo đảm đã có đúng loại từ. Ví dụ đi theo thứ tự buổi thì tới bài 4 (động từ ます) vẫn chưa gặp động từ nào (buổi 13).
- Khi câu của bài vừa mở có nhiều từ chưa học, trang bài hiện **gợi ý không bắt buộc** của Thái phó: "Bệ hạ tiếp kiến vùng Đông Bắc (động từ) trước thì bài này dễ hơn", kèm nút sang buổi đó.
- Trang chủ mục ghi rõ lý do bài kế còn khoá: "Cần tiếp kiến thêm 23 thần dân".

### 2.4 Trường dữ liệu của một mẫu

| Trường | Ví dụ | Ghi chú |
|---|---|---|
| Mã | `n5-04-2` | bài-thứ tự |
| Công thức | N を V | Hiện dạng khối màu: danh từ, trợ từ, động từ |
| Tên VI / EN | Trợ từ を: tân ngữ / Particle を: object | |
| Giải thích VI / EN | | Ý nghĩa, cách dùng, 1–3 đoạn ngắn |
| Lưu ý dễ sai | を đọc là "o" | Những lỗi người Việt hay mắc |
| So sánh | を ↔ が với すき | Mẫu dễ nhầm, có thể trống |
| Mẹo Thái phó | "Tiếng Việt nói 'ăn cơm', tiếng Nhật nói 'cơm を ăn'" | |
| Câu ví dụ | 3–5 câu | Furigana, nghĩa VI/EN, âm thanh |
| Kho câu bài tập | 12–15 câu | Xem mục 2.5 |
| Podcast | n5-0012 @ 3:41 | Có thể trống, xem mục 2.6 |
| Mở rộng | có/không | Mẫu biên giới N5/N4 |

### 2.5 Kho câu

Mỗi câu soạn sẵn, có âm thanh TTS tạo trước, và kèm đủ dữ liệu cho mọi dạng bài:

| Trường | Dùng cho |
|---|---|
| Câu tiếng Nhật + furigana, nghĩa VI/EN | Mọi dạng |
| Mã các từ vựng trong câu | Lọc câu theo từ đã học |
| Đoạn đục lỗ + 3 phương án nhiễu | Điền chỗ trống |
| Các mảnh để sắp xếp (4 mảnh, vị trí ★) | Sắp xếp câu, Thợ cả xếp gạch |
| Dạng gốc + dạng cần chia (nếu câu có động/tính từ chia) | Gõ chia |
| Bản có một lỗi sai + vị trí lỗi + giải thích ngắn | Truy tìm lỗi sai |

**Chọn câu khi ra bài:** chấm điểm từng câu theo tỉ lệ từ đã tiếp kiến, cộng thêm điểm nếu từ thuộc vùng đặt quần thể. Ưu tiên câu điểm cao, tránh lặp câu vừa gặp. Từ chưa tiếp kiến trong câu gạch chân chấm, chạm vào hiện nghĩa.

Nguồn soạn: `tools/n5_grammar/01.txt` … `16.txt`, mỗi file một bài. Script mới `tools/build_grammar.py n5` kiểm tra (trường thiếu, mã từ sai, mảnh ghép không khớp câu, file âm thanh thiếu) và sinh `data/grammar-n5.js`. Âm thanh tạo bằng `tools/build_audio.py` như từ vựng, lưu ở `audio/gr/`.

**Khối lượng soạn:** khoảng 78 × (4 ví dụ + 13 câu) ≈ 1.300 câu.

### 2.6 Liên kết podcast

Mỗi mẫu khai báo một biểu thức tìm kiếm (ví dụ `たい(です|。)`). `build_grammar.py` quét kịch bản podcast và liệt kê các câu khớp; người soạn chọn 1–2 câu tiêu biểu ghi vào dữ liệu, để tránh khớp nhầm. Hồ sơ công trình có nút **"Nghe trong podcast"** nhảy tới đúng câu.

---

## 3. Công trình và cấp xây (ôn tập giãn cách)

### 3.1 Các cấp

| Cấp | Tên | Hình ảnh | Ôn lại sau |
|---|---|---|---|
| 1 | Móng | Nền đá, cọc gỗ | 1 ngày |
| 2 | Khung | Cột kèo dựng xong | 3 ngày |
| 3 | Tường | Vách gỗ, cửa giấy | 1 tuần |
| 4 | Mái | Mái ngói cong | 2 tuần |
| 5 | Hoàn thiện | Sơn son, đèn lồng | 1 tháng |
| 6 | Danh thắng | Cờ, cây cảnh, ánh vàng nhẹ | Không ôn nữa |

### 3.2 Quy tắc

- **Học xong bài:** các mẫu của bài vào cấp Móng.
- **Một lượt Tu bổ** hỏi mỗi mẫu **2 câu khác dạng**. Đúng cả hai: lên một cấp. Sai câu nào thì câu đó quay lại cuối lượt và mẫu tính là sai.
- **Sai:** xuống một cấp; từ cấp Mái trở lên thì xuống hai cấp. Không bao giờ dưới Móng.
- **Mỗi lượt tối đa 10 mẫu**, mẫu quá hạn lâu nhất vào trước. Không giới hạn số lượt trong ngày.
- Mẫu Danh thắng vẫn xuất hiện trong trò chơi nhỏ và Kỳ quan tuần, chỉ không vào hàng Tu bổ.
- Lịch ôn tự viết, ES5 như mục Từ vựng.

### 3.3 Phong hoá

Không dính tới Vong quân. Công trình quá hạn ôn chỉ đổi hình ảnh:

| Quá hạn | Hình ảnh |
|---|---|
| 0–6 ngày | Rêu nhẹ ở chân tường |
| 7–29 ngày | Rêu dày, ngói lệch, vết nứt |
| Từ 30 ngày | Dây leo phủ, cửa giấy rách |

Cấp xây giữ nguyên khi phong hoá; chỉ khi trả lời sai lúc tu bổ mới xuống cấp. Tu bổ xong, công trình hiện lại sạch sẽ ở màn kết quả.

---

## 4. Học mỗi ngày

### 4.1 Nhịp ngày

- **Mỗi ngày tối đa 1 bài mới** (4–6 mẫu).
- Tỉ lệ đúng các câu ngữ pháp trong ngày (bài học và Tu bổ) **≥ 80%** thì được **mở thêm 1 bài**, tối đa 2 bài/ngày. Thái phó báo khi được mở thêm, giống cơ chế thưởng từ mới.
- Bài vẫn cần đủ ngưỡng từ vựng (mục 2.3).

### 4.2 Luồng học một bài (Khởi công)

1. **Bản vẽ:** hoạ ảnh quần thể chưa xây, Thái phó giới thiệu chủ đề bài bằng một câu.
2. **Từng mẫu:**
   - Thái phó giảng: công thức (khối màu), ý nghĩa, lưu ý, mẹo;
   - 3–5 câu ví dụ có nút nghe;
   - 2–3 câu luyện ngay (điền chỗ trống, sắp xếp), sai thì hiện giải thích, không tính điểm.
3. **Kiểm tra cuối bài:** 6–8 câu trộn các mẫu và các dạng.
   - **Đúng ≥ 80%:** mọi mẫu vào cấp Móng. Màn kết quả có hoạt ảnh dựng móng.
   - **Dưới 80%:** chỉ làm lại phần kiểm tra (không phải xem lại giảng), kèm danh sách mẫu đã sai.
4. **Chọn vùng đặt quần thể** (nếu bản đồ đã mở, mục 6.2).

Bỏ dở giữa chừng thì lần sau học lại bài từ đầu; không lưu nửa chừng.

---

## 5. Dạng bài tập

| Dạng | Hỏi | Trả lời |
|---|---|---|
| **Điền chỗ trống** | Câu có ( ), kiểu 問題1 của đề JLPT | Chọn 1 trong 4 |
| **Sắp xếp câu** | 4 mảnh xáo trộn, kiểu 問題2 (★) | Khi học và Tu bổ: chạm lần lượt để xếp cả câu. Khi đã lên cấp Mái: hỏi đúng kiểu đề, chọn mảnh ở vị trí ★ |
| **Gõ chia** | 毎日 日本語を（勉強する → ___）います。 | Gõ 勉強して, dùng bộ chuyển romaji của mục Từ vựng; nhận cả kana lẫn kanji đúng. Sai nhỏ (thiếu っ, trường âm) báo "gần đúng" và cho gõ lại một lần |
| **Hiểu câu** | Đọc hoặc nghe câu tiếng Nhật | Chọn nghĩa tiếng Việt trong 4; hoặc ngược lại, từ câu tiếng Việt chọn câu tiếng Nhật đúng |

- Gõ chia chỉ ra với mẫu có chia động/tính từ (bài 4, 6, 11–16).
- Dạng nghe tự tắt nếu thiết bị đang tắt tiếng (theo cài đặt hiện có của web).
- Sau mỗi câu sai: hiện đáp án đúng, công thức của mẫu và một dòng giải thích lấy từ dữ liệu câu.

---

## 6. Bản đồ và quần thể

### 6.1 Trước bậc Tân vương

Mục Ngữ pháp **học và ôn bình thường**. Quần thể đã khởi công nằm trong **Kho bản vẽ**. Khi lên Tân vương và bản đồ mở, Lễ đăng quang thêm dòng "Các quần thể đang chờ đất xây", và trang Ngữ pháp mời vua đặt lần lượt từng quần thể.

### 6.2 Đặt quần thể

- **Mỗi vùng tối đa 1 quần thể.** 16 vùng, 16 quần thể.
- Chỉ đặt ở vùng **Đang chinh phạt** trở lên (đã tiếp kiến ít nhất 1 từ của buổi đó).
- Màn chọn vùng: bản đồ thu nhỏ, vùng đặt được sáng lên, vùng gợi ý (vùng có nhiều từ đã học nhất trong kho câu của bài) có dấu ✦.
- Không còn vùng trống thì quần thể nằm trong Kho bản vẽ; việc học và ôn không bị chặn.
- Sau khi đặt, kho câu ưu tiên thêm từ vựng của vùng đó (mục 2.5).

### 6.3 Hai chế độ xem bản đồ

Bản đồ có nút chuyển **Bờ cõi | Kiến thiết** ở góc trên. Hai lớp không bao giờ chồng lên nhau.

- **Bờ cõi:** giữ nguyên bản đồ Từ vựng hiện tại (màu trạng thái vùng, gạch Vong quân). Mở từ mục Từ vựng thì vào chế độ này.
- **Kiến thiết:** ẩn màu chinh phạt và gạch Vong quân, chỉ hiện trạng thái xây dựng. Mở từ mục Ngữ pháp thì vào chế độ này.
- Chế độ đang xem được nhớ riêng cho từng lối vào.

### 6.4 Chế độ Kiến thiết: thu nhỏ và phóng to

**Mặc định thu nhỏ hết cỡ**, thấy cả nước Nhật, **không hiện công trình**. Mỗi vùng chỉ tô màu theo trạng thái, đúng nguyên tắc "chỉ màu, không dấu phụ" của bản đồ hiện tại:

| Trạng thái | Điều kiện | Màu |
|---|---|---|
| Đất trống | Chưa có quần thể | Giấy trơn (vùng chưa khai phá vẫn phủ sương) |
| Đang xây | Cấp thấp nhất trong quần thể là Móng–Mái | Màu gỗ nhạt |
| Hoàn thiện | Mọi công trình từ Hoàn thiện trở lên | Màu son |
| Danh thắng | Mọi công trình Danh thắng | Vàng, viền vàng |
| Thịnh trị | Danh thắng và vùng đã Thái bình (từ vựng) | Vàng, hoa văn mây |
| Phong hoá | Có công trình quá hạn ôn | Gạch chéo xanh rêu phủ lên màu trạng thái, như gạch đỏ của Vong quân |

**Phóng to mới thấy công trình:**

- Khi một vùng đủ lớn trên màn hình (khoảng 140 px chiều ngang), các công trình của quần thể hiện dần lên **ngay trên vùng đó**: 4–6 công trình nhỏ nét mực, mỗi cái vẽ theo cấp xây và mức phong hoá của nó. Ngưỡng tính theo cỡ từng vùng, nên Kinh Đô, Nại Lương, Đại Phản (nhỏ, sát nhau) cần phóng to hơn Bắc Hải Đạo mới hiện.
- Thu nhỏ lại dưới ngưỡng thì công trình mờ dần đi, chỉ còn màu.
- Chạm một vùng mở bảng thông tin vùng: tên quần thể, tiến độ, số công trình cần tu bổ, và hai nút:
  - **🔍 Xem công trình:** bản đồ lướt và phóng nhanh vào vùng đó (khoảng 0,5 giây) tới đúng mức thấy công trình;
  - **Vào quần thể:** mở cảnh quần thể (mục 6.5).
- Khi đang phóng to có nút **⤢ Toàn cảnh** để về lại mức thu nhỏ hết cỡ.
- Ở mức phóng to, chạm một công trình mở hồ sơ công trình (mục 7.2).
- Chú giải dưới bản đồ đổi theo chế độ đang xem.

### 6.5 Cảnh quần thể

Chạm nút "Vào quần thể" hoặc thẻ quần thể mở **cảnh quần thể**: một hoạ ảnh SVG ngang, phong cách tranh mực trên giấy washi giống bản đồ.

- Mỗi công trình (mẫu) có một ô đất trong cảnh, vẽ theo cấp xây và mức phong hoá.
- **Phông nền theo vùng**, 4 loại: núi (Kỳ Phụ, Đông Hải...), biển (Cửu Châu, Xung Thằng...), tuyết (Bắc Hải Đạo, Đông Bắc), đồng bằng/thành thị (Kinh Đô, Đông Kinh...). Quần thể còn trong Kho bản vẽ hiện dạng bản vẽ nét xanh.
- Chạm một công trình mở **hồ sơ công trình** (mục 7.2).
- Có người dân nhỏ đi lại, khói bếp, đèn lồng đung đưa: chỉ ở cảnh này, tắt theo `prefers-reduced-motion`.

---

## 7. Giao diện

### 7.1 Trang chủ mục (`#/grammar`)

Từ trên xuống:

1. **Đầu trang:** danh xưng Văn trị, số mẫu đã học /78, số công trình cần tu bổ.
2. **Bài hôm nay:** hoạ ảnh bản vẽ quần thể kế tiếp, nút **Khởi công**; hoặc lý do còn khoá; hoặc "Hôm nay đã khởi công, mai Bệ hạ xây tiếp".
3. **Tu bổ:** số công trình đến hạn, nút bắt đầu, giờ có công trình đến hạn kế tiếp.
4. **Kho bản vẽ** (nếu có quần thể chưa đặt).
5. **16 quần thể:** lưới thẻ (tên, vùng, cấp thấp nhất, tiến độ). Bài chưa mở hiện mờ cùng ngưỡng từ.
6. **Công trường Kỳ quan** và **Trò chơi nhỏ**.
7. **Sổ tay ngữ pháp:** tra cứu mọi mẫu đã học, lọc theo bài và cấp, tìm theo chữ.

### 7.2 Hồ sơ công trình (một mẫu)

- **Phần đầu:** hình công trình theo cấp, tên mẫu, công thức khối màu, cấp hiện tại, hạn tu bổ.
- **Phần giữa:** giải thích, lưu ý, so sánh, mẹo Thái phó.
- **Phần cuối:** câu ví dụ có nút nghe; nút "Nghe trong podcast"; số lần đúng/sai.

### 7.3 Kết quả

Màn kết quả của bài học và Tu bổ là nơi có hoạt ảnh: công trình lên cấp lắp thêm phần (cột dựng, mái phủ) trong khoảng 1 giây mỗi cái, công trình được tu bổ rụng rêu. Thông báo thành tựu và Chiếu chỉ hiện sau đó, như quy tắc chung.

### 7.4 Không phân tâm khi làm bài

- Màn làm bài chỉ có câu hỏi, đáp án, thanh tiến độ mỏng; không hoạ ảnh, không người dân, không hoa rơi của theme cung đình.
- Phản hồi đúng/sai chỉ là đổi màu và một tiếng ngắn (theo cài đặt âm báo hiện có).
- Không thông báo thành tựu giữa bài.
- Chữ tiếng Nhật đủ lớn, furigana bật/tắt được.

### 7.5 Chung

Giao diện sáng/tối, theme cung đình, tiếng Việt/tiếng Anh, khổ điện thoại 375 px. Hoạ ảnh vẽ bằng SVG trong code, không dùng ảnh.

**Cách vẽ công trình:** không vẽ tay 78 × 6 hình. Mỗi công trình ghép từ bộ phận dùng chung (nền, khung, vách, kiểu mái, trang trí), mỗi mẫu chọn kiểu mái, kích thước, màu và một chi tiết riêng. Mỗi cấp thêm bộ phận, mỗi mức phong hoá phủ thêm lớp rêu/nứt.

---

## 8. Trò chơi nhỏ và Kỳ quan tuần

### 8.1 Thợ cả xếp gạch

- **90 giây**, câu sắp xếp liên tục từ các mẫu đã học. Mỗi câu xếp đúng thêm một hàng gạch vào bức tường.
- Sai không mất gì, chỉ mất thời gian; hiện câu đúng rồi sang câu khác.
- Kết quả: chiều cao tường, kỷ lục cá nhân.
- Mở khi đã học xong bài 2.

### 8.2 Giám định công trình (truy tìm lỗi sai)

- 10 câu một lượt. Mỗi câu chia 4 đoạn gạch chân, đúng một đoạn sai ngữ pháp. Chạm vào đoạn sai.
- Sau mỗi câu: hiện câu đúng và một dòng giải thích.
- Mở khi đã học xong bài 4.

### 8.3 Kỳ quan tuần

- Mỗi tuần có một **kỳ quan** để xây, lần lượt theo danh sách: 五重塔 Ngũ trùng tháp, 大仏 Đại Phật Nara, 金閣 Kim Các, 姫路城 thành Himeji, 厳島の大鳥居 cổng Itsukushima, 清水の舞台 vũ đài chùa Thanh Thuỷ, 平等院鳳凰堂 Phượng Hoàng đường, 首里城 thành Shuri. Hết danh sách thì lặp lại, kỳ quan đã xây được thêm một ngôi sao.
- Kỳ quan có **5 tầng**, mỗi tầng cần **10 câu ngữ pháp đúng** trong tuần (bài học, Tu bổ, trò chơi đều tính).
- Xây xong được thưởng; không xong thì công trường đóng khi hết tuần, không phạt.
- Kỳ quan đã xây hiện ở **sảnh Kỳ quan** trên Hồ sơ nhà vua, và hiện trên bản đồ tại vị trí thật nếu vị trí đó thuộc vùng đã khai phá.
- Mở khi đã học xong bài 1.

---

## 9. Văn trị (danh xưng kiến thiết)

Trục tiến bộ thứ ba, song song với Uy vọng và Quốc thế, tính theo số quần thể **Hoàn thiện** (mọi công trình trong quần thể đạt cấp Hoàn thiện trở lên):

| Số quần thể | Danh xưng |
|---|---|
| 0 | Sơ khai (初開) |
| 2 | Lập ấp (立邑) |
| 5 | Thị tứ (市肆) |
| 9 | Phồn hoa (繁華) |
| 13 | Thịnh thế (盛世) |
| 16 | **Văn trị thiên hạ** (文治天下) |

Hiện cạnh Quốc thế trên Hồ sơ nhà vua. Danh xưng không bao giờ tụt, kể cả khi công trình bị xuống cấp sau này.

---

## 10. Uy vọng

| Hành động | Uy vọng | Giới hạn |
|---|---|---|
| Học xong một mẫu **lần đầu** | +10 | Mỗi mẫu một lần trong đời |
| Hoàn thành một bài (khởi công quần thể) | +40 | Mỗi bài một lần |
| Trả lời đúng một câu ngữ pháp (Tu bổ, trò chơi) | +2 | 150/ngày |
| Một mẫu lên Danh thắng **lần đầu** | +10 | Mỗi mẫu một lần |
| Tu bổ hết công trình đến hạn trong ngày | +15 | 1/ngày |
| Một quần thể Hoàn thiện | +100 | Mỗi bài một lần |
| Xây xong Kỳ quan tuần | +100 | 1/tuần |
| Trò chơi nhỏ ngữ pháp: hoàn thành một lượt | +5 | 10 lượt/ngày, riêng với trò chơi từ vựng |
| Văn trị thiên hạ | +500 | Một lần |

**Ước tính:** học hết 16 bài trong khoảng 3–4 tháng, ôn đều, xây Kỳ quan hằng tuần được khoảng 9.000–11.000 Uy vọng. Cộng với Kanji và Từ vựng N5 thì bậc 10 (50.000) vẫn chưa tới, giữ chỗ cho N4 và Luyện đề.

---

## 11. Thành tựu mới (24)

Điện mới **築 Kiến thiết**, mã `N`. Ký hiệu độ hiếm như tài liệu thành tựu: 🟤 Thường · ⚪ Hiếm · 🟡 Sử thi · 💎 Huyền thoại · 🔒 ẩn.

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| N1–N5 | Đặt viên đá đầu I–V | Học 1 / 10 / 30 / 50 / toàn bộ mẫu N5 | 🟤 🟤 ⚪ 🟡 🟡 Danh hiệu "Văn phạm gia" ở N5 |
| N6–N8 | Danh thắng I–III | 10 / 40 / toàn bộ mẫu lên Danh thắng | ⚪ 🟡 💎 Danh hiệu "Tổng đốc kiến thiết" ở N8 |
| N9–N11 | Thợ lành nghề I–III | Tổng 100 / 1.000 / 3.000 câu ngữ pháp đúng | 🟤 ⚪ 🟡 |
| N12 | Khởi công | Đặt quần thể đầu tiên lên bản đồ | 🟤 |
| N13–N15 | Hoàn công I–III | 1 / 8 / 16 quần thể Hoàn thiện | 🟤 ⚪ 💎 Danh hiệu "Văn trị thiên hạ" ở N15 |
| N16 | Thợ cả | Một lượt Xếp gạch đạt từ 15 hàng | ⚪ |
| N17 | Mắt giám định | Tổng 50 câu Giám định đúng | ⚪ |
| N18 | Kiến trúc sư | Tổng 50 câu sắp xếp đúng | 🟤 |
| N19 | Ngự bút chia động từ | 30 câu gõ chia đúng liên tiếp | 🟡 |
| N20–N21 | Kỳ quan I–II | Xây xong 1 / 8 Kỳ quan tuần | 🟤 🟡 |
| N22 | Chăm nghe giảng | Nghe hết câu ví dụ của 30 mẫu | 🟤 |
| N23 🔒 | Dựng lại từ đổ nát | Gợi ý "Đổ nát rồi lại dựng xây". Tu bổ một công trình đã phong hoá từ 30 ngày, rồi đưa nó lên Hoàn thiện | ⚪ |
| N24 🔒 | Đỉnh thiên thủ | Gợi ý "Nơi cao nhất của toà thành". Quần thể Thiên thủ các Hoàn thiện | ⚪ |

**Tổng mới:** 24 (8 Thường, 8 Hiếm, 6 Sử thi, 2 Huyền thoại). Tổng toàn hệ thống: 182. H8 tính theo danh sách hiện có, ai đã mở thì vẫn giữ.

---

## 12. Chiếu chỉ và Nghị sự mới

Thêm loại hoạt động **Ngữ pháp**, theo các quy tắc sẵn có.

| ID | Độ khó | Nội dung | Chỉ rút khi |
|---|---|---|---|
| QE9 | Dễ | Trả lời đúng 15 câu ngữ pháp | Đã học ít nhất 1 bài |
| QE10 | Dễ | Chơi 1 lượt trò chơi nhỏ ngữ pháp | Đã mở ít nhất một trò |
| QM9 | Vừa | Khởi công một bài mới | Có bài đủ ngưỡng và còn hạn mức hôm nay |
| QM10 | Vừa | Tu bổ hết công trình đến hạn | Có công trình đến hạn |
| QH9 | Khó | Một lượt Xếp gạch đạt từ 10 hàng | Đã mở Xếp gạch |
| QH10 | Khó | 20 câu gõ chia đúng | Đã học bài 4 |

| ID | Nghị sự tuần | Chỉ rút khi |
|---|---|---|
| W16 | Xây xong Kỳ quan tuần | Đã học ít nhất 1 bài |
| W17 | Khởi công 3 bài mới | Còn ít nhất 3 bài chưa học và bài kế đã đủ ngưỡng |
| W18 | Trả lời đúng 200 câu ngữ pháp | Đã học ít nhất 2 bài |

Mỗi tuần tối đa một Nghị sự loại Ngữ pháp.

---

## 13. Dữ liệu tiến độ và đồng bộ

Thêm khoá `grammar` vào `progress`:

```text
grammar: {
  p: { "<mã mẫu>": [cấp, hạn ôn, số lần sai, chuỗi đúng, lần ôn cuối, lần học] },
  l: { "<số bài>": [lúc khởi công, vùng đặt, lúc đặt] },   // vùng 0 = Kho bản vẽ
  today: [đầu ngày, số câu đúng, tổng số câu, số bài mới],
  wonder: { w: "2026-W48", n: số câu đúng, done: [...] }
}
```

- **Gộp từng mẫu:** giữ bản có "lần ôn cuối" mới hơn.
- **Vùng đặt:** giữ bản có "lúc đặt" sớm hơn (đặt lần đầu thắng).
- **Kỳ quan đã xây, bộ đếm, Uy vọng, thành tựu:** dùng cơ chế nhánh thiết bị sẵn có trong `king`.
- **Dung lượng:** khoảng 80 mẫu × 40 byte ≈ 3 KB.

**Sự kiện mới** cho `App.emit`: `grammar:learn`, `grammar:lesson`, `grammar:review` (kèm dạng câu, đúng/sai), `grammar:level`, `grammar:place`, `grammar:wonder`, `grammar:example` (nghe câu ví dụ). Trò chơi dùng lại `game:end` kèm mã trò. `king.js` chỉ lắng nghe.

---

## 14. Kiến trúc và các bước làm

### 14.1 File

- `js/grammar.js` (mới): dữ liệu, lịch ôn, luồng học, Tu bổ, trang chủ mục, hồ sơ công trình, trò chơi.
- `js/gscene.js` (mới): vẽ công trình theo bộ phận, cảnh quần thể, biểu tượng cho bản đồ.
- `js/vmap.js`: thêm nút chuyển Bờ cõi | Kiến thiết, màu trạng thái xây dựng, lớp công trình hiện theo mức phóng to, nút Xem công trình và Toàn cảnh.
- `js/king.js`: điện 築, thành tựu, Uy vọng, Chiếu chỉ, Nghị sự, Văn trị, sảnh Kỳ quan.
- `js/vocab.js`: dùng chung bộ chuyển romaji (tách ra hàm dùng chung nếu cần).
- `js/sections.js`: bỏ mục Ngữ pháp khỏi danh sách "chưa làm".
- Trang chủ: thẻ "Tu bổ" cạnh thẻ Triều kiến.

### 14.2 Các bước (sau khi duyệt)

| Bước | Nội dung | Kiểm tra |
|---|---|---|
| 1 | Định dạng nguồn, `build_grammar.py`, soạn bài 1–2 làm mẫu | Script bắt được trường thiếu, mảnh ghép sai, mã từ sai |
| 2 | Mục Ngữ pháp: trang chủ, học bài, 4 dạng bài, Tu bổ, lịch ôn, hồ sơ công trình, sổ tay | Giả lập nhiều ngày; ngưỡng từ; thưởng 80% |
| 3 | Đồ hoạ: bộ phận công trình, 6 cấp, 3 mức phong hoá, cảnh quần thể, 4 phông nền | Khổ 375 px, sáng/tối, theme cung đình |
| 4 | Bản đồ: hai chế độ xem, đặt quần thể, Kho bản vẽ, hiện công trình khi phóng to, Thịnh trị | Trước/sau Tân vương; hết vùng trống; vùng nhỏ Kansai trên khổ 375 px |
| 5 | Soạn nội dung bài 3–16 và âm thanh | Script kiểm tra; đọc lại toàn bộ giải thích |
| 6 | Thành tựu, Uy vọng, Chiếu chỉ, Nghị sự, Văn trị | Kịch bản tự động như lúc làm thành tựu |
| 7 | Trò chơi nhỏ, Kỳ quan tuần | Giả lập sang tuần |
| 8 | Deploy | Kiểm tra trên trang thật |

---

## 15. Quyết định đã chốt

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Danh sách 16 bài, 78 mẫu, tên quần thể | Giữ như mục 2.2 |
| 2 | Dời quần thể sau khi đặt | Không dời |
| 3 | Văn trị, Uy vọng, thành tựu, danh hiệu | Giữ như mục 9–11 |
| 4 | 8 kỳ quan, 50 câu/tuần | Giữ như mục 8.3 |
| 5 | Bài luyện chia riêng cho mọi động/tính từ đã học | Không thêm; gõ chia chỉ lấy từ kho câu |
