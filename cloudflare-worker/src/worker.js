/**
 * Phong Vũ API Proxy - Cloudflare Worker
 * 
 * Che giấu API gốc khi gọi upstream.
 * - CORS mở cho mọi người
 */

// Whitelist các endpoint được phép gọi
const ALLOWED_ENDPOINTS = [
  "/v1/search",
  "/v1/product",
  "/v1/products",
  "/v1/recommended-search-terms",
  "/v1/keywords",
  "/v2/search-skus-v2",
];

const ORIGIN = "https://phongvu.vn";
const REFERER = "https://phongvu.vn/";

// Rate limiting in-memory
const rateLimitMap = new Map();

function isRateLimited(ip, limit = 60) {
  const now = Date.now();
  const windowMs = 60 * 1000;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  const record = rateLimitMap.get(ip);
  if (now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count++;
  return false;
}

// CORS mở cho tất cả
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(),
      });
    }

    // Rate limiting
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
    const rateLimit = parseInt(env.RATE_LIMIT_PER_MINUTE || "60");

    if (isRateLimited(clientIP, rateLimit)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            ...getCorsHeaders(),
          },
        }
      );
    }

    // Validate endpoint
    const endpoint = url.pathname;
    const isAllowed = ALLOWED_ENDPOINTS.some(
      (allowed) => endpoint === allowed || endpoint.startsWith(allowed + "/")
    );

    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: "Endpoint not allowed" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders(),
          },
        }
      );
    }

    // Build target URL
    const apiBase = env.PHONGVU_API_BASE;
    if (!apiBase) {
      return new Response(
        JSON.stringify({ error: "API base not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const targetUrl = `${apiBase}${endpoint}${url.search}`;

    // Forward request
    const fetchOptions = {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": ORIGIN,
        "Referer": REFERER,
        "Accept": "application/json",
        "Accept-Language": "vi-VN,vi;q=0.9",
      },
    };

    if (request.method === "POST") {
      fetchOptions.body = await request.text();
    }

    try {
      const response = await fetch(targetUrl, fetchOptions);
      const data = await response.text();

      return new Response(data, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
          ...getCorsHeaders(),
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch from upstream API" }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders(),
          },
        }
      );
    }
  },
};
