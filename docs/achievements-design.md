# Thiết kế hệ thống thành tựu: "Con đường của nhà vua"

> Trạng thái: **đã triển khai** (js/king.js). Các quyết định ở mục 12.

## 1. Ý tưởng

Người học bắt đầu là một **hoàng tử nhỏ**. Mỗi chữ Kanji thuộc được, mỗi bài trắc nghiệm, mỗi ngày kiên trì đều cộng **Uy vọng** (威望, điểm kinh nghiệm). Uy vọng đủ thì được **thăng bậc**, từ hoàng tử lên tới **Vạn thế chi vương**.

Song song là **122 thành tựu** chia thành 13 "điện", mỗi ngày có **3 Chiếu chỉ** (nhiệm vụ hằng ngày) và mỗi tuần có **3 Nghị sự** (nhiệm vụ tuần) để giữ nhịp học. Mỗi thành tựu là một **ấn tín** (con dấu) đóng vào sổ của nhà vua. Các thành tựu khó có thưởng **danh hiệu** để đeo, và các bậc cao mở khoá **màu ấn tín** mới cho logo.

Ba nguyên tắc:

1. **Chỉ thưởng việc học thật.** Mọi nguồn Uy vọng đều có giới hạn mỗi ngày để không "cày" được bằng cách bấm liên tục.
2. **Không bao giờ trừ điểm.** Bỏ đánh dấu "đã thuộc" hay làm bài kém không làm mất Uy vọng hay thành tựu.
3. **Dữ liệu đi theo người học.** Thành tựu và Uy vọng đồng bộ qua Gist như tiến độ hiện tại, gộp đúng khi học trên nhiều thiết bị.

---

## 2. Bậc đế vương (thăng cấp)

| Bậc | Danh xưng | Tiếng Nhật | Uy vọng cần | Phần thưởng khi lên bậc |
|---|---|---|---|---|
| 1 | Hoàng tử nhỏ | 幼き王子 | 0 | Ấn tín màu **đỏ son** (mặc định) |
| 2 | Hoàng tử | 王子 | 100 | Danh hiệu "Hoàng tử" |
| 3 | Thái tử | 太子 | 300 | Ấn tín màu **lam ngọc** |
| 4 | Tân vương | 新王 | 700 | Lễ đăng quang; mở ô chọn danh hiệu |
| 5 | Quốc vương | 国王 | 1.500 | Ấn tín màu **vàng kim** |
| 6 | Hiền vương | 賢王 | 3.000 | Danh hiệu "Hiền vương" |
| 7 | Đại vương | 大王 | 6.000 | Ấn tín màu **lục bảo** |
| 8 | Thánh vương | 聖王 | 12.000 | Danh hiệu "Thánh vương" |
| 9 | Thiên tử | 天子 | 25.000 | Ấn tín màu **tím hoàng bào** |
| 10 | Vạn thế chi vương | 万世の王 | 50.000 | Ấn tín **mực đen viền vàng**; khung vàng cho hồ sơ |

**Ước tính với riêng N5:** học hết 103 chữ, làm khoảng 100 bài trắc nghiệm trong vài tháng, làm Chiếu chỉ và Nghị sự đều đặn, mở phần lớn thành tựu thì được khoảng 20.000–25.000 Uy vọng, tức bậc 8, chạm ngưỡng bậc 9. Bậc 9–10 chỉ đạt được khi có thêm N4, Từ vựng, Ngữ pháp, Luyện đề. Đây là chủ ý, để hệ thống còn chỗ lớn lên cùng web.

### 2.1 Nguồn Uy vọng

| Hành động | Uy vọng | Giới hạn | Ghi chú |
|---|---|---|---|
| Đánh dấu thuộc một chữ **lần đầu tiên** | +10 | không | Mỗi chữ chỉ tính một lần trong đời; bỏ rồi đánh dấu lại không tính |
| Mở trang chi tiết của một chữ **lần đầu** | +2 | không | Mỗi chữ một lần |
| Bấm "Đã thuộc" / "Chưa thuộc" trên flashcard | +1 | 100/ngày | Chỉ lật mà không chấm thì không tính |
| Trả lời **đúng** một câu trắc nghiệm | +2 | 300/ngày | Chỉ tính lần chọn đầu tiên của câu |
| Hoàn thành một bài trắc nghiệm | +10 | 10 bài/ngày | |
| Bài trắc nghiệm đạt 100% | +30 | 5 bài/ngày | Cộng thêm vào +10 ở trên |
| Lần đầu đạt 100% ở một buổi | +100 | mỗi buổi một lần | |
| Nghe phát âm | +1 | 30/ngày | |
| Ngày học đầu tiên trong ngày | +5 | 1/ngày | "Ngày học" là ngày có ít nhất một hành động học ở trên |
| Thưởng chuỗi ngày | +1 × số ngày chuỗi | tối đa +30/ngày | Ngày thứ 7 liên tiếp được +7 |
| Mở khoá thành tựu | 20 / 50 / 150 / 500 | | Theo độ hiếm, xem mục 3 |
| Hoàn thành Chiếu chỉ | 15 / 30 / 50, thêm 50 khi xong cả 3 | 3 Chiếu chỉ/ngày | Xem mục 5.1–5.3 |
| Hoàn thành Nghị sự tuần | 100 mỗi Nghị sự, thêm 150 khi xong cả 3 | 3 Nghị sự/tuần | Xem mục 5.4 |

