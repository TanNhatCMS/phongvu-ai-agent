# Phong Vũ API Reference

Tài liệu tham khảo chi tiết cho MCP tools của Phong Vũ Discovery API.

## Base URL

```text
https://phongvu-api-proxy.tannhatcms.io.vn
```

## Tools

### search_products

Tìm kiếm sản phẩm theo từ khóa. Hỗ trợ lọc theo giá.

- **Method**: `POST /v1/search`
- **Input**:

  ```json
  { "query": "laptop gaming", "page": 1, "limit": 5 }
  ```

- **Input với price filter** (chỉ thêm khi có yêu cầu giá):

  ```json
  {
    "query": "laptop",
    "page": 1,
    "limit": 5,
    "filter": {
      "priceLte": 20000000
    }
  }
  ```

  ```json
  {
    "query": "laptop",
    "page": 1,
    "limit": 5,
    "filter": {
      "priceGte": 10000000,
      "priceLte": 25000000
    }
  }
  ```

- **Filter rules**:
  - `price_lte` (giá tối đa) → `filter.priceLte`: Chỉ thêm khi người dùng set giá cao nhất ("dưới 20 triệu")
  - `price_gte` (giá tối thiểu) → `filter.priceGte`: Chỉ thêm khi người dùng set giá thấp nhất ("trên 10 triệu")
  - `has_promotions` → `filter.hasPromotions`: Chỉ thêm khi khách hỏi về KM/giảm giá
  - `brands` → `filter.brands`: Mảng mã brand viết thường (VD: `["lenovo", "asus"]`)
  - Không đề cập giá → không thêm filter object

- **Sorting** (`sorting` object):
  - `sort`: `new` | `bestPrice` | `discountPercent` | `view.last_3_day` | `view.last_7_day` | `view.last_30_day` | `quantity.last_1_week` | `quantity.last_1_month`
  - `order`: `ASC` | `DESC`
  - Ví dụ: `{ "sorting": { "sort": "SORT_BY_PRICE", "order": "ORDER_BY_ASCENDING" } }`

- **Attributes filter** (`filter.attributes`):
  Format: `[{code: "nhucausudung", optionIds: ["26695", "26696"]}]`
  - `nhucausudung`: Nhu cầu (Gaming=26695, Văn phòng=26696, Học sinh-SV=26699, Đồ họa=26697...)
  - `NL_dongmay`: Dòng máy (lấy optionId từ filter_options)
  - `laptop_seriescpu`: Series CPU
  - `laptop_thehecpu`: Thế hệ CPU
  - `laptop_tencpu`: Tên CPU
  - `NL_mausac`: Màu sắc
  - `vga_serieschipdohoa`: Series chip đồ họa

- **returnFilterable**: Truyền `returnFilterable: ["FILTER_TYPE_BRAND", "FILTER_TYPE_PRICE", "FILTER_TYPE_ATTRIBUTE", "FILTER_TYPE_CLEARANCE"]` để API trả về danh sách filter options trong `result.filter`
  - `result.filter.brands`: Danh sách brand [{code, name}]
  - `result.filter.attributes`: Danh sách attribute [{code, name, values: [{optionId, value, count}]}]
  - `result.filter.priceGte/priceLte`: Khoảng giá hiện tại
  - `result.filter.clearanceTypes`: Loại hàng thanh lý

- **Output**:

  ```json
  {
    "query": "laptop gaming",
    "total": 120,
    "totalPages": 24,
    "currentPage": 1,
    "products": [
      {
        "sku": "250512246",
        "name": "Laptop Gigabyte Gaming A16...",
        "brand": "Gigabyte",
        "url": "https://phongvu.vn/laptop-gigabyte-gaming-a16...--s250512246",
        "priceCurrent": 28290000,
        "priceOriginal": 33990000,
        "discount": 17,
        "priceFormatted": "28,290,000đ",
        "inStock": true,
        "warranty": "24 tháng",
        "shortDescription": "...",
        "categories": ["Laptop", "Gaming"],
        "image": "https://..."
      }
    ]
  }
  ```

### get_product_detail

Chi tiết đầy đủ của 1 sản phẩm.

- **Method**: `GET /v1/product?sku={sku}&terminalCode=phongvu`
- **Input**: `{ "sku": "250512246" }`
- **Output**: Giống `search_products` nhưng có thêm:

  ```json
  {
    "...": "các trường giống search_products",
    "fullDescription": "<html mô tả sản phẩm>",
    "images": ["https://...", "https://..."]
  }
  ```

### compare_products

So sánh 2-3 sản phẩm song song.

- **Input**: `{ "skus": ["250512246", "250716126"] }`
- **Output**: `{ "comparison": [product1, product2] }`
- **Lưu ý**: Cần ít nhất 2 SKU hợp lệ. Nếu SKU không tìm thấy sẽ thông báo trong kết quả.

### get_recommendations

Sản phẩm gợi ý liên quan đến 1 sản phẩm.

- **Method**: `GET /v1/products/{sku}/recommendations?terminalCode=phongvu`
- **Input**: `{ "sku": "250512246" }`
- **Output**: `{ "sku": "250512246", "recommendations": [product, ...] }`

### check_stock

Kiểm tra tồn kho và khuyến mãi.

- **Method**: `GET /v1/product?sku={sku}&terminalCode=phongvu`
- **Input**: `{ "sku": "250512246" }`
- **Output**:

  ```json
  {
    "sku": "250512246",
    "name": "Laptop Gigabyte Gaming A16...",
    "sellable": true,
    "currentPrice": "28,290,000đ",
    "promotions": []
  }
  ```

### get_popular_keywords

Từ khóa tìm kiếm phổ biến hiện tại.

- **Method**: `GET /v1/recommended-search-terms?limit={limit}&terminalCode=phongvu`
- **Input**: `{ "limit": 10 }`
- **Output**: `{ "popularKeywords": ["laptop", "SSD", ...] }`

## Product Object Schema

Trường chung cho mọi sản phẩm:

| Field | Type | Mô tả |
| --- | --- | --- |
| `sku` | string | Mã sản phẩm |
| `name` | string | Tên hiển thị |
| `brand` | string | Hãng |
| `url` | string | Link phongvu.vn |
| `priceCurrent` | number/null | Giá hiện tại (VND) |
| `priceOriginal` | number/null | Giá gốc |
| `discount` | number | % giảm giá |
| `priceFormatted` | string | Giá đã format |
| `inStock` | boolean | Còn hàng |
| `warranty` | string/null | Bảo hành |
| `shortDescription` | string | Mô tả ngắn |
| `categories` | string[] | Danh mục |
| `image` | string | Ảnh đại diện |

## Vercel AI SDK Integration

Xem `README.md` ở root project để biết cách tích hợp với Vercel AI SDK.
