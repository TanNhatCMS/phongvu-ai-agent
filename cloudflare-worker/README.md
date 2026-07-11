# Phong Vũ API Proxy - Cloudflare Worker

Che giấu API gốc khi gọi upstream API.

## Domain
```
https://phongvu-api-proxy.tannhatcms.io.vn
```

## Tính năng

- **Che giấu API gốc**: Client chỉ gọi qua domain worker
- **CORS Mở**: Ai cũng gọi được worker
- **Rate Limiting**: Giới hạn request/phút per IP
- **Endpoint Whitelist**: Chỉ cho phép các endpoint đã định nghĩa
- **Error Handling**: Xử lý lỗi upstream

## Cách hoạt động

```
Client (bất kỳ đâu)
    ↓
Cloudflare Worker (phongvu-api-proxy.tannhatcms.io.vn)
    ↓ (fake Origin/Referer: phongvu.vn)
Phong Vũ API (upstream - giấu kín)
```

## Setup

### 1. Cài đặt Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login Cloudflare

```bash
wrangler login
```

### 3. Deploy

```bash
cd cloudflare-worker
npm install
wrangler deploy
```

### 4. Set Secret

```bash
wrangler secret put PHONGVU_API_BASE
```

Hoặc vào Cloudflare Dashboard → Worker → Settings → Variables → Add Secret.

## Sử dụng

```javascript
const response = await fetch(
  "https://phongvu-api-proxy.tannhatcms.io.vn/v1/search",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "laptop", terminalCode: "phongvu" }),
  }
);

const data = await response.json();
```

## Bảo mật

### Fake Headers
Khi gọi upstream API, worker tự động:
- Set `Origin: https://phongvu.vn`
- Set `Referer: https://phongvu.vn/`
- Set `User-Agent` là browser bình thường

### CORS
Mở cho tất cả (`Access-Control-Allow-Origin: *`). Ai cũng gọi được worker.

### Rate Limiting
Mặc định 60 request/phút per IP.

### Endpoint Whitelist
Chỉ cho phép:
- `/v1/search`
- `/v1/product`
- `/v1/products`
- `/v1/recommended-search-terms`
- `/v1/keywords`
- `/v2/search-skus-v2`

## Local Development

```bash
npm run dev
```

Worker sẽ chạy tại `http://localhost:8787`.
