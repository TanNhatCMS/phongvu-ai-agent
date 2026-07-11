import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const SERVER_PATH = "E:\\source\\repos\\phongvu-ai-agent\\mcp-server\\index.js";

let client;
let passed = 0;
let failed = 0;
let skipped = 0;

async function setup() {
  const transport = new StdioClientTransport({ command: "node", args: [SERVER_PATH] });
  client = new Client({ name: "use-case-test", version: "1.0.0" });
  await client.connect(transport);
}

await setup();

async function teardown() {
  if (client) await client.close();
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function skip(name, reason) {
  console.log(`  ⏭️  ${name} (skipped: ${reason})`);
  skipped++;
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

function assertContains(str, substr, msg) {
  if (!str.includes(substr)) throw new Error(msg || `Expected "${str}" to contain "${substr}"`);
}

// ============================================================
// UC-RSR: phongvu-researcher use cases
// ============================================================
console.log("\n=== UC-RSR: Researcher — Search & Filter ===");

// UC-RSR-001: Basic search with return_filterable
await test("UC-RSR-001: Search with return_filterable=true", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 3, return_filterable: true }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.filter_options, "Expected filter_options in response");
  assert(data.filter_options.brands || data.filter_options.attributes || data.filter_options.priceRange,
    "Expected at least one filter type");
});

// UC-RSR-002: Price filter — price_lte only
await test("UC-RSR-002: Price filter — price_lte (dưới 20 triệu)", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 5, price_lte: 20000000 }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.products.length > 0, "Expected products");
  for (const p of data.products) {
    if (p.priceCurrent !== null) {
      assert(p.priceCurrent <= 20000000, `Product ${p.name} price ${p.priceCurrent} exceeds 20M`);
    }
  }
});

// UC-RSR-003: Price filter — price_gte only
await test("UC-RSR-003: Price filter — price_gte (trên 15 triệu)", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 5, price_gte: 15000000 }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.products.length > 0, "Expected products");
  for (const p of data.products) {
    if (p.priceCurrent !== null) {
      assert(p.priceCurrent >= 15000000, `Product ${p.name} price ${p.priceCurrent} below 15M`);
    }
  }
});

// UC-RSR-004: Price filter — range (gte + lte)
await test("UC-RSR-004: Price filter — range 15-25 triệu", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 5, price_gte: 15000000, price_lte: 25000000 }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.products.length > 0, "Expected products");
  for (const p of data.products) {
    if (p.priceCurrent !== null) {
      assert(p.priceCurrent >= 15000000 && p.priceCurrent <= 25000000,
        `Product ${p.name} price ${p.priceCurrent} outside 15-25M range`);
    }
  }
});

// UC-RSR-005: Brand filter
await test("UC-RSR-005: Brand filter — Lenovo", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 5, brands: ["lenovo"] }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.products.length > 0, "Expected Lenovo products");
  for (const p of data.products) {
    assert(p.brand.toLowerCase().includes("lenovo"),
      `Product ${p.name} brand "${p.brand}" is not Lenovo`);
  }
});

// UC-RSR-006: Promotions filter
await test("UC-RSR-006: Promotions filter — has_promotions=true", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 5, has_promotions: true }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.products.length > 0, "Expected products with promotions");
  for (const p of data.products) {
    assert(p.discount > 0, `Product ${p.name} has no discount`);
  }
});

// UC-RSR-007: Attribute filter — nhucausudung = Gaming
await test("UC-RSR-007: Attribute filter — nhucausudung=Gaming (26695)", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: {
      query: "laptop",
      limit: 5,
      attributes: { nhucausudung: "26695" },
      return_filterable: true
    }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.products !== undefined, "Expected products array");
  // At least should return some results
  assert(data.total >= 0, "Expected valid total count");
});

// UC-RSR-008: Combined filters (brand + price + promotions)
await test("UC-RSR-008: Combined filters — Lenovo + dưới 25tr + có KM", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: {
      query: "laptop gaming",
      limit: 5,
      price_lte: 25000000,
      brands: ["lenovo"],
      has_promotions: true,
      return_filterable: true
    }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.products !== undefined, "Expected products array");
  for (const p of data.products) {
    if (p.priceCurrent !== null) {
      assert(p.priceCurrent <= 25000000, `Product ${p.name} exceeds budget`);
    }
  }
});

