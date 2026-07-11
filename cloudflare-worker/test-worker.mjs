const WORKER_URL = "https://phongvu-api-proxy.tannhatcms.io.vn";

let passed = 0;
let failed = 0;

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

async function fetchAPI(path, options = {}) {
  const res = await fetch(`${WORKER_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return { status: res.status, data: await res.json() };
}

// ============================================================
// 1. ENDPOINT WHITELIST
// ============================================================
console.log("\n=== 1. ENDPOINT WHITELIST ===");

await test("POST /v1/search should work", async () => {
  const { status, data } = await fetchAPI("/v1/search", {
    method: "POST",
    body: JSON.stringify({ query: "laptop", terminalCode: "phongvu", limit: 1 }),
  });
  assert(status === 200, `Expected 200, got ${status}`);
  assert(data.code === "0", `Expected code 0, got ${data.code}`);
});

await test("GET /v1/product should work", async () => {
  const { status, data } = await fetchAPI("/v1/product?sku=250512246&terminalCode=phongvu");
  assert(status === 200, `Expected 200, got ${status}`);
  assert(data.code === "0", `Expected code 0, got ${data.code}`);
});

await test("GET /v1/recommended-search-terms should work", async () => {
  const { status, data } = await fetchAPI("/v1/recommended-search-terms?limit=3&terminalCode=phongvu");
  assert(status === 200, `Expected 200, got ${status}`);
  assert(data.result.terms, "Missing terms");
});

await test("GET /v1/keywords should work", async () => {
  const { status } = await fetchAPI("/v1/keywords?query=laptop&terminalCode=phongvu");
  assert(status === 200, `Expected 200, got ${status}`);
});

await test("GET /v1/products should work", async () => {
  const { status, data } = await fetchAPI("/v1/products?skus=250512246,250716126&terminalCode=phongvu");
  assert(status === 200, `Expected 200, got ${status}`);
  assert(data.code === "0", `Expected code 0, got ${data.code}`);
});

await test("Blocked endpoint should return 403", async () => {
  const { status } = await fetchAPI("/v1/admin/users");
  assert(status === 403, `Expected 403, got ${status}`);
});

await test("Blocked endpoint /unknown should return 403", async () => {
  const { status } = await fetchAPI("/unknown/endpoint");
  assert(status === 403, `Expected 403, got ${status}`);
});

// ============================================================
// 2. CORS
// ============================================================
console.log("\n=== 2. CORS HEADERS ===");

await test("Should return CORS headers", async () => {
  const res = await fetch(`${WORKER_URL}/v1/recommended-search-terms?limit=1&terminalCode=phongvu`);
  const cors = res.headers.get("access-control-allow-origin");
  assert(cors === "*", `Expected *, got ${cors}`);
});

await test("OPTIONS preflight should return 204", async () => {
  const res = await fetch(`${WORKER_URL}/v1/search`, { method: "OPTIONS" });
  assert(res.status === 204, `Expected 204, got ${res.status}`);
});

// ============================================================
// 3. RESPONSE FORMAT
// ============================================================
console.log("\n=== 3. RESPONSE FORMAT ===");

await test("Search response has correct structure", async () => {
  const { data } = await fetchAPI("/v1/search", {
    method: "POST",
    body: JSON.stringify({ query: "ssd", terminalCode: "phongvu", limit: 2 }),
  });
  assert(data.code === "0", "code should be 0");
  assert(data.result.products, "Should have products");
  assert(data.pagination, "Should have pagination");
  assert(data.pagination.totalItems > 0, "totalItems should be > 0");
});

await test("Product detail has correct structure", async () => {
  const { data } = await fetchAPI("/v1/product?sku=250512246&terminalCode=phongvu");
  assert(data.result.product, "Should have product");
  assert(data.result.product.productInfo, "Should have productInfo");
  assert(data.result.product.productInfo.sku, "Should have sku");
  assert(data.result.product.prices, "Should have prices");
});

await test("Popular keywords has correct structure", async () => {
  const { data } = await fetchAPI("/v1/recommended-search-terms?limit=5&terminalCode=phongvu");
  assert(data.result.terms, "Should have terms");
  assert(Array.isArray(data.result.terms), "terms should be array");
  assert(data.result.terms.length > 0, "terms should not be empty");
});

// ============================================================
// 4. SEARCH FUNCTIONALITY
// ============================================================
console.log("\n=== 4. SEARCH FUNCTIONALITY ===");

await test("Search returns products with required fields", async () => {
  const { data } = await fetchAPI("/v1/search", {
    method: "POST",
    body: JSON.stringify({ query: "laptop", terminalCode: "phongvu", limit: 1 }),
  });
  const product = data.result.products[0];
  assert(product.productInfo.sku, "Missing sku");
  assert(product.productInfo.name, "Missing name");
  assert(product.productInfo.slug || product.productInfo.canonical, "Missing slug/canonical");
  assert(product.prices, "Missing prices");
  assert(product.status, "Missing status");
});

await test("Search with Vietnamese query works", async () => {
  const { data } = await fetchAPI("/v1/search", {
    method: "POST",
    body: JSON.stringify({ query: "bàn phím cơ", terminalCode: "phongvu", limit: 2 }),
  });
  assert(data.code === "0", "Should handle Vietnamese");
});

await test("Search with special chars works", async () => {
  const { data } = await fetchAPI("/v1/search", {
    method: "POST",
    body: JSON.stringify({ query: "M.2 SSD", terminalCode: "phongvu", limit: 2 }),
  });
  assert(data.code === "0", "Should handle special chars");
});

await test("Search pagination works", async () => {
  const { data } = await fetchAPI("/v1/search", {
    method: "POST",
    body: JSON.stringify({ query: "laptop", terminalCode: "phongvu", page: 2, limit: 2 }),
  });
  assert(data.code === "0", "Pagination should work");
});

// ============================================================
// 5. PRODUCT DETAIL
// ============================================================
console.log("\n=== 5. PRODUCT DETAIL ===");

await test("Product detail returns full info", async () => {
  const { data } = await fetchAPI("/v1/product?sku=250512246&terminalCode=phongvu");
  const product = data.result.product;
  assert(product.productDetail, "Missing productDetail");
  assert(product.productDetail.description, "Missing description");
  assert(product.productDetail.shortDescription, "Missing shortDescription");
});

await test("Product detail with invalid SKU returns error", async () => {
  const { data } = await fetchAPI("/v1/product?sku=000000000&terminalCode=phongvu");
  assert(data.code !== "0" || data.result === null, "Should return error for invalid SKU");
});

// ============================================================
// 6. PERFORMANCE
// ============================================================
console.log("\n=== 6. PERFORMANCE ===");

await test("Response time < 3 seconds", async () => {
  const start = Date.now();
  await fetchAPI("/v1/search", {
    method: "POST",
    body: JSON.stringify({ query: "laptop", terminalCode: "phongvu", limit: 5 }),
  });
  const elapsed = Date.now() - start;
  assert(elapsed < 3000, `Response took ${elapsed}ms, expected < 3000ms`);
  console.log(`    ⏱️  ${elapsed}ms`);
});

// ============================================================
// SUMMARY
// ============================================================
console.log("\n" + "=".repeat(50));
console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);

if (failed > 0) process.exit(1);
