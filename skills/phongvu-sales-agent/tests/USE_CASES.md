# Phong Vũ Sales Agent — Use Case Test Specification

Tài liệu định nghĩa toàn bộ use case test cho hệ thống skill Phong Vũ Sales Agent.

## Cấu trúc test

Mỗi use case bao gồm:
- **ID**: Mã test duy nhất
- **Skill**: Skill được test
- **Input**: Câu hỏi/trigger từ người dùng
- **Intent**: Ý định được phân loại
- **Expected routing**: Skill nào xử lý
- **Expected behavior**: Hành vi mong đợi
- **Expected output format**: Format output bắt buộc
- **Edge case**: Có phải edge case không

---

## 1. phongvu-sales-agent (Orchestrator)

### UC-ORC-001: Phân loại ý định đơn giản — Giá sản phẩm

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent |
| **Input** | "SSD Samsung 990 Pro giá bao nhiêu?" |
| **Intent** | Giá sản phẩm cụ thể |
| **Expected routing** | Tự xử lý — gọi `search_products` trực tiếp |
| **Expected behavior** | Gọi 1 tool, trả lời ngay, không spawn sub-skill |
| **Expected output** | Giá VND có dấu phân cách + link phongvu.vn + KM (nếu có) |
| **Follow-up** | Gợi ý hành động tiếp theo |

### UC-ORC-002: Phân loại ý định đơn giản — Kiểm tra tồn kho

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent |
| **Input** | "Laptop Gigabyte A16 còn hàng không?" |
| **Intent** | Kiểm tra tồn kho |
| **Expected routing** | Tự xử lý — gọi `check_stock` hoặc `get_product_detail` |
| **Expected behavior** | Gọi 1 tool, trả lời ngay |
| **Expected output** | Trạng thái còn/hết hàng + giá hiện tại |

### UC-ORC-003: Phân loại ý định — Tìm kiếm + lọc ngân sách

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent |
| **Input** | "Tìm laptop gaming dưới 30 triệu" |
| **Intent** | Tìm kiếm sản phẩm theo ngân sách |
| **Expected routing** | Spawn `phongvu-researcher` |
| **Expected behavior** | Chuyển yêu cầu cho researcher với filter: query="laptop gaming", price_lte=30000000 |
| **Expected output** | Danh sách sản phẩm đã lọc theo ngân sách |

### UC-ORC-004: Phân loại ý định — So sánh sản phẩm

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent |
| **Input** | "So sánh laptop Asus và Lenovo tầm 20 triệu" |
| **Intent** | So sánh sản phẩm |
| **Expected routing** | Pipeline: `phongvu-researcher` → `phongvu-comparator` |
| **Expected behavior** | Researcher tìm sản phẩm → Comparator xây bảng so sánh |
| **Expected output** | Bảng so sánh markdown + khuyến nghị |

### UC-ORC-005: Phân loại ý định — Tư vấn tổng hợp

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent |
| **Input** | "Tư vấn mua laptop cho sinh viên, budget 20 triệu" |
| **Intent** | Tư vấn mua hàng tổng hợp |
| **Expected routing** | Full pipeline: researcher → comparator → advisor |
| **Expected behavior** | 3 sub-skills chạy theo chuỗi, mỗi skill nhận output từ skill trước |
| **Expected output** | Câu trả lời hoàn chỉnh: sản phẩm phù hợp + so sánh + khuyến nghị + phụ kiện |

### UC-ORC-006: Phân loại ý định — Hỗ trợ hậu mãi

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent |
| **Input** | "Laptop mua ở Phong Vũ bảo hành bao lâu?" |
| **Intent** | Câu hỏi chính sách/hậu mãi |
| **Expected routing** | Spawn `phongvu-support` |
| **Expected behavior** | Support đọc RAG data và trả lời chính sách |
| **Expected output** | Thông tin chính sách + nguồn + gợi ý hành động |

### UC-ORC-007: Phân loại ý định — Gợi ý phụ kiện

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent |
| **Input** | "Gợi ý phụ kiện cho laptop Gigabyte A16" |
| **Intent** | Gợi ý phụ kiện kèm theo |
| **Expected routing** | Spawn `phongvu-advisor` |
| **Expected behavior** | Advisor check stock + gọi get_recommendations |
| **Expected output** | Danh sách phụ kiện tương thích + giá + link |