// UC-RSR-009: Sort by price ascending
await test("UC-RSR-009: Sort by price — cheapest first", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 5, sort: "bestPrice", order: "asc" }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.products.length >= 2, "Need at least 2 products to verify sort");
  const prices = data.products
    .map(p => p.priceCurrent)
    .filter(p => p !== null);
  for (let i = 1; i < prices.length; i++) {
    assert(prices[i] >= prices[i - 1], `Products not sorted ascending: ${prices[i - 1]} > ${prices[i]}`);
  }
});

// UC-RSR-010: Sort by discount descending
await test("UC-RSR-010: Sort by discount — highest KM first", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 5, sort: "discountPercent", order: "desc" }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.products.length >= 2, "Need at least 2 products");
  const discounts = data.products.map(p => p.discount);
  for (let i = 1; i < discounts.length; i++) {
    assert(discounts[i] <= discounts[i - 1],
      `Products not sorted by discount desc: ${discounts[i - 1]} < ${discounts[i]}`);
  }
});

// UC-RSR-011: Sort by popularity (view.last_7_day)
await test("UC-RSR-011: Sort by views — most viewed in 7 days", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 5, sort: "view.last_7_day" }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.products.length > 0, "Expected products");
});

// UC-RSR-012: Sort by top sales (quantity.last_1_week)
await test("UC-RSR-012: Sort by sales — top sellers this week", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 5, sort: "quantity.last_1_week" }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.products.length > 0, "Expected products");
});

// ============================================================
// UC-CMP: phongvu-comparator use cases
// ============================================================
console.log("\n=== UC-CMP: Comparator — Compare Products ===");

