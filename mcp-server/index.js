import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = "https://phongvu-api-proxy.tannhatcms.io.vn";
const TERMINAL_CODE = "phongvu";
const FETCH_TIMEOUT_MS = 10_000;

const SORT_MAP = {
  new: "SORT_BY_PUBLISH_AT",
  bestPrice: "SORT_BY_PRICE",
  discountPercent: "SORT_BY_DISCOUNT_PERCENT",
  "view.last_3_day": "SORT_BY_MOST_VIEW",
  "view.last_7_day": "SORT_BY_MOST_VIEW_7_DAYS",
  "view.last_30_day": "SORT_BY_MOST_VIEW_30_DAYS",
  "view.last_90_day": "SORT_BY_MOST_VIEW_90_DAYS",
  "quantity.last_3_day": "SORT_BY_TOP_SALE_QUANTITY",
  "quantity.last_1_week": "SORT_BY_TOP_SALE_QUANTITY_7_DAYS",
  "quantity.last_1_month": "SORT_BY_TOP_SALE_QUANTITY_30_DAYS",
  "quantity.last_3_month": "SORT_BY_TOP_SALE_QUANTITY_90_DAYS",
};

const ORDER_MAP = {
  asc: "ORDER_BY_ASCENDING",
  desc: "ORDER_BY_DESCENDING",
};