### UC-ORC-008: Song song khi độc lập

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent |
| **Input** | "So sánh SKU 123 và SKU 456, và kiểm tra SKU 789 còn hàng không" |
| **Intent** | So sánh + kiểm tra tồn kho (độc lập) |
| **Expected routing** | Song song: `comparator(123, 456)` + `check_stock(789)` |
| **Expected behavior** | 2 task chạy đồng thời, tổng hợp kết quả |
| **Expected output** | Bảng so sánh + trạng thái tồn kho SKU 789 |

---

## 2. phongvu-researcher

### UC-RSR-001: Tìm kiếm cơ bản không filter

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | Tìm "laptop" |
| **Params** | `{ query: "laptop", return_filterable: true }` |
| **Expected behavior** | Gọi search_products, trả về filter options (brands, attributes, price range) |
| **Expected output** | JSON với `products[]`, `total_found`, filter options |

### UC-RSR-002: Tìm kiếm với price_lte (giá tối đa)

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Laptop dưới 20 triệu" |
| **Params** | `{ query: "laptop", filter: { priceLte: 20000000 }, return_filterable: true }` |
| **Expected behavior** | Chỉ thêm priceLte, không thêm priceGte |
| **Expected output** | Danh sách laptop ≤ 20 triệu |

### UC-RSR-003: Tìm kiếm với price_gte (giá tối thiểu)

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Laptop trên 15 triệu" |
| **Params** | `{ query: "laptop", filter: { priceGte: 15000000 }, return_filterable: true }` |
| **Expected behavior** | Chỉ thêm priceGte |
| **Expected output** | Danh sách laptop ≥ 15 triệu |

### UC-RSR-004: Tìm kiếm với khoảng giá (price_gte + price_lte)

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Laptop từ 15 đến 25 triệu" |
| **Params** | `{ query: "laptop", filter: { priceGte: 15000000, priceLte: 25000000 }, return_filterable: true }` |
| **Expected behavior** | Thêm cả 2 filter price |
| **Expected output** | Danh sách laptop 15-25 triệu |

### UC-RSR-005: Tìm kiếm với brand filter

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Laptop Lenovo" |
| **Params** | `{ query: "laptop", filter: { brands: ["lenovo"] }, return_filterable: true }` |
| **Expected behavior** | Brand code viết thường, không dấu |
| **Expected output** | Chỉ sản phẩm Lenovo |

### UC-RSR-006: Tìm kiếm với has_promotions

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Laptop đang giảm giá" |
| **Params** | `{ query: "laptop", filter: { hasPromotions: true }, return_filterable: true }` |
| **Expected behavior** | Chỉ trả về sản phẩm có KM |
| **Expected output** | Danh sách laptop có KM + % giảm giá |

### UC-RSR-007: Tìm kiếm với attributes (nhu cầu sử dụng)

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Laptop cho gaming" |
| **Params** | `{ query: "laptop", filter: { attributes: [{ code: "nhucausudung", optionIds: ["26695"] }] }, return_filterable: true }` |
| **Expected behavior** | Lọc theo attribute nhucausudung = Gaming (26695) |
| **Expected output** | Chỉ laptop gaming |

### UC-RSR-008: Tìm kiếm kết hợp nhiều filter

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Laptop gaming Lenovo dưới 25 triệu có KM" |
| **Params** | `{ query: "laptop gaming", filter: { priceLte: 25000000, brands: ["lenovo"], hasPromotions: true, attributes: [{ code: "nhucausudung", optionIds: ["26695"] }] }, return_filterable: true }` |
| **Expected behavior** | Kết hợp tất cả filter cùng lúc |
| **Expected output** | Danh sách laptop gaming Lenovo ≤ 25tr có KM |

### UC-RSR-009: Sắp xếp theo giá thấp đến cao

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Tìm laptop giá rẻ nhất" |
| **Params** | `{ query: "laptop", sorting: { sort: "SORT_BY_PRICE", order: "ORDER_BY_ASCENDING" }, return_filterable: true }` |
| **Expected behavior** | Sắp xếp giá tăng dần |
| **Expected output** | Danh sách laptop từ rẻ đến đắt |