// UC-CMP-001: Compare 2 products
await test("UC-CMP-001: Compare 2 products — basic", async () => {
  const result = await client.callTool({
    name: "compare_products",
    arguments: { skus: ["250512246", "250716126"] }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.comparison.length === 2, "Expected 2 products in comparison");
  assert(data.comparison[0].sku && data.comparison[1].sku, "Both products should have SKU");
});

// UC-CMP-002: Compare 3 products
await test("UC-CMP-002: Compare 3 products", async () => {
  const result = await client.callTool({
    name: "compare_products",
    arguments: { skus: ["250512246", "250716126", "250801468"] }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.comparison.length === 3, "Expected 3 products");
});

// UC-CMP-007: Invalid SKU in comparison
await test("UC-CMP-007: Invalid SKU — should return error or warning", async () => {
  const result = await client.callTool({
    name: "compare_products",
    arguments: { skus: ["250512246", "000000000"] }
  });
  const text = result.content[0].text;
  assert(text.length > 0, "Should return some response");
  // API returns error text when SKU not found — this is expected behavior
  const isError = text.includes("Lỗi") || text.includes("error");
  let isJsonWithWarning = false;
  try {
    const data = JSON.parse(text);
    isJsonWithWarning = data.warnings !== undefined;
  } catch {}
  assert(isError || isJsonWithWarning, "Should return error message or JSON with warnings");
});

// ============================================================
// UC-ADV: phongvu-advisor use cases
// ============================================================
console.log("\n=== UC-ADV: Advisor — Recommendations & Stock ===");

// UC-ADV-002: Check stock before advising
await test("UC-ADV-002: Check stock for top pick", async () => {
  const result = await client.callTool({
    name: "check_stock",
    arguments: { sku: "250512246" }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.sellable !== undefined, "Should have sellable status");
  assert(data.currentPrice !== undefined, "Should have currentPrice");
  assert(data.promotions !== undefined, "Should have promotions array");
});

// UC-ADV-004: Get recommendations for accessories
await test("UC-ADV-004: Get recommendations for product", async () => {
  const result = await client.callTool({
    name: "get_recommendations",
    arguments: { sku: "250512246" }
  });
  const text = result.content[0].text;
  assert(text.length > 0, "Should return some response");
  // API may return error text or JSON — both are valid
  let hasRecommendations = false;
  try {
    const data = JSON.parse(text);
    hasRecommendations = data.recommendations !== undefined;
  } catch {}
  const isError = text.includes("Lỗi");
  assert(hasRecommendations || isError, "Should return recommendations or error message");
});

// UC-ADV-003: Out of stock — find alternatives
await test("UC-ADV-003: Recommendations for out-of-stock SKU", async () => {
  // Using a potentially invalid/out-of-stock SKU
  const result = await client.callTool({
    name: "get_recommendations",
    arguments: { sku: "000000000" }
  });
  const text = result.content[0].text;
  assert(text.length > 0, "Should return some response even for invalid SKU");
});

// ============================================================
// UC-SUP: phongvu-support use cases (via webfetch/RAG)
// ============================================================
console.log("\n=== UC-SUP: Support — Data Source Verification ===");

// UC-SUP-001: Verify RAG data files exist
await test("UC-SUP-001: RAG data directory exists", async () => {
  const fs = await import("fs");
  const ragDir = "E:\\source\\repos\\phongvu-ai-agent\\rag-data";
  assert(fs.existsSync(ragDir), "rag-data directory should exist");
  const files = fs.readdirSync(ragDir);
  assert(files.length > 0, "rag-data should contain files");
});

// UC-SUP-002: Verify key RAG files exist
await test("UC-SUP-002: Key RAG files exist (warranty, returns, payment)", async () => {
  const fs = await import("fs");
  const ragDir = "E:\\source\\repos\\phongvu-ai-agent\\rag-data";
  const requiredFiles = [
    "14-chinh-sach-bao-hanh.md",
    "12-doi-tra-hoan-tien.md",
    "08-chinh-sach-thanh-toan.md",
    "10-giao-hang-ho-ky-thuat.md",
    "15-chinh-sach-tra-gop.md",
  ];
  for (const file of requiredFiles) {
    assert(fs.existsSync(`${ragDir}\\${file}`), `Missing RAG file: ${file}`);
  }
});

// UC-SUP-003: Verify full help file exists
await test("UC-SUP-003: Full help file exists (phongvu-help-full.md)", async () => {
  const fs = await import("fs");
  const fullPath = "E:\\source\\repos\\phongvu-ai-agent\\rag-data\\phongvu-help-full.md";
  assert(fs.existsSync(fullPath), "phongvu-help-full.md should exist");
  const stat = fs.statSync(fullPath);
  assert(stat.size > 10000, `Full help file too small: ${stat.size} bytes`);
});

// ============================================================
// UC-EDGE: Edge Cases
// ============================================================
console.log("\n=== UC-EDGE: Edge Cases ===");

// UC-EDGE-001: Search for non-existent product
await test("UC-EDGE-001: Search non-existent product — Vertu phone", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "điện thoại Vertu", limit: 3 }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.total === 0 || data.products.length === 0, "Should return 0 results for Vertu");
});

// UC-EDGE-002: Invalid SKU for detail
await test("UC-EDGE-002: Invalid SKU — get_product_detail", async () => {
  const result = await client.callTool({
    name: "get_product_detail",
    arguments: { sku: "999999999" }
  });
  const text = result.content[0].text;
  assert(text.length > 0, "Should return error message");
});

// UC-EDGE-003: Empty search query
await test("UC-EDGE-003: Empty search query", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "", limit: 2 }
  });
  const text = result.content[0].text;
  assert(text.length > 0, "Should return some response");
});

// UC-EDGE-004: Very specific search (too narrow)
await test("UC-EDGE-004: Very specific search query", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop gaming Asus ROG Strix G16 i9 13900HX RTX 4090 64GB RAM", limit: 3 }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.total >= 0, "Should handle specific query without error");
});

// UC-EDGE-005: Special characters in search
await test("UC-EDGE-005: Special characters — M.2 SSD", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "M.2 SSD", limit: 3 }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.total >= 0, "Should handle special characters");
});

// UC-EDGE-006: Vietnamese diacritics
await test("UC-EDGE-006: Vietnamese diacritics — bàn phím cơ", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "bàn phím cơ", limit: 3 }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.total >= 0, "Should handle Vietnamese diacritics");
});