---

## 3. Độ hiếm

| Độ hiếm | Màu ấn tín | Uy vọng thưởng | Có danh hiệu? |
|---|---|---|---|
| **Thường** (Đồng) | nâu đồng | 20 | Không |
| **Hiếm** (Bạc) | bạc | 50 | Không |
| **Sử thi** (Vàng) | vàng | 150 | Có |
| **Huyền thoại** (Ngọc) | ngọc bích, có ánh sáng | 500 | Có |

**Thành tựu nhiều bậc** (ví dụ lật 1 / 100 / 500 / 2.000 / 5.000 thẻ) hiện thành **một thẻ có các sao I–V** như trong game. Mỗi bậc là một thành tựu riêng, tính vào tổng 122 và có độ hiếm tăng dần.

---

## 4. Danh sách thành tựu (122)

Ký hiệu độ hiếm: 🟤 Thường · ⚪ Hiếm · 🟡 Sử thi · 💎 Huyền thoại. Đánh dấu 🔒 là **thành tựu ẩn**, chỉ hiện "？？？" kèm một câu gợi ý cho tới khi mở khoá.

### 4.1 宝 Kho báu Hán tự: số chữ đã thuộc (5, thêm 4 bậc khi có N4 trở lên)

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| K1 | Nét bút đầu tiên | Thuộc 1 chữ | 🟤 |
| K2 | Túi ngọc nhỏ | Thuộc 10 chữ | 🟤 |
| K3 | Rương báu | Thuộc 25 chữ | ⚪ |
| K4 | Kho bạc hoàng gia | Thuộc 50 chữ | ⚪ |
| K5 | Chủ nhân N5 | Thuộc toàn bộ 103 chữ N5 | 🟡 Danh hiệu "Chủ nhân N5" |
| K6–K9 | Thư khố / Đại thư khố / Ngàn chữ / Thông thạo Thường dụng | 300 / 600 / 1.000 / 2.136 chữ | ⚪ / 🟡 / 🟡 / 💎. *Chỉ hiện khi có N4 trở lên, không tính vào 122.* |

### 4.2 璽 Bộ sưu tập ấn tín: thuộc trọn một nhóm chữ (17)

| ID | Tên | Nhóm chữ | Độ hiếm |
|---|---|---|---|
| S1 | Ngũ hành | 火 水 木 金 土 | 🟤 |
| S2 | Bảy ngày của vương quốc | 日 月 火 水 木 金 土 | ⚪ |
| S3 | Đếm đến mười | 一 二 三 四 五 六 七 八 九 十 | 🟤 |
| S4 | Quốc khố | 百 千 万 円 | 🟤 |
| S5 | Tứ phương | 東 西 南 北 | 🟤 |
| S6 | Định vị thiên hạ | 上 下 左 右 中 外 | 🟤 |
| S7 | Hoàng tộc | 父 母 子 男 女 人 | 🟤 |
| S8 | Long thể | 口 目 耳 手 足 | 🟤 |
| S9 | Sơn hà xã tắc | 山 川 天 気 雨 空 花 魚 | ⚪ |
| S10 | Người giữ thời gian | 年 月 日 時 分 半 間 週 毎 今 午 前 後 | ⚪ |
| S11 | Thánh chỉ | 言 話 語 読 書 聞 | 🟤 |
| S12 | Ngự giá | 行 来 出 入 立 休 | 🟤 |
| S13 | Âm dương cân bằng | 大 小 多 少 高 安 新 古 | ⚪ |
| S14 | Quốc tử giám | 学 校 生 先 本 名 | 🟤 |
| S15 | Kinh thành | 店 駅 車 道 電 国 社 会 | ⚪ |
| S16 | Ngự thiện | 食 飲 買 | 🟤 |
| S17 | Ngọc tỷ truyền quốc | Hoàn thành cả 16 bộ trên | 🟡 Danh hiệu "Người giữ ngọc tỷ" |

### 4.3 学 Học viện hoàng gia: buổi học (7)

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| A1 | Tốt nghiệp I | Thuộc hết chữ của 1 buổi | 🟤 |
| A2 | Tốt nghiệp II | Thuộc hết chữ của 3 buổi | ⚪ |
| A3 | Tốt nghiệp III | Thuộc hết chữ của cả 5 buổi N5 | 🟡 |
| A4 | Học toàn diện | Dùng đủ 4 chế độ (Danh sách, Flashcard, Trắc nghiệm, Từ vựng) trong cùng một buổi | 🟤 |
| A5 | Người tò mò | Mở trang chi tiết của mọi chữ trong một buổi | 🟤 |
| A6 | Đọc vạn quyển | Mở trang Từ vựng đi kèm của cả 5 buổi | 🟤 |
| A7 | Tự vấn | Ở chế độ ẩn nghĩa, chạm để xem lại 30 từ | 🟤 |