async function fetchApi(endpoint, params = {}, method = "GET", body = null) {
  const url = new URL(`${BASE_URL}${endpoint}`);

  if (method === "GET") {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const options = {
    method,
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  };

  if (method === "POST" && body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function safeParsePrice(value) {
  if (value === undefined || value === null) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function summarizeProduct(product) {
  const info = product.productInfo;
  const price = product.prices?.[0];
  const detail = product.productDetail;

  const priceCurrent = safeParsePrice(price?.latestPrice);
  const priceOriginal = safeParsePrice(price?.supplierRetailPrice);

  return {
    sku: info.sku,
    name: info.name || info.displayName,
    brand: info.brand?.name || "",
    url: `https://phongvu.vn/${info.canonical}`,
    priceCurrent,
    priceOriginal,
    discount: price?.discountPercent || 0,
    priceFormatted: priceCurrent !== null ? formatPrice(priceCurrent) : "Liên hệ",
    inStock: product.status?.sellable || false,
    warranty: info.warranty?.months ? `${info.warranty.months} tháng` : null,
    shortDescription: detail?.shortDescription || "",
    categories: info.categories?.map((c) => c.name) || [],
    image: info.imageUrl,
  };
}

function errorText(message) {
  return { content: [{ type: "text", text: `Lỗi: ${message}` }] };
}

function summarizeFilters(filterData) {
  if (!filterData) return null;

  const result = {};

  // Brands
  if (filterData.brands?.length) {
    result.brands = filterData.brands.map((b) => ({
      code: b.code,
      name: b.name,
    }));
  }

  // Price range
  if (filterData.priceGte || filterData.priceLte) {
    result.priceRange = {
      min: parseInt(filterData.priceGte) || 0,
      max: parseInt(filterData.priceLte) || 0,
    };
  }

  // Attributes
  if (filterData.attributes?.length) {
    result.attributes = filterData.attributes.map((attr) => ({
      code: attr.code,
      name: attr.name,
      options: attr.values?.map((v) => ({
        optionId: v.optionId,
        value: v.value,
        count: v.count,
      })) || [],
    }));
  }

  // Clearance types
  if (filterData.clearanceTypes?.length) {
    result.clearanceTypes = filterData.clearanceTypes;
  }

  return result;
}

function jsonText(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

const server = new McpServer({
  name: "phongvu-discovery",
  version: "1.0.0",
});

// Tool 1: Search Products
server.tool(
  "search_products",
  "Tìm kiếm sản phẩm trên Phong Vũ theo từ khóa. Hỗ trợ lọc theo giá, khuyến mãi, thương hiệu, attributes và sắp xếp. Có thể trả về danh sách filter options (brands, attributes, price range) khi set return_filterable=true.",
  {
    query: z.string().describe("Từ khóa tìm kiếm (VD: 'laptop', 'M.2 SSD', 'tai nghe')"),
    page: z.number().optional().default(1).describe("Số trang"),
    limit: z.number().optional().default(5).describe("Số sản phẩm mỗi trang (max 50)"),
    price_lte: z.number().optional().describe("Giá tối đa (VND). Chỉ thêm khi người dùng set giá cao nhất. VD: 20000000"),
    price_gte: z.number().optional().describe("Giá tối thiểu (VND). Chỉ thêm khi người dùng set giá thấp nhất. VD: 10000000"),
    has_promotions: z.boolean().optional().describe("Chỉ sản phẩm có khuyến mãi. Thêm khi khách hỏi 'có KM không', 'đang giảm giá'"),
    brands: z.array(z.string()).optional().describe("Lọc theo thương hiệu (VD: ['lenovo', 'asus', 'hp']). Mã brand viết thường, không dấu"),
    attributes: z.record(z.string()).optional().describe("Lọc theo attributes dạng {code: 'id1,id2,...'}. VD: {'nhucausudung': '26695,26696', 'NL_dongmay': '71438'}. Lấy code và optionId từ filter_options"),
    sort: z.enum(["new", "bestPrice", "discountPercent", "view.last_3_day", "view.last_7_day", "view.last_30_day", "quantity.last_1_week", "quantity.last_1_month"]).optional().describe("Sắp xếp: new=mới nhất, bestPrice=giá thấp, discountPercent=KM cao, view.*=xem nhiều, quantity.*=bán chạy"),
    order: z.enum(["asc", "desc"]).optional().describe("Thứ tự: asc=tăng dần, desc=giảm dần. Mặc định desc"),
    return_filterable: z.boolean().optional().default(false).describe("true để trả về danh sách filter options (brands, attributes, price range) cùng kết quả. Dùng cho lần search đầu tiên để biết有哪些 filter可用"),
  },
  async ({ query, page, limit, price_lte, price_gte, has_promotions, brands, attributes, sort, order, return_filterable }) => {
    const body = {
      query,
      terminalCode: TERMINAL_CODE,
      page,
      limit,
    };

    // Thêm returnFilterable để API trả filter options
    if (return_filterable) {
      body.returnFilterable = [
        "FILTER_TYPE_BRAND",
        "FILTER_TYPE_PRICE",
        "FILTER_TYPE_ATTRIBUTE",
        "FILTER_TYPE_CLEARANCE",
      ];
    }

    // Chỉ thêm filter khi có params
    const filter = {};
    if (price_lte !== undefined) filter.priceLte = price_lte;
    if (price_gte !== undefined) filter.priceGte = price_gte;
    if (has_promotions !== undefined) filter.hasPromotions = has_promotions;
    if (brands !== undefined && brands.length > 0) filter.brands = brands;

    // Attributes filter: {code: "id1,id2,..."} → [{code, optionIds: ["id1","id2"]}]
    if (attributes !== undefined && Object.keys(attributes).length > 0) {
      filter.attributes = Object.entries(attributes).map(([code, ids]) => ({
        code,
        optionIds: typeof ids === "string" ? ids.split(",") : ids,
      }));
    }

    if (Object.keys(filter).length > 0) body.filter = filter;

    // Chỉ thêm sorting khi có params
    if (sort !== undefined) {
      body.sorting = { sort: SORT_MAP[sort] || sort };
      if (order !== undefined) body.sorting.order = ORDER_MAP[order] || order.toUpperCase();
    }

    const result = await fetchApi("/v1/search", {}, "POST", body);

    if (result.code !== "0") {
      return errorText(result.message);
    }

    const products = result.result.products.map(summarizeProduct);
    const pagination = result.pagination;

    const response = {
      query,
      total: pagination.totalItems,
      totalPages: pagination.totalPages,
      currentPage: page,
      products,
    };

    // Thêm filter options nếu có
    if (return_filterable && result.result.filter) {
      response.filter_options = summarizeFilters(result.result.filter);
    }

    return jsonText(response);
  }
);

// Tool 2: Get Product Detail
server.tool(
  "get_product_detail",
  "Lấy thông tin chi tiết sản phẩm theo SKU. Bao gồm mô tả, thông số kỹ thuật, giá, khuyến mãi, tồn kho.",
  {
    sku: z.string().describe("Mã SKU sản phẩm (VD: '250512246')"),
  },
  async ({ sku }) => {
    const result = await fetchApi("/v1/product", { sku, terminalCode: TERMINAL_CODE });

    if (result.code !== "0") {
      return errorText(result.message);
    }

    const product = result.result.product;
    const summary = summarizeProduct(product);

    return jsonText({
      ...summary,
      fullDescription: product.productDetail?.description || "",
      images: product.productDetail?.images || [],
    });
  }
);

// Tool 3: Compare Products
server.tool(
  "compare_products",
  "So sánh cấu hình 2-3 sản phẩm theo SKU. Hữu ích khi khách hàng muốn đối chiếu trước khi mua.",
  {
    skus: z.array(z.string()).min(2).max(3).describe("Danh sách SKU cần so sánh (2-3 sản phẩm)"),
  },
  async ({ skus }) => {
    const results = await Promise.all(
      skus.map(async (sku) => {
        try {
          const result = await fetchApi("/v1/product", { sku, terminalCode: TERMINAL_CODE });
          return result.code === "0" ? { sku, product: result.result.product } : { sku, error: result.message };
        } catch (err) {
          return { sku, error: err.message };
        }
      })
    );

    const valid = results.filter((r) => !r.error);
    const failed = results.filter((r) => r.error);

    if (valid.length < 2) {
      const failMsg = failed.map((f) => `${f.sku}: ${f.error}`).join("; ");
      return errorText(`Không tìm đủ sản phẩm để so sánh. Lỗi: ${failMsg}`);
    }

    const response = { comparison: valid.map((v) => summarizeProduct(v.product)) };
    if (failed.length > 0) {
      response.warnings = failed.map((f) => `SKU ${f.sku}: ${f.error}`);
    }

    return jsonText(response);
  }
);

// Tool 4: Get Popular Keywords
server.tool(
  "get_popular_keywords",
  "Lấy danh sách từ khóa tìm kiếm phổ biến. Gợi ý cho khách hàng khi chưa biết tìm gì.",
  {
    limit: z.number().optional().default(10).describe("Số lượng từ khóa"),
  },
  async ({ limit }) => {
    const result = await fetchApi("/v1/recommended-search-terms", {
      limit,
      terminalCode: TERMINAL_CODE,
    });

    if (result.code !== undefined && result.code !== "0") {
      return errorText(result.message);
    }

    return jsonText({ popularKeywords: result.result?.terms || [] });
  }
);

// Tool 5: Get Recommendations
server.tool(
  "get_recommendations",
  "Lấy sản phẩm gợi ý liên quan đến một sản phẩm cụ thể.",
  {
    sku: z.string().describe("Mã SKU sản phẩm"),
  },
  async ({ sku }) => {
    const result = await fetchApi(`/v1/products/${sku}/recommendations`, {
      terminalCode: TERMINAL_CODE,
    });

    if (result.code !== undefined && result.code !== "0") {
      return errorText(result.message);
    }

    const recommendations =
      result?.result?.productSets?.[0]?.products?.map(summarizeProduct) || [];

    return jsonText({ sku, recommendations });
  }
);

// Tool 6: Check Stock
server.tool(
  "check_stock",
  "Kiểm tra tồn kho và trạng thái bán hàng của sản phẩm.",
  {
    sku: z.string().describe("Mã SKU sản phẩm"),
  },
  async ({ sku }) => {
    const result = await fetchApi("/v1/product", { sku, terminalCode: TERMINAL_CODE });

    if (result.code !== "0") {
      return errorText(result.message);
    }

    const product = result.result.product;
    const price = product.prices?.[0];
    const priceCurrent = safeParsePrice(price?.latestPrice);

    return jsonText({
      sku,
      name: product.productInfo.name,
      sellable: product.status?.sellable || false,
      currentPrice: priceCurrent !== null ? formatPrice(priceCurrent) : "N/A",
      promotions: product.promotions || [],
    });
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Phong Vũ Discovery MCP Server running on stdio");