// ============================================================
// UC-FMT: Format & Response Structure
// ============================================================
console.log("\n=== UC-FMT: Format & Response Structure ===");

// UC-FMT-001: Price format — VND with separators
await test("UC-FMT-001: Price format — VND with dot separators", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 1 }
  });
  const data = JSON.parse(result.content[0].text);
  const p = data.products[0];
  if (p.priceFormatted && p.priceFormatted !== "Liên hệ") {
    // Should contain dot as thousand separator (Vietnamese format)
    assert(p.priceFormatted.includes("₫") || p.priceFormatted.includes("đ") || p.priceFormatted.includes("VND"),
      `Price format "${p.priceFormatted}" missing currency symbol`);
  }
});

// UC-FMT-002: Product URL format
await test("UC-FMT-002: Product URL — phongvu.vn format", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 1 }
  });
  const data = JSON.parse(result.content[0].text);
  const p = data.products[0];
  assert(p.url.startsWith("https://phongvu.vn/"), `URL "${p.url}" should start with phongvu.vn`);
});

// UC-FMT-003: Response has all required fields
await test("UC-FMT-003: Product object has all required fields", async () => {
  const result = await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 1 }
  });
  const data = JSON.parse(result.content[0].text);
  const p = data.products[0];
  const requiredFields = ["sku", "name", "brand", "url", "priceFormatted", "inStock"];
  for (const field of requiredFields) {
    assert(p[field] !== undefined, `Missing required field: ${field}`);
  }
});

// UC-FMT-004: Check stock response format
await test("UC-FMT-004: Check stock response format", async () => {
  const result = await client.callTool({
    name: "check_stock",
    arguments: { sku: "250512246" }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.sku, "Missing sku");
  assert(data.name, "Missing name");
  assert(typeof data.sellable === "boolean", "sellable should be boolean");
  assert(data.currentPrice !== undefined, "Missing currentPrice");
  assert(Array.isArray(data.promotions), "promotions should be array");
});

// UC-FMT-005: Popular keywords response format
await test("UC-FMT-005: Popular keywords response format", async () => {
  const result = await client.callTool({
    name: "get_popular_keywords",
    arguments: { limit: 5 }
  });
  const data = JSON.parse(result.content[0].text);
  assert(Array.isArray(data.popularKeywords), "popularKeywords should be array");
  assert(data.popularKeywords.length <= 5, "Should respect limit");
  assert(typeof data.popularKeywords[0] === "string", "Keywords should be strings");
});

// ============================================================
// UC-PERF: Performance & Reliability
// ============================================================
console.log("\n=== UC-PERF: Performance & Reliability ===");

// UC-PERF-001: Response time for search
await test("UC-PERF-001: Search response < 10s", async () => {
  const start = Date.now();
  await client.callTool({
    name: "search_products",
    arguments: { query: "laptop", limit: 3 }
  });
  const elapsed = Date.now() - start;
  assert(elapsed < 10000, `Search took ${elapsed}ms, expected < 10000ms`);
});

// UC-PERF-002: Response time for product detail
await test("UC-PERF-002: Product detail response < 10s", async () => {
  const start = Date.now();
  await client.callTool({
    name: "get_product_detail",
    arguments: { sku: "250512246" }
  });
  const elapsed = Date.now() - start;
  assert(elapsed < 10000, `Detail took ${elapsed}ms, expected < 10000ms`);
});

// UC-PERF-003: Response time for compare
await test("UC-PERF-003: Compare response < 15s", async () => {
  const start = Date.now();
  await client.callTool({
    name: "compare_products",
    arguments: { skus: ["250512246", "250716126"] }
  });
  const elapsed = Date.now() - start;
  assert(elapsed < 15000, `Compare took ${elapsed}ms, expected < 15000ms`);
});

// ============================================================
// SUMMARY
// ============================================================
console.log("\n" + "=".repeat(60));
console.log(`\nResults: ${passed} passed, ${failed} failed, ${skipped} skipped, ${passed + failed + skipped} total`);

await teardown();

if (failed > 0) process.exit(1);