### 4.4 闘 Đấu trường: trắc nghiệm (23)

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| Q1–Q5 | Chiến binh đấu trường I–V | Hoàn thành 1 / 10 / 50 / 100 / 300 bài | 🟤 🟤 ⚪ 🟡 💎 |
| Q6–Q10 | Kiếm sĩ I–V | Tổng 50 / 200 / 500 / 1.000 / 3.000 câu đúng | 🟤 🟤 ⚪ 🟡 💎 |
| Q11 | Bách phát bách trúng | Một bài đạt 100% | ⚪ |
| Q12 | Toàn thắng N5 | Đạt 100% ở cả 5 buổi N5 (không cần cùng lúc) | 🟡 Danh hiệu "Bất bại" |
| Q13–Q16 | Liên hoàn kiếm I–IV | Chuỗi 10 / 25 / 50 / 100 câu đúng liên tiếp (chuỗi nối qua các bài, đứt khi sai) | 🟤 ⚪ 🟡 💎 |
| Q17 | Thần tốc | Một bài đạt từ 90% trong dưới 2 phút | ⚪ |
| Q18 | Quật khởi | Làm lại một buổi từng đạt dưới 50% và đạt từ 90% | ⚪ |
| Q19 | Thông dịch quan | 100 câu đúng dạng "Kanji → nghĩa" | ⚪ |
| Q20 | Mắt rồng | 100 câu đúng dạng "nghĩa → Kanji" | ⚪ |
| Q21 | Tai thính | 100 câu đúng dạng "Kanji → cách đọc" | ⚪ |
| Q22 | Văn thần | 100 câu đúng dạng "từ vựng → cách đọc" | ⚪ |
| Q23 | Tay không run | 3 bài liên tiếp không sai câu nào | 🟡 |

### 4.5 札 Thư khố: flashcard (9)

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| F1–F5 | Người lật thẻ I–V | Chấm 1 / 100 / 500 / 2.000 / 5.000 thẻ | 🟤 🟤 ⚪ 🟡 💎 |
| F6 | Trọn một vòng | Đi hết một vòng flashcard của một buổi | 🟤 |
| F7 | Trí nhớ hoàng gia | Một vòng trọn buổi không có thẻ "Chưa thuộc" | ⚪ |
| F8 | Không bỏ ai lại phía sau | Bấm "Học lại chữ chưa thuộc" cho tới khi không còn chữ nào | 🟤 |
| F9 | Tuần du | Làm flashcard ở cả 5 buổi | 🟤 |

### 4.6 筆 Thư pháp: nét viết (6)

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| C1–C3 | Ngự bút I–III | Xem nét viết của 10 / 50 / 103 chữ khác nhau | 🟤 ⚪ 🟡 |
| C4–C5 | Nét bút không ngừng I–II | Bấm vào chữ để xem lại nét 50 / 300 lần | 🟤 ⚪ |
| C6 | Đại thư pháp gia | Xem trọn hoạt ảnh của cả 4 chữ nhiều nét nhất N5 (語 読 聞 駅, 14 nét) | ⚪ |

### 4.7 音 Âm luật: phát âm (7)

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| M1–M4 | Đôi tai nhà vua I–IV | Nghe 1 / 100 / 500 / 2.000 lần | 🟤 🟤 ⚪ 🟡 |
| M5 | Đủ âm | Nghe mọi cách đọc On và Kun của một chữ | 🟤 |
| M6–M7 | Kho âm luật I–II | Nghe 100 / toàn bộ 660 âm khác nhau của N5 | ⚪ 🟡 |

### 4.8 律 Kỷ luật của nhà vua: ngày học (15)

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| D1–D6 | Kỷ luật thép I–VI | Chuỗi 3 / 7 / 14 / 30 / 100 / 365 ngày học liên tiếp | 🟤 🟤 ⚪ 🟡 🟡 💎 |
| D7–D10 | Biên niên sử I–IV | Tổng 10 / 50 / 100 / 365 ngày học | 🟤 ⚪ 🟡 💎 |
| D11 | Ngày cần chính | Đạt 100 Uy vọng trong một ngày | 🟤 |
| D12 | Ngày huy hoàng | Đạt 300 Uy vọng trong một ngày | ⚪ |
| D13 | Nhà vua trở về | Quay lại học sau ít nhất 7 ngày vắng | 🟤 |
| D14 | Bảy ngày của tuần | Từng học vào đủ Thứ Hai đến Chủ Nhật (không cần liên tiếp) | 🟤 |
| D15 | Cuối tuần không nghỉ | Học cả Thứ Bảy và Chủ Nhật của cùng một tuần | 🟤 |

### 4.9 時 Thời khắc (5)

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| T1 🔒 | Bình minh của vương quốc | Học trong khung 4:00–6:00 sáng | ⚪ |
| T2 🔒 | Ngọn đèn khuya | Học trong khung 0:00–3:00 | ⚪ |
| T3 | Giờ Ngọ | Học trong khung 11:00–13:00 (liên hệ chữ 午) | 🟤 |
| T4 🔒 | Ngày định mệnh | Học vào ngày thi JLPT (Chủ Nhật đầu tiên của tháng 7 hoặc tháng 12) | 🟡 |
| T5 🔒 | Tân niên | Học vào ngày 1 tháng 1 (liên hệ từ 新年) | ⚪ |