### UC-RSR-010: Sắp xếp theo KM cao nhất

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Laptop giảm giá nhiều nhất" |
| **Params** | `{ query: "laptop", sorting: { sort: "SORT_BY_DISCOUNT_PERCENT", order: "ORDER_BY_DESCENDING" }, return_filterable: true }` |
| **Expected behavior** | Sắp xếp theo % giảm giá giảm dần |
| **Expected output** | Danh sách laptop KM cao nhất |

### UC-RSR-011: Dùng return_filterable ở lần search đầu

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | Bất kỳ search nào |
| **Params** | Luôn có `return_filterable: true` ở lần search đầu |
| **Expected behavior** | API trả về filter options trong `result.filter` (brands, attributes, price range) |
| **Expected output** | Response chứa `filter.brands[]`, `filter.attributes[]`, `filter.priceGte/priceLte` |

### UC-RSR-012: Refine search bằng filter_options

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Laptop CPU Intel thế hệ 13" |
| **Expected behavior** | Bước 1: search "laptop" + return_filterable → lấy optionId cho laptop_thehecpu. Bước 2: search lại với attributes filter |
| **Expected output** | Danh sách laptop đã lọc theo thế hệ CPU |

### UC-RSR-013: Tìm không thấy kết quả

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Điện thoại Vertu" (không có trên Phong Vũ) |
| **Expected behavior** | Trả về `total_found: 0` + `suggestions` với query thay thế |
| **Expected output** | `{ total_found: 0, products: [], suggestions: ["Có thể bạn quan tâm: điện thoại Samsung, iPhone..."] }` |

### UC-RSR-014: Kết quả quá nhiều — cần filter sâu hơn

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Laptop" (rất nhiều kết quả) |
| **Expected behavior** | Nếu kết quả > 50, gợi ý filter thêm (brand, nhu cầu, khoảng giá) |
| **Expected output** | Danh sách + suggestions để filter sâu hơn |

### UC-RSR-015: Kết quả quá ít — thử query rộng hơn

| Field | Value |
|-------|-------|
| **Skill** | phongvu-researcher |
| **Input** | "Laptop gaming Asus ROG Strix G16 i9 13900HX RTX 4090" (quá cụ thể) |
| **Expected behavior** | Nếu kết quả < 3, thử query rộng hơn (bỏ bớt filter) |
| **Expected output** | Danh sách sản phẩm + suggestions cho query rộng hơn |

---

## 3. phongvu-comparator

### UC-CMP-001: So sánh 2 sản phẩm cơ bản

| Field | Value |
|-------|-------|
| **Skill** | phongvu-comparator |
| **Input** | 2 SKU hợp lệ |
| **Params** | `compare_products({ skus: ["SKU1", "SKU2"] })` |
| **Expected behavior** | Gọi compare_products trước, nếu thiếu info thì gọi thêm get_product_detail |
| **Expected output** | JSON với `comparison_table` (markdown), `price_rank`, `highlights` |

### UC-CMP-002: So sánh 3 sản phẩm

| Field | Value |
|-------|-------|
| **Skill** | phongvu-comparator |
| **Input** | 3 SKU hợp lệ |
| **Params** | `compare_products({ skus: ["SKU1", "SKU2", "SKU3"] })` |
| **Expected behavior** | So sánh 3 sản phẩm, bảng có 3 cột |
| **Expected output** | Bảng so sánh 3 sản phẩm + ranking + highlights |

### UC-CMP-003: So sánh với mục đích Gaming

| Field | Value |
|-------|-------|
| **Skill** | phongvu-comparator |
| **Input** | "So sánh 2 laptop này cho gaming" + 2 SKU |
| **Expected behavior** | Ưu tiên specs: CPU, GPU, RAM, tần số quét màn hình |
| **Expected output** | Bảng so sánh focus vào specs gaming |

### UC-CMP-004: So sánh với mục đích Văn phòng

| Field | Value |
|-------|-------|
| **Skill** | phongvu-comparator |
| **Input** | "So sánh cho công việc văn phòng" + 2 SKU |
| **Expected behavior** | Ưu tiên specs: pin, trọng lượng, bàn phím |
| **Expected output** | Bảng so sánh focus vào specs văn phòng |

### UC-CMP-005: So sánh với mục đích Đồ họa

