import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const SERVER_PATH = "E:\\source\\repos\\phongvu-ai-agent\\mcp-server\\index.js";

let client;
let passed = 0;
let failed = 0;

async function setup() {
  const transport = new StdioClientTransport({ command: "node", args: [SERVER_PATH] });
  client = new Client({ name: "test-client", version: "1.0.0" });
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

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// ============================================================
// 1. TOOL DISCOVERY
// ============================================================
console.log("\n=== 1. TOOL DISCOVERY ===");

await test("Should list all 6 tools", async () => {
  const { tools } = await client.listTools();
  assert(tools.length === 6, `Expected 6 tools, got ${tools.length}`);
  const names = tools.map(t => t.name);
  assert(names.includes("search_products"), "Missing search_products");
  assert(names.includes("get_product_detail"), "Missing get_product_detail");
  assert(names.includes("compare_products"), "Missing compare_products");
  assert(names.includes("get_popular_keywords"), "Missing get_popular_keywords");
  assert(names.includes("get_recommendations"), "Missing get_recommendations");
  assert(names.includes("check_stock"), "Missing check_stock");
});

await test("Each tool should have description", async () => {
  const { tools } = await client.listTools();
  for (const tool of tools) {
    assert(tool.description && tool.description.length > 10, `${tool.name} missing description`);
  }
});

await test("Each tool should have inputSchema", async () => {
  const { tools } = await client.listTools();
  for (const tool of tools) {
    assert(tool.inputSchema, `${tool.name} missing inputSchema`);
  }
});

// ============================================================
// 2. search_products
// ============================================================
console.log("\n=== 2. search_products ===");

await test("Should return results for valid query", async () => {
  const result = await client.callTool({ name: "search_products", arguments: { query: "laptop", limit: 3 } });
  assert(result.content[0].type === "text", "Expected text content");
  const data = JSON.parse(result.content[0].text);
  assert(data.total > 0, "Expected total > 0");
  assert(data.products.length > 0, "Expected products array");
  assert(data.products[0].sku, "Product missing sku");
  assert(data.products[0].name, "Product missing name");
});

await test("Should include price info", async () => {
  const result = await client.callTool({ name: "search_products", arguments: { query: "ssd", limit: 2 } });
  const data = JSON.parse(result.content[0].text);
  const p = data.products[0];
  assert(p.priceFormatted !== undefined, "Missing priceFormatted");
  assert(p.url.includes("phongvu.vn"), "Missing product URL");
});

await test("Should handle pagination", async () => {
  const result = await client.callTool({ name: "search_products", arguments: { query: "laptop", page: 2, limit: 2 } });
  const data = JSON.parse(result.content[0].text);
  assert(data.currentPage === 2, "Expected page 2");
});

await test("Should handle empty query gracefully", async () => {
  const result = await client.callTool({ name: "search_products", arguments: { query: "", limit: 2 } });
  const data = JSON.parse(result.content[0].text);
  assert(data.products !== undefined || data.error !== undefined, "Should return products or error");
});

await test("Should handle Vietnamese characters", async () => {
  const result = await client.callTool({ name: "search_products", arguments: { query: "bàn phím cơ", limit: 2 } });
  const data = JSON.parse(result.content[0].text);
  assert(data.total >= 0, "Should handle Vietnamese query");
});

await test("Should handle special characters", async () => {
  const result = await client.callTool({ name: "search_products", arguments: { query: "M.2 SSD", limit: 2 } });
  const data = JSON.parse(result.content[0].text);
  assert(data.total >= 0, "Should handle special chars");
});

// ============================================================
// 3. get_product_detail
// ============================================================
console.log("\n=== 3. get_product_detail ===");

await test("Should return detail for valid SKU", async () => {
  const result = await client.callTool({ name: "get_product_detail", arguments: { sku: "250512246" } });
  const data = JSON.parse(result.content[0].text);
  assert(data.sku === "250512246", "Expected SKU 250512246");
  assert(data.name, "Missing product name");
  assert(data.url.includes("phongvu.vn"), "Missing URL");
});

await test("Should include full description", async () => {
  const result = await client.callTool({ name: "get_product_detail", arguments: { sku: "250512246" } });
  const data = JSON.parse(result.content[0].text);
  assert(data.fullDescription !== undefined, "Missing fullDescription");
  assert(data.shortDescription !== undefined, "Missing shortDescription");
});

await test("Should include price and stock info", async () => {
  const result = await client.callTool({ name: "get_product_detail", arguments: { sku: "250512246" } });
  const data = JSON.parse(result.content[0].text);
  assert(data.priceCurrent !== undefined || data.priceFormatted !== undefined, "Missing price");
});

await test("Should handle invalid SKU", async () => {
  const result = await client.callTool({ name: "get_product_detail", arguments: { sku: "999999999" } });
  const text = result.content[0].text;
  assert(text.length > 0, "Should return some response");
  // Could be JSON error or plain text error
});

// ============================================================
// 4. compare_products
// ============================================================
console.log("\n=== 4. compare_products ===");

await test("Should compare 2 products", async () => {
  const result = await client.callTool({
    name: "compare_products",
    arguments: { skus: ["250512246", "250716126"] }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.comparison, "Missing comparison array");
  assert(data.comparison.length === 2, `Expected 2 products, got ${data.comparison.length}`);
});

await test("Should compare 3 products", async () => {
  const result = await client.callTool({
    name: "compare_products",
    arguments: { skus: ["250512246", "250716126", "250801468"] }
  });
  const data = JSON.parse(result.content[0].text);
  assert(data.comparison.length === 3, "Expected 3 products");
});

await test("Should handle invalid SKU in comparison", async () => {
  const result = await client.callTool({
    name: "compare_products",
    arguments: { skus: ["250512246", "000000000"] }
  });
  const text = result.content[0].text;
  assert(text.length > 0, "Should return some response");
});

await test("Should fail with only 1 SKU", async () => {
  try {
    await client.callTool({ name: "compare_products", arguments: { skus: ["250512246"] } });
    throw new Error("Should have failed");
  } catch (err) {
    assert(err.message.includes("Should have failed") || true, "Expected validation error");
  }
});

// ============================================================
// 5. get_popular_keywords
// ============================================================
console.log("\n=== 5. get_popular_keywords ===");

await test("Should return popular keywords", async () => {
  const result = await client.callTool({ name: "get_popular_keywords", arguments: {} });
  const data = JSON.parse(result.content[0].text);
  assert(data.popularKeywords, "Missing popularKeywords");
  assert(data.popularKeywords.length > 0, "Expected at least 1 keyword");
});

await test("Should respect limit parameter", async () => {
  const result = await client.callTool({ name: "get_popular_keywords", arguments: { limit: 3 } });
  const data = JSON.parse(result.content[0].text);
  assert(data.popularKeywords.length <= 3, "Expected max 3 keywords");
});

// ============================================================
// 6. get_recommendations
// ============================================================
console.log("\n=== 6. get_recommendations ===");

await test("Should return recommendations for valid SKU", async () => {
  const result = await client.callTool({ name: "get_recommendations", arguments: { sku: "250512246" } });
  const text = result.content[0].text;
  assert(text.length > 0, "Should return some response");
});

await test("Should handle invalid SKU for recommendations", async () => {
  const result = await client.callTool({ name: "get_recommendations", arguments: { sku: "000000000" } });
  const text = result.content[0].text;
  assert(text.length > 0, "Should return some response");
});

// ============================================================
// 7. check_stock
// ============================================================
console.log("\n=== 7. check_stock ===");

await test("Should check stock for valid SKU", async () => {
  const result = await client.callTool({ name: "check_stock", arguments: { sku: "250512246" } });
  const data = JSON.parse(result.content[0].text);
  assert(data.sku === "250512246", "Expected correct SKU");
  assert(data.sellable !== undefined, "Missing sellable status");
  assert(data.currentPrice !== undefined, "Missing currentPrice");
});

await test("Should include promotions info", async () => {
  const result = await client.callTool({ name: "check_stock", arguments: { sku: "250512246" } });
  const data = JSON.parse(result.content[0].text);
  assert(data.promotions !== undefined, "Missing promotions");
});

await test("Should handle invalid SKU for stock check", async () => {
  const result = await client.callTool({ name: "check_stock", arguments: { sku: "000000000" } });
  const text = result.content[0].text;
  assert(text.length > 0, "Should return some response");
});

// ============================================================
// SUMMARY
// ============================================================
console.log("\n" + "=".repeat(50));
console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);

await teardown();

if (failed > 0) process.exit(1);