### 4.10 交 Ngoại giao: song ngữ (3)

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| G1 | Sứ thần phương Tây | Chuyển giao diện sang tiếng Anh lần đầu | 🟤 |
| G2 | Song ngữ | Hoàn thành ít nhất một bài trắc nghiệm ở mỗi ngôn ngữ | 🟤 |
| G3 | Đại sứ toàn quyền | 200 câu trắc nghiệm đúng ở chế độ tiếng Anh | ⚪ |

### 4.11 宮 Cung điện: cài đặt và tiện ích (7)

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| P1 | Nhạc công hoàng gia | Bật nhạc nền lần đầu | 🟤 |
| P2 | Dàn nhạc cung đình | Thử đủ 5 phong cách nhạc | 🟤 |
| P3 | Đêm ở cung điện | Dùng giao diện tối | 🟤 |
| P4 | Sứ giả liên lạc | Đồng bộ Gist thành công lần đầu | 🟤 |
| P5 | Vương quốc rộng lớn | Tiến độ được ghi từ ít nhất 2 thiết bị | ⚪ |
| P6 | Ngự sử ghi chép | Tải file sao lưu | 🟤 |
| P7 | Ngai vàng riêng | Mở web từ biểu tượng trên màn hình chính | 🟤 |

### 4.12 秘 Bí mật (8, đều ẩn)

| ID | Tên | Gợi ý hiện khi chưa mở | Điều kiện thật | Độ hiếm |
|---|---|---|---|---|
| H1 🔒 | Ấn tín nhà vua | "Con dấu có điều muốn nói" | Bấm logo 王 10 lần trong 5 giây | ⚪ |
| H2 🔒 | Nhà vua do dự | "Ngày hay đêm?" | Đổi sáng/tối 10 lần trong 1 phút | 🟤 |
| H3 🔒 | Lòng vua khó đoán | "Thuộc hay chưa thuộc?" | Bật/tắt "Đã thuộc" cùng một chữ 5 lần | 🟤 |
| H4 🔒 | Ngư phủ | "Có tiếng cá dưới sông" | Nghe âm うお 10 lần | 🟤 |
| H5 🔒 | Vẹt hoàng gia | "Nói lại đi, nói lại đi" | Nghe cùng một âm 20 lần liên tiếp | 🟤 |
| H6 🔒 | Thất bại là mẹ thành công | "Ngã ở đâu, đứng dậy ở đó" | Sai từ 10 câu trong một bài, rồi làm lại đúng buổi đó đạt 100% | 🟡 |
| H7 🔒 | Vua không ngủ | "Mặt trời đã lặn rồi mọc" | Học trong cả khung T2 và T1 của cùng một đêm | 🟡 |
| H8 🔒 | Vạn thế chi vương | "Khi mọi ấn tín đã đóng" | Mở khoá toàn bộ 121 thành tựu còn lại | 💎 Danh hiệu "Truyền thuyết" |

### 4.13 令 Chiếu chỉ: nhiệm vụ ngày và tuần (10)

| ID | Tên | Điều kiện | Độ hiếm |
|---|---|---|---|
| L1–L4 | Trung thần I–IV | Hoàn thành đủ 3 Chiếu chỉ trong 1 / 10 / 50 / 150 ngày | 🟤 ⚪ 🟡 💎 |
| L5 | Phụng mệnh thần tốc | Hoàn thành đủ 3 Chiếu chỉ trước 9:00 sáng | ⚪ |
| L6 | Chiếu chỉ nối tiếp | Hoàn thành đủ 3 Chiếu chỉ 7 ngày liên tiếp | 🟡 |
| L7–L9 | Nghị sự viên mãn I–III | Hoàn thành đủ 3 Nghị sự tuần trong 1 / 4 / 12 tuần | 🟤 ⚪ 🟡 |
| L10 | Tứ quý thái bình | Hoàn thành đủ 3 Nghị sự tuần 4 tuần liên tiếp | 🟡 |

**Tổng:** 5 + 17 + 7 + 23 + 9 + 6 + 7 + 15 + 5 + 3 + 7 + 8 + 10 = **122 thành tựu**: 55 Thường, 37 Hiếm, 22 Sử thi, 8 Huyền thoại.

### 4.14 Dự kiến cho các mục sau (chưa tính vào 122)

| Mục | Ý tưởng thành tựu |
|---|---|
| Từ vựng | Thuộc 100 / 500 / 1.500 từ; trọn bộ từ một chủ đề; 100 lần đúng từ đồng âm |
| Ngữ pháp | Thuộc mọi mẫu của một cấp; 50 câu sắp xếp đúng; giải thích được (xem hết ví dụ của 30 mẫu) |
| Luyện đề | Hoàn thành đề đầu tiên; đạt điểm đỗ; đạt điểm đỗ ở mọi phần; hoàn thành đề trong thời gian chuẩn |

## 5. Chiếu chỉ hằng ngày và Nghị sự tuần (nhiệm vụ)