| Field | Value |
|-------|-------|
| **Skill** | phongvu-comparator |
| **Input** | "So sánh cho đồ họa, edit video" + 2 SKU |
| **Expected behavior** | Ưu tiên specs: màn hình (độ phủ màu, độ phân giải), GPU, RAM |
| **Expected output** | Bảng so sánh focus vào specs đồ họa |

### UC-CMP-006: Thiếu SKU — cần tìm kiếm bổ sung

| Field | Value |
|-------|-------|
| **Skill** | phongvu-comparator |
| **Input** | "So sánh laptop Asus và Lenovo" (chỉ có tên, không có SKU) |
| **Expected behavior** | Gọi `search_products` để tìm SKU → sau đó gọi `compare_products` |
| **Expected output** | Bảng so sánh sau khi resolve SKU |

### UC-CMP-007: SKU không hợp lệ

| Field | Value |
|-------|-------|
| **Skill** | phongvu-comparator |
| **Input** | 1 SKU hợp lệ + 1 SKU không tồn tại |
| **Expected behavior** | Báo lỗi cho skill cha, thông báo SKU nào không tìm thấy |
| **Expected output** | `{ warnings: ["SKU xxxxx không tìm thấy"] }` + so sánh sản phẩm còn lại |

### UC-CMP-008: Một sản phẩm hết hàng

| Field | Value |
|-------|-------|
| **Skill** | phongvu-comparator |
| **Input** | 2 SKU, 1 hết hàng |
| **Expected behavior** | Vẫn so sánh bình thường, đánh dấu sản phẩm hết hàng trong `warnings` |
| **Expected output** | Bảng so sánh + `warnings: ["SP2 đang hết hàng"]` |

### UC-CMP-009: Không spam tất cả specs

| Field | Value |
|-------|-------|
| **Skill** | phongvu-comparator |
| **Input** | So sánh 2 laptop |
| **Expected behavior** | Chỉ chọn specs có sự khác biệt giữa các sản phẩm, không liệt kê tất cả |
| **Expected output** | Bảng so sánh gọn, focus vào điểm khác biệt |

### UC-CMP-010: Output format chuẩn

| Field | Value |
|-------|-------|
| **Skill** | phongvu-comparator |
| **Input** | Bất kỳ so sánh nào |
| **Expected output format** | `{ products_compared, all_in_stock, comparison_table, price_rank, highlights, warnings }` |
| **Expected behavior** | Luôn trả JSON kèm `comparison_table` dạng markdown |

---

## 4. phongvu-advisor

### UC-ADV-001: Tư vấn tổng hợp từ researcher + comparator

| Field | Value |
|-------|-------|
| **Skill** | phongvu-advisor |
| **Input** | Data từ researcher (danh sách SP) + comparator (bảng so sánh) |
| **Expected behavior** | Nhận data → check stock top pick → viết tư vấn hoàn chỉnh |
| **Expected output** | Markdown: tóm tắt nhu cầu + sản phẩm phù hợp + bảng so sánh + khuyến nghị + phụ kiện |

### UC-ADV-002: Check stock trước khi tư vấn

| Field | Value |
|-------|-------|
| **Skill** | phongvu-advisor |
| **Input** | Top pick product |
| **Expected behavior** | Gọi `check_stock` cho sản phẩm top pick trước khi tư vấn |
| **Expected output** | Xác nhận còn hàng hoặc gợi ý thay thế nếu hết |

### UC-ADV-003: Top pick hết hàng — tìm thay thế

| Field | Value |
|-------|-------|
| **Skill** | phongvu-advisor |
| **Input** | Top pick sản phẩm hết hàng |
| **Expected behavior** | Gọi `get_recommendations` để tìm sản phẩm tương tự |
| **Expected output** | Tư vấn với sản phẩm thay thế + lý do gợi ý |

### UC-ADV-004: Gợi ý phụ kiện kèm theo

| Field | Value |
|-------|-------|
| **Skill** | phongvu-advisor |
| **Input** | Sản phẩm khách đã chọn |
| **Expected behavior** | Gọi `get_recommendations` → lọc phụ kiện tương thích |
| **Expected output** | Danh sách phụ kiện: tên + giá + link + lý do gợi ý |

### UC-ADV-005: Khách hỏi câu đơn giản — không cần full tư vấn