Mỗi ngày triều đình ban **3 Chiếu chỉ** (詔勅). Hoàn thành thì nhận Uy vọng; xong cả 3 thì nhận thêm **Ân thưởng**. Bỏ lỡ không bị phạt.

### 5.1 Quy tắc

- **Ba Chiếu chỉ mỗi ngày**, gồm một **Dễ** (+15 Uy vọng), một **Vừa** (+30) và một **Khó** (+50). Xong cả 3 thì được thêm **Ân thưởng +50**. Tổng tối đa 145 Uy vọng/ngày.
- **Đa dạng:** ba Chiếu chỉ trong một ngày không trùng loại hoạt động, ví dụ không có hai cái cùng về flashcard.
- **Làm mới lúc 0:00** theo giờ của thiết bị. Tiến độ trong ngày không chuyển sang hôm sau.
- **Đổi Chiếu chỉ:** mỗi ngày được đổi miễn phí 1 Chiếu chỉ chưa hoàn thành sang một cái khác cùng độ khó.
- **Luôn làm được:** chỉ rút những Chiếu chỉ còn khả thi. Ví dụ khi đã thuộc hết chữ đang có thì không rút "Thuộc 3 chữ mới" nữa.
- **Giống nhau trên mọi thiết bị:** Chiếu chỉ được chọn từ ngày hôm đó cộng một mã ngẫu nhiên riêng của bạn (đồng bộ qua Gist). Tiến độ là tổng hoạt động của mọi thiết bị trong ngày.
- **Tính từ ngày ra mắt:** không có Chiếu chỉ hồi tố cho những ngày trước đó.

### 5.2 Danh sách Chiếu chỉ (18)

**Dễ (+15)**

| ID | Chiếu chỉ | Loại |
|---|---|---|
| QE1 | Chấm 20 thẻ flashcard | Flashcard |
| QE2 | Nghe phát âm 15 lần | Âm thanh |
| QE3 | Mở trang chi tiết của 5 chữ | Danh sách |
| QE4 | Hoàn thành 1 bài trắc nghiệm | Trắc nghiệm |
| QE5 | Ở chế độ ẩn nghĩa, chạm xem lại 10 từ | Từ vựng |
| QE6 | Bấm vào chữ để xem lại nét viết 10 lần | Nét viết |

**Vừa (+30)**

| ID | Chiếu chỉ | Loại | Chỉ rút khi |
|---|---|---|---|
| QM1 | Thuộc 3 chữ mới | Chữ mới | Còn ít nhất 3 chữ chưa thuộc |
| QM2 | Trả lời đúng 30 câu trắc nghiệm | Trắc nghiệm | |
| QM3 | Hoàn thành trắc nghiệm ở 2 buổi khác nhau | Trắc nghiệm | |
| QM4 | Chấm 50 thẻ flashcard | Flashcard | |
| QM5 | Ôn bài cũ: làm trọn một vòng flashcard của một buổi đã thuộc từ 80% | Flashcard | Có buổi đã thuộc từ 80% |
| QM6 | Trả lời đúng 10 câu dạng "nghĩa → Kanji" | Trắc nghiệm | |

**Khó (+50)**

| ID | Chiếu chỉ | Loại | Chỉ rút khi |
|---|---|---|---|
| QH1 | Một bài trắc nghiệm đạt 100% | Trắc nghiệm | |
| QH2 | Chuỗi 15 câu trắc nghiệm đúng liên tiếp | Trắc nghiệm | |
| QH3 | Thuộc 5 chữ mới | Chữ mới | Còn ít nhất 5 chữ chưa thuộc |
| QH4 | Đạt 120 Uy vọng trong ngày (không tính thưởng Chiếu chỉ) | Tổng hợp | |
| QH5 | Phục thù: làm lại buổi có điểm trắc nghiệm thấp nhất và vượt điểm cũ | Trắc nghiệm | Đã có điểm ở ít nhất một buổi |
| QH6 | Một bài trắc nghiệm đạt từ 90% trong dưới 2 phút | Trắc nghiệm | |

Khi có Từ vựng, Ngữ pháp, Luyện đề, mỗi mục thêm Chiếu chỉ riêng vào kho này (ví dụ "Làm một phần đề thi", "Ôn 5 mẫu ngữ pháp").

### 5.3 Giao diện

- **Trang chủ:** thẻ "Chiếu chỉ hôm nay" ngay dưới thẻ Hồ sơ nhà vua. Mỗi Chiếu chỉ một dòng gồm biểu tượng loại, nội dung, thanh tiến độ (ví dụ 12/20), phần thưởng, nút "Đổi" (nếu còn lượt). Chiếu chỉ đã xong có dấu son đóng lên và mờ đi.
- **Hoàn thành một Chiếu chỉ:** thông báo trượt lên giống thành tựu nhưng hình cuộn chiếu chỉ với dấu sáp. Không hiện giữa bài, chờ tới màn hình kết quả.
- **Xong cả 3:** thông báo "Ân thưởng +50" với hiệu ứng cuộn giấy khép lại.
- **Trang Hồ sơ nhà vua:** thêm lịch 5 tuần gần nhất, mỗi ngày một ô màu theo số Chiếu chỉ đã xong (0–3), giống lịch đóng góp của GitHub.

### 5.4 Nghị sự tuần (nhiệm vụ tuần)

Mỗi tuần triều đình mở **Nghị sự** (議事) với 3 mục tiêu lớn hơn, cần học đều nhiều ngày mới xong.

**Quy tắc**

- **Tuần tính từ Thứ Hai 0:00 đến hết Chủ Nhật**, theo giờ thiết bị.
- **3 Nghị sự mỗi tuần**, mỗi cái **+100 Uy vọng**. Xong cả 3 thì được thêm **Đại ân thưởng +150**. Tối đa 450 Uy vọng/tuần.
- **Không trùng loại** với nhau, và **chỉ rút cái còn khả thi**, giống Chiếu chỉ.
- **Mỗi tuần được đổi miễn phí 1 Nghị sự** chưa hoàn thành.
- **Đồng bộ và chống thưởng trùng** như Chiếu chỉ: chọn theo tuần cộng mã ngẫu nhiên của bạn, tiến độ cộng từ mọi thiết bị.
- **Tính từ tuần ra mắt.** Tuần đầu tiên chỉ đếm hoạt động từ lúc cập nhật trở đi.

**Danh sách Nghị sự (12)**

| ID | Nghị sự | Loại | Chỉ rút khi |
|---|---|---|---|
| W1 | Hoàn thành đủ 3 Chiếu chỉ trong 5 ngày | Chiếu chỉ | |
| W2 | Học 6 trên 7 ngày trong tuần | Ngày học | Rút vào tuần mới, trước khi lỡ quá 1 ngày |
| W3 | Thuộc 15 chữ mới | Chữ mới | Còn ít nhất 15 chữ chưa thuộc |
| W4 | Trả lời đúng 200 câu trắc nghiệm | Trắc nghiệm | |
| W5 | Hoàn thành 15 bài trắc nghiệm | Trắc nghiệm | |
| W6 | Đạt 100% ở 3 buổi khác nhau | Trắc nghiệm | |
| W7 | Chấm 300 thẻ flashcard | Flashcard | |
| W8 | Nghe phát âm 150 lần | Âm thanh | |
| W9 | Đạt 800 Uy vọng trong tuần (không tính thưởng nhiệm vụ) | Tổng hợp | |
| W10 | Tổng ôn: làm trắc nghiệm ở mọi buổi đang có | Trắc nghiệm | |
| W11 | Mở khoá 3 thành tựu mới | Thành tựu | Còn ít nhất 10 thành tựu chưa mở |
| W12 | Chuỗi 30 câu trắc nghiệm đúng liên tiếp | Trắc nghiệm | |

Vì phần lớn Nghị sự rơi vào trắc nghiệm, mỗi tuần **tối đa một** Nghị sự loại Trắc nghiệm.

**Giao diện**

- **Thẻ trên trang chủ đổi thành "Chiếu chỉ"** với hai nút chuyển "Hôm nay" / "Tuần này". Phần "Tuần này" ghi số ngày còn lại ("còn 3 ngày").
- **Hoàn thành Nghị sự** có thông báo riêng (cuộn chiếu chỉ viền vàng). **Đại ân thưởng** dùng hiệu ứng lớn hơn Ân thưởng ngày.

---

## 6. Giao diện

### 6.1 Thông báo mở khoá

- **Thẻ trượt từ dưới lên**, không chặn thao tác: ấn tín "đóng" xuống (phóng to rồi thu lại), tên thành tựu, độ hiếm, "+50 Uy vọng". Tự ẩn sau 4 giây; chạm vào để mở trang Hồ sơ.
- **Nhiều thành tựu cùng lúc** (ví dụ thuộc chữ thứ 103 mở cùng lúc K5, A3, C3) thì xếp hàng hiện lần lượt.
- **Âm báo:** một tiếng chuông ngắn tạo bằng Web Audio, nhạc nền tự nhỏ lại. Có công tắc tắt trong Cài đặt.
- **Thông báo không hiện giữa bài trắc nghiệm hay flashcard.** Thành tựu vẫn được ghi ngay, nhưng thông báo chờ tới màn hình kết quả để không phân tâm.

### 6.2 Lễ đăng quang (lên bậc)

Popup lớn giữa màn hình: vương miện của bậc mới, danh xưng tiếng Nhật và tiếng Việt, phần thưởng mở khoá (màu ấn tín, danh hiệu). Có nút "Dùng ngay" để đổi màu ấn tín.

### 6.3 Trang "Hồ sơ nhà vua" (`#/king`)

- **Phần đầu:**
  - vương miện SVG đổi theo bậc, bậc hiện tại, thanh Uy vọng tới bậc kế;
  - danh hiệu đang đeo (bấm để chọn);
  - 6 chỉ số: chữ đã thuộc, chuỗi ngày, tổng ngày học, câu đúng, thẻ đã chấm, lượt nghe.