| Field | Value |
|-------|-------|
| **Skill** | phongvu-advisor |
| **Input** | "Giá laptop X bao nhiêu?" (câu hỏi đơn giản) |
| **Expected behavior** | Trả lời ngay, không tạo full advisory markdown |
| **Expected output** | Giá + link + KM, không có bảng so sánh hay khuyến nghị dài |

### UC-ADV-006: Khách đã chọn sản phẩm cụ thể

| Field | Value |
|-------|-------|
| **Skill** | phongvu-advisor |
| **Input** | "Tôi muốn mua laptop Gigabyte A16, check giúp còn hàng không" |
| **Expected behavior** | Chỉ check stock + gợi ý phụ kiện, không cần tư vấn chọn sản phẩm |
| **Expected output** | Trạng thái tồn kho + danh sách phụ kiện gợi ý |

### UC-ADV-007: Budget quá thấp

| Field | Value |
|-------|-------|
| **Skill** | phongvu-advisor |
| **Input** | Budget 5 triệu muốn mua laptop gaming |
| **Expected behavior** | Vẫn tìm sản phẩm gần nhất + đề xuất "nếu tăng budget lên X sẽ được SP tốt hơn" |
| **Expected output** | Sản phẩm gần budget + gợi ý tăng budget |

### UC-ADV-008: Yêu cầu mơ hồ — cần hỏi lại

| Field | Value |
|-------|-------|
| **Skill** | phongvu-advisor |
| **Input** | "Tư vấn mua laptop" (không rõ mục đích, ngân sách) |
| **Expected behavior** | Hỏi lại với gợi ý cụ thể: "Bạn cần laptop cho mục đích gì: gaming, văn phòng, hay đồ họa?" |
| **Expected output** | Câu hỏi làm rõ + gợi ý options |

### UC-ADV-009: Output format chuẩn

| Field | Value |
|-------|-------|
| **Skill** | phongvu-advisor |
| **Input** | Bất kỳ tư vấn nào |
| **Expected output format** | Markdown với sections: Sản phẩm phù hợp → So sánh nhanh → Khuyến nghị → Phụ kiện gợi ý |
| **Expected behavior** | Luôn kết thúc bằng câu hỏi mở |

### UC-ADV-010: Tôn trọng ngân sách khách

| Field | Value |
|-------|-------|
| **Skill** | phongvu-advisor |
| **Input** | Budget 20 triệu |
| **Expected behavior** | Không đẩy sản phẩm vượt budget trừ khi khách hỏi |
| **Expected output** | Chỉ sản phẩm ≤ 20 triệu trong khuyến nghị chính |

---

## 5. phongvu-support

### UC-SUP-001: Câu hỏi bảo hành cơ bản

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Laptop mua ở Phong Vũ bảo hành bao lâu?" |
| **Expected behavior** | Đọc `14-chinh-sach-bao-hanh.md` từ RAG data |
| **Expected output** | Thời gian bảo hành theo hãng (12-24 tháng) + nguồn + gợi ý check bảo hành SP cụ thể |

### UC-SUP-002: Câu hỏi đổi trả

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Tôi mua laptop 3 ngày bị lỗi, muốn đổi trả được không?" |
| **Expected behavior** | Đọc `12-doi-tra-hoan-tien.md` |
| **Expected output** | Điều kiện đổi trả + thời hạn + quy trình + hướng dẫn mang đến cửa hàng |

### UC-SUP-003: Câu hỏi thanh toán

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Phong Vũ có hỗ trợ trả góp không?" |
| **Expected behavior** | Đọc `15-chinh-sach-tra-gop.md` + `08-chinh-sach-thanh-toan.md` |
| **Expected output** | Các hình thức trả góp + điều kiện + hướng dẫn |

### UC-SUP-004: Câu hỏi giao hàng

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Giao hàng mất mấy ngày?" |
| **Expected behavior** | Đọc `10-giao-hang-ho-ky-thuat.md` |
| **Expected output** | Thời gian giao hàng + phí ship (nếu có) + khu vực hỗ trợ |

### UC-SUP-005: Câu hỏi lắp đặt

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Phong Vũ có hỗ trợ lắp đặt PC không?" |
| **Expected behavior** | Đọc `11-lap-dat-nang-cap.md` |
| **Expected output** | Dịch vụ lắp đặt + nâng cấp + chi phí (nếu có) |