- **Các tab theo điện:** Tất cả · 宝 · 璽 · 学 · 闘 · 札 · 筆 · 音 · 律 · 時 · 交 · 宮 · 令 · 秘. Trên điện thoại các tab cuộn ngang.
- **Thẻ thành tựu:**
  - ấn tín (chữ Hán của điện, khắc trong con dấu màu theo độ hiếm), tên, điều kiện;
  - thanh tiến độ khi chưa đạt (ví dụ "37/50 chữ");
  - ngày mở khoá khi đã đạt;
  - thành tựu nhiều bậc hiện sao I–V;
  - thành tựu ẩn chưa mở hiện "？？？" và câu gợi ý.
- **Bộ lọc:** Đã đạt / Chưa đạt / Sắp đạt (từ 75% trở lên).
- **Tổng kết:** "47/122 ấn tín · 39%".

### 6.4 Lối vào

Không thêm nút tròn trên thanh đầu trang. Lối vào gồm:
- **Tab "Hồ sơ" (biểu tượng 王) trên thanh điều hướng**, nằm sau các mục học: ở thanh tab đáy màn hình trên điện thoại và máy tính bảng, và ở thanh chữ phía trên khi cửa sổ rộng. Thanh tab đáy sẽ có 6 ô.
- **Chấm đỏ trên tab "Hồ sơ"** khi có thành tựu mới chưa xem, hoặc còn Chiếu chỉ hôm nay chưa xong sau 20:00.
- **Trang chủ:** thẻ "Hồ sơ nhà vua" (vương miện, bậc, thanh Uy vọng, số ấn tín) và thẻ "Chiếu chỉ" nằm trên các mục học.

---

## 7. Dữ liệu và đồng bộ

Lưu trong cùng đối tượng `progress` đang đồng bộ qua Gist, thêm khóa `king`:

```text
king: {
  dev: {                       // mỗi thiết bị một nhánh, chỉ thiết bị đó ghi
    "<deviceId>": {
      c: { flip: 120, ans: 340, right: 290, quiz: 18, perfect: 4, listen: 210, replay: 33, ... },
      xp: { "2026-11-15": 85, ... },  // Uy vọng học tập theo ngày, đã áp giới hạn
      day: { "2026-11-15": { flip: 20, right: 31, quiz: 2, listen: 9, newKnown: 3, ... } }  // giữ 45 ngày
    }
  },
  seed: 739104,                                // mã ngẫu nhiên để chọn Chiếu chỉ, tạo một lần
  reroll: { "2026-11-15": ["QM4", 1794650000000] },   // Chiếu chỉ đã đổi trong ngày
  quests: { "2026-11-15": ["QE1", "QM2"] },    // Chiếu chỉ đã hoàn thành theo ngày
  wreroll: { "2026-W46": ["W7", 1794650000000] },     // Nghị sự đã đổi trong tuần
  wquests: { "2026-W46": ["W4"] },             // Nghị sự đã hoàn thành theo tuần
  seen:   { kanji: [...], vocabSessions: [...], heard: [...], musicStyles: [...] },  // tập hợp chỉ thêm
  quizHist: { "n5-1": { min: 9, max: 21 } },
  best:   { chain: 37, chainNow: 12 },
  unlocked: { "K1": 1794643461942, ... },      // id -> thời điểm mở khoá
  title: ["S17", 1794650000000],               // danh hiệu đang đeo + thời điểm chọn
  hanko: ["gold", 1794650000000]               // màu ấn tín đang dùng
}
```

**Quy tắc gộp khi đồng bộ:**
- **Bộ đếm:** cộng tổng các nhánh thiết bị. Mỗi nhánh chỉ tăng, khi gộp lấy giá trị lớn hơn của cùng nhánh, nên không bị đếm trùng.
- **Uy vọng theo ngày:** cộng giữa các thiết bị. Chuỗi ngày và tổng ngày học tính từ hợp các ngày có Uy vọng.
- **Tập hợp:** lấy hợp.
- **Thành tựu đã mở:** lấy hợp, giữ thời điểm sớm nhất.
- **Danh hiệu, màu ấn tín, lượt đổi Chiếu chỉ:** lấy lựa chọn có thời điểm mới hơn.
- **Chiếu chỉ, Nghị sự đã hoàn thành:** lấy hợp theo từng ngày, từng tuần. `seed`: giữ giá trị của thiết bị tạo trước.
- **Uy vọng từ thành tựu và Chiếu chỉ không cộng vào bộ đếm**, mà tính lại từ danh sách đã mở và đã hoàn thành. Nhờ vậy khi hai thiết bị cùng phát hiện một thành tựu trước khi kịp đồng bộ, phần thưởng vẫn chỉ được tính một lần.

**Dung lượng:** khoảng 5–15 KB sau một năm học, vẫn nhỏ so với giới hạn của Gist.

**Mở khoá hồi tố:** lần đầu chạy phiên bản mới, hệ thống quét tiến độ sẵn có và mở ngay những gì đã đạt (Kho báu, Bộ sưu tập, Tốt nghiệp, Bách phát bách trúng, Toàn thắng). Các bộ đếm chưa từng được ghi (thẻ đã lật, lượt nghe, chuỗi ngày) bắt đầu từ 0, vì không có dữ liệu cũ để tính.

---

## 8. Chống "cày"