### UC-SUP-006: Câu hỏi tích điểm / thành viên

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Làm sao tích điểm Phong Vũ?" |
| **Expected behavior** | Đọc `22-tich-diem-loyalty.md` + `20-the-thanh-vien.md` |
| **Expected output** | Quy trình tích điểm + cách đổi điểm + quyền lợi thành viên |

### UC-SUP-007: Câu hỏi khiếu nại

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Tôi muốn khiếu nại dịch vụ" |
| **Expected behavior** | Đọc `06-giai-quyet-khieu-nai.md` |
| **Expected output** | Quy trình khiếu nại + kênh liên hệ + thời gian giải quyết |

### UC-SUP-008: Câu hỏi đặt cọc giữ hàng

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Tôi muốn đặt cọc giữ hàng được không?" |
| **Expected behavior** | Đọc `17-dat-coc-giu-hang.md` |
| **Expected output** | Chính sách đặt cọc + quy trình + điều kiện |

### UC-SUP-009: Câu hỏi VNPay QR

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Thanh toán VNPay QR ở Phong Vũ như thế nào?" |
| **Expected behavior** | Đọc `16-huong-dan-vnpay-qr.md` |
| **Expected output** | Hướng dẫn thanh toán VNPay QR từng bước |

### UC-SUP-010: Câu hỏi doanh nghiệp / B2B

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Công ty tôi muốn mua sỉ, có chính sách gì không?" |
| **Expected behavior** | Đọc `21-doanh-nghiep-than-thiet.md` |
| **Expected output** | Chính sách doanh nghiệp + liên hệ B2B |

### UC-SUP-011: Câu hỏi sửa chữa

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Laptop hỏng, Phong Vũ có sửa không?" |
| **Expected behavior** | Đọc `19-dich-vu-sua-chua.md` |
| **Expected output** | Dịch vụ sửa chữa + bảo trì + chi phí + quy trình |

### UC-SUP-012: Câu hỏi bảo mật dữ liệu

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Phong Vũ bảo mật thông tin khách hàng như thế nào?" |
| **Expected behavior** | Đọc `02-bao-mat-du-lieu.md` |
| **Expected output** | Chính sách bảo mật + quyền lợi khách hàng |

### UC-SUP-013: Thông tin không có trong RAG data

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Phong Vũ có chương trình khuyến mãi tháng 7 không?" |
| **Expected behavior** | Thử webfetch `https://help.phongvu.vn/llms-full.txt` → nếu không có → hướng dẫn liên hệ hotline |
| **Expected output** | Thông tin (nếu có) hoặc hướng dẫn liên hệ 1800.6867 / fanpage |

### UC-SUP-014: Câu hỏi mua hàng (chuyển hướng)

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "Laptop nào đáng mua nhất tầm 20 triệu?" |
| **Expected behavior** | Nhận ra đây là câu hỏi mua hàng, không phải hỗ trợ → chuyển sang `phongvu-sales-agent` hoặc `phongvu-researcher` |
| **Expected output** | Chuyển hướng đúng skill |

### UC-SUP-015: Câu hỏi so sánh sản phẩm (chuyển hướng)

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | "So sánh laptop Asus và Dell" |
| **Expected behavior** | Nhận ra đây là câu hỏi so sánh → chuyển sang `phongvu-comparator` |
| **Expected output** | Chuyển hướng đúng skill |

### UC-SUP-016: Không chắc chắn thông tin

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | Câu hỏi mà RAG data không có câu trả lời rõ ràng |
| **Expected behavior** | Không bịa thông tin → hướng dẫn liên hệ hotline 1800.6867 |
| **Expected output** | "Bạn có thể liên hệ tổng đài 1800.6867 để được hỗ trợ chính xác nhất" |

### UC-SUP-017: Thông tin có thể đã thay đổi

| Field | Value |
|-------|-------|
| **Skill** | phongvu-support |
| **Input** | Câu hỏi về chính sách có thể đã cập nhật |
| **Expected behavior** | Khuyến nghị khách xác nhận qua hotline hoặc cửa hàng |
| **Expected output** | Thông tin từ RAG + lưu ý "Chính sách có thể đã thay đổi, bạn vui lòng xác nhận qua..." |

---