- Giới hạn Uy vọng theo ngày cho từng nguồn (mục 2.1).
- Trắc nghiệm: chỉ tính lần chọn đầu của mỗi câu; bỏ dở giữa chừng không tính hoàn thành.
- Flashcard: chỉ tính khi bấm "Đã thuộc/Chưa thuộc", không tính lật qua lật lại.
- Nghe: lượt nghe chỉ tính Uy vọng nếu cách lượt trước ít nhất 1 giây; thành tựu ẩn H4, H5 vẫn đếm mọi lượt.
- Không trừ điểm, nên cũng không có động cơ khai gian để "gỡ" điểm.

---

## 9. Kiến trúc code

- **`js/king.js`** (mới): bảng thành tựu, bậc, Uy vọng, kiểm tra điều kiện, thông báo, trang `#/king`. Đăng ký như một mục giống `kanji.js`, nhưng không hiện trên thanh điều hướng.
- **`App.emit(event, data)`** (mới trong `core.js`): các mục học phát sự kiện, `king.js` lắng nghe. Các sự kiện:
  - `kanji:known`, `kanji:view`, `stroke:replay`, `stroke:done`;
  - `flash:grade`, `flash:roundEnd`;
  - `quiz:answer`, `quiz:end`;
  - `audio:play`, `vocab:open`, `vocab:reveal`;
  - `setting:change`, `sync:ok`, `backup:download`.

  Các mục sau này (Từ vựng, Ngữ pháp, Luyện đề) chỉ cần phát sự kiện, không phải sửa logic thành tựu.
- **Kho Chiếu chỉ cũng khai báo bằng dữ liệu:** `id, độ khó, loại, nội dung VI/EN, hàm khả thi, hàm tiến độ trong ngày`.
- **Bảng thành tựu khai báo bằng dữ liệu:** mỗi thành tựu có `id, điện, tên VI/EN, mô tả VI/EN, độ hiếm, ẩn?, gợi ý, hàm tiến độ → [hiện tại, mục tiêu]`. Thêm thành tựu mới chỉ cần thêm một dòng.
- **Song ngữ:** mọi tên, mô tả, gợi ý có bản tiếng Anh. Tên các bậc giữ tiếng Nhật ở cả hai bản.
- **Tương thích:** vẫn viết ES5 cho Via. Hoạt ảnh dùng CSS transition, không dùng thư viện.

---

## 10. Các bước làm (sau khi bạn duyệt)

| Bước | Nội dung | Kiểm tra |
|---|---|---|
| 1 | Mô hình dữ liệu, `App.emit`, Uy vọng, bậc, gộp đồng bộ | Gộp hai bản tiến độ giả lập từ 2 thiết bị cho ra đúng tổng |
| 2 | Bảng 122 thành tựu, kiểm tra điều kiện, mở khoá hồi tố | Chạy kịch bản tự động: thuộc 103 chữ, làm bài 100%, giả lập chuỗi ngày |
| 2b | Chiếu chỉ và Nghị sự tuần: chọn theo ngày/tuần, tiến độ, đổi, thưởng, thẻ trên trang chủ | Giả lập đổi ngày, sang tuần mới; 2 thiết bị cùng ngày ra cùng nhiệm vụ và không thưởng trùng |
| 3 | Thông báo mở khoá, Lễ đăng quang, âm báo | Xem trên khổ điện thoại và máy tính bảng |
| 4 | Trang Hồ sơ, tab "Hồ sơ" trên thanh điều hướng, thẻ trên trang chủ, chấm báo | Ở giao diện sáng, tối, tiếng Việt, tiếng Anh; thanh tab 6 ô trên khổ 375px |
| 5 | Danh hiệu và màu ấn tín | Đổi màu logo trên thanh đầu trang và biểu tượng trên trang |
| 6 | Deploy | Kiểm tra trên trang thật |

---

## 11. Những gì hệ thống này không làm

- **Không có bảng xếp hạng hay so sánh với người khác.** Web chỉ phục vụ một người học và không có máy chủ.
- **Không khoá nội dung học sau thành tựu.** Phần thưởng chỉ mang tính trang trí (danh hiệu, màu ấn tín).
- **Không đổi màu biểu tượng web trên tab trình duyệt và màn hình chính theo màu ấn tín.** Biểu tượng đó cố định.

---

## 12. Quyết định đã chốt

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Tên "Uy vọng" và các danh xưng | Giữ như đề xuất |
| 2 | Phần thưởng | Danh hiệu và màu ấn tín, như đề xuất |
| 3 | Thành tựu thức khuya (T2, H7) | Giữ |
| 4 | Âm báo khi mở khoá | Bật sẵn, tắt được trong Cài đặt |
| 5 | Mức Uy vọng và giới hạn ngày | Giữ như mục 2.1 |
| 6 | Lối vào | Thêm tab "Hồ sơ" trên thanh điều hướng (mục 6.4) |
| 7 | Danh sách thành tựu | Giữ như đề xuất |
| 8 | Số Chiếu chỉ mỗi ngày | 3 (Dễ, Vừa, Khó) |
| 9 | Giờ làm mới | 0:00 |
| 10 | Nhiệm vụ tuần | Thêm "Nghị sự tuần" (mục 5.4) |