## 6. Edge Cases tổng hợp

### UC-EDGE-001: Tìm không thấy sản phẩm

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent (orchestrator) |
| **Input** | Tìm sản phẩm không tồn tại trên Phong Vũ |
| **Expected behavior** | Gợi ý từ khóa khác hoặc sản phẩm tương tự |
| **Expected output** | "Không tìm thấy sản phẩm này. Có thể bạn quan tâm: [sản phẩm tương tự]" |

### UC-EDGE-002: Hết hàng

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent (orchestrator) |
| **Input** | Sản phẩm khách muốn mua hết hàng |
| **Expected behavior** | Báo rõ + gợi ý sản phẩm thay thế qua `get_recommendations` |
| **Expected output** | "Sản phẩm tạm hết hàng. Bạn có thể quan tâm: [sản phẩm thay thế]" |

### UC-EDGE-003: API lỗi

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent (orchestrator) |
| **Input** | API trả về lỗi hoặc timeout |
| **Expected behavior** | Xin lỗi khách + đề nghị thử lại sau |
| **Expected output** | "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút." |

### UC-EDGE-004: SKU không hợp lệ

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent (orchestrator) |
| **Input** | SKU không tồn tại hoặc sai format |
| **Expected behavior** | Hỏi lại khách hoặc tìm kiếm lại theo tên sản phẩm |
| **Expected output** | "Không tìm thấy sản phẩm với mã này. Bạn có thể cho mình tên sản phẩm không?" |

### UC-EDGE-005: Khách hỏi ngôn ngữ khác tiếng Việt

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent (orchestrator) |
| **Input** | Câu hỏi bằng tiếng Anh |
| **Expected behavior** | Vẫn trả lời bằng tiếng Việt (theo quy tắc skill) |
| **Expected output** | Response tiếng Việt |

### UC-EDGE-006: Câu hỏi không liên quan mua hàng

| Field | Value |
|-------|-------|
| **Skill** | phongvu-sales-agent (orchestrator) |
| **Input** | "Hôm nay thời tiết thế nào?" |
| **Expected behavior** | Không kích hoạt skill, trả lời bình thường hoặc từ chối nhẹ nhàng |
| **Expected output** | "Mình là trợ lý bán hàng Phong Vũ, mình chỉ hỗ trợ về sản phẩm và dịch vụ thôi ạ." |

---

## 7. Format & Style Tests

### UC-FMT-001: Giá hiển thị VND có dấu phân cách

| Field | Value |
|-------|-------|
| **Applies to** | Tất cả skills hiển thị giá |
| **Input** | Sản phẩm giá 28290000 |
| **Expected output** | `28,290,000đ` (không phải `28290000đ` hay `28.290.000đ`) |

### UC-FMT-002: Link mua hàng đúng format

| Field | Value |
|-------|-------|
| **Applies to** | Tất cả skills hiển thị link |
| **Input** | Sản phẩm có url field |
| **Expected output** | `https://phongvu.vn/{canonical}` (lấy từ field `url` trong response) |

### UC-FMT-003: Khuyến mãi highlight

| Field | Value |
|-------|-------|
| **Applies to** | Tất cả skills hiển thị KM |
| **Input** | Sản phẩm có discount > 0 |
| **Expected output** | Highlight bằng emoji hoặc in đậm: `-17%` hoặc **-17%** |

### UC-FMT-004: Specs dùng bullet points

| Field | Value |
|-------|-------|
| **Applies to** | phongvu-comparator, phongvu-advisor |
| **Input** | Liệt kê specs sản phẩm |
| **Expected output** | Dùng bullet points ngắn gọn, không paragraph dài |

### UC-FMT-005: So sánh dùng bảng markdown

| Field | Value |
|-------|-------|
| **Applies to** | phongvu-comparator |
| **Input** | So sánh 2+ sản phẩm |
| **Expected output** | Bảng markdown với header row + data rows |

### UC-FMT-006: Luôn gợi ý hành động tiếp theo

| Field | Value |
|-------|-------|
| **Applies to** | Tất cả skills |
| **Input** | Bất kỳ câu trả lời nào |
| **Expected output** | Kết thúc bằng câu hỏi mở hoặc gợi ý: "Bạn muốn xem chi tiết...?" / "Bạn muốn so sánh...?" |
