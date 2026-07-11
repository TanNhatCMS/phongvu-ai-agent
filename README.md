# Phong Vũ AI Sales Agent

AI-powered conversational sales agent for Phong Vũ e-commerce. Compatible with Vercel AI SDK.

## System Architecture

```mermaid
graph TB
    User[👤 Khách hàng] -->|Chat| Frontend[📱 Frontend / Chat UI]
    Frontend -->|API| Agent[🤖 AI Agent]
    
    Agent -->|Orchestrate| Skills[📋 Skills Layer]
    
    Skills --> S1[phongvu-researcher]
    Skills --> S2[phongvu-comparator]
    Skills --> S3[phongvu-advisor]
    Skills --> S4[phongvu-support]
    
    S1 & S2 & S3 -->|MCP Tools| MCPServer[⚙️ MCP Server]
    S4 -->|Read| RAGData[📚 RAG Data]
    S4 -->|Fetch| HelpPV[🌐 help.phongvu.vn]
    
    MCPServer -->|POST /v1/search| Proxy[☁️ Cloudflare Worker]
    Proxy -->|Forward| PVAPI[🔌 Phong Vũ API]
    
    PVAPI -->|Response| Proxy
    Proxy -->|Response| MCPServer
    MCPServer -->|Products| Skills
    Skills -->|Answer| Agent
    Agent -->|Response| Frontend

    style User fill:#e1f5fe
    style Agent fill:#fff3e0
    style Skills fill:#e8f5e9
    style MCPServer fill:#f3e5f5
    style Proxy fill:#fce4ec
    style PVAPI fill:#fff9c4
    style RAGData fill:#e0f2f1
```

## Business Flow

```mermaid
flowchart TD
    Start([👤 Khách hỏi]) --> Classify{📋 Phân loại yêu cầu}
    
    Classify -->|Tìm sản phẩm| Search[🔍 Search Products]
    Classify -->|So sánh| Compare[⚖️ Compare Products]
    Classify -->|Tư vấn| Advise[💡 Advisor Pipeline]
    Classify -->|Hỗ trợ KH| Support[🆘 Support Agent]
    Classify -->|Đơn giản| Direct[📝 Trả lời trực tiếp]
    
    Search --> BudgetCheck{💰 Có ngân sách?}
    BudgetCheck -->|Có| AddPriceFilter[➕ Thêm price_lte/price_gte]
    BudgetCheck -->|Không| BasicSearch[🔎 Search cơ bản]
    
    AddPriceFilter --> BrandCheck{🏷️ Có thương hiệu?}
    BasicSearch --> BrandCheck
    BrandCheck -->|Có| AddBrand[➕ Thêm brands filter]
    BrandCheck -->|Không| AttrCheck{📊 Có nhu cầu?}
    AddBrand --> AttrCheck
    AttrCheck -->|Có| AddAttr[➕ Thêm attributes filter]
    AttrCheck -->|Không| DoSearch[🚀 Gọi API]
    AddAttr --> DoSearch
    
    DoSearch --> HasResults{✅ Có kết quả?}
    HasResults -->|Có| Present[📋 Trình bày sản phẩm]
    HasResults -->|Không| Suggest[💡 Gợi ý khác]
    
    Present --> NextAction{👉 Khách muốn?}
    NextAction -->|Chi tiết| Detail[📖 Get Product Detail]
    NextAction -->|So sánh| Compare
    NextAction -->|Mua| Buy[🛒 Link mua hàng]
    NextAction -->|Khác| Start
    
    Compare --> GetDetails[📖 Lấy chi tiết 2-3 SKU]
    GetDetails --> BuildTable[📊 Bảng so sánh]
    BuildTable --> Recommend[💡 Khuyến nghị]
    
    Advise --> A1[🔍 Researcher: Tìm sản phẩm]
    A1 --> A2[⚖️ Comparator: So sánh top 3]
    A2 --> A3[💡 Advisor: Tổng hợp tư vấn]
    A3 --> A4[🎁 Gợi ý phụ kiện]
    A4 --> FinalAdvice[📋 Tư vấn hoàn chỉnh]
    
    Support --> SRAG{📚 Tìm trong RAG?}
    SRAG -->|Có| AnswerRAG[✅ Trả lời từ RAG]
    SRAG -->|Không| FetchHelp[🌐 Fetch help.phongvu.vn]
    FetchHelp --> AnswerHelp[✅ Trả lời từ web]
    
    style Start fill:#e1f5fe
    style Present fill:#c8e6c9
    style FinalAdvice fill:#c8e6c9
    style AnswerRAG fill:#c8e6c9
    style AnswerHelp fill:#c8e6c9
    style Suggest fill:#ffcdd2
```

## Sequence Diagram: Tìm kiếm sản phẩm

```mermaid
sequenceDiagram
    actor User as 👤 Khách hàng
    participant Agent as 🤖 AI Agent
    participant Researcher as 🔍 Researcher
    participant MCP as ⚙️ MCP Server
    participant Proxy as ☁️ CF Worker
    participant API as 🔌 PV API

    User->>Agent: "Tìm laptop dưới 20 triệu"
    
    Agent->>Agent: Phân tích: query=laptop, price_lte=20000000
    
    Agent->>Researcher: Spawn phongvu-researcher
    activate Researcher
    
    Researcher->>MCP: search_products(query, price_lte, return_filterable)
    activate MCP
    
    MCP->>Proxy: POST /v1/search {filter: {priceLte: 20000000}}
    activate Proxy
    Proxy->>API: Forward request
    activate API
    API-->>Proxy: Products + Filter Options
    deactivate API
    Proxy-->>Proxy: Map response
    Proxy-->>MCP: Response
    deactivate Proxy
    
    MCP->>MCP: summarizeProduct() + summarizeFilters()
    MCP-->>Researcher: {products, filter_options}
    deactivate MCP
    
    Researcher->>Researcher: Lọc & xếp hạng theo relevance
    Researcher-->>Agent: Danh sách laptop dưới 20M
    deactivate Researcher
    
    Agent->>Agent: Format response (giá VND, link, KM)
    Agent-->User: 📋 Top 5 laptop dưới 20 triệu + link mua
```

## Sequence Diagram: Tư vấn mua hàng (Full Pipeline)

```mermaid
sequenceDiagram
    actor User as 👤 Khách hàng
    participant Agent as 🤖 AI Agent
    participant R as 🔍 Researcher
    participant C as ⚙️ Comparator
    participant A as 💡 Advisor
    participant MCP as ⚙️ MCP Server

    User->>Agent: "Tư vấn laptop cho sinh viên, budget 20tr"
    
    Agent->>Agent: Phân tích: mục đích=SV, budget=20M
    
    rect rgb(232, 245, 233)
        Note over Agent,R: Phase 1: Research
        Agent->>R: Spawn researcher
        R->>MCP: search_products("laptop", price_lte=20000000, attributes={nhucausudung: "26699"})
        MCP-->>R: 10 products + filter_options
        R->>R: Lọc top 5 phù hợp SV
        R-->>Agent: Top 5 laptop
    end
    
    rect rgb(227, 242, 253)
        Note over Agent,C: Phase 2: Compare
        Agent->>C: Spawn comparator (top 3 SKU)
        C->>MCP: compare_products(skus)
        MCP-->>C: Chi tiết 3 sản phẩm
        C->>C: Build bảng đối chiếu
        C-->>Agent: Bảng so sánh specs
    end
    
    rect rgb(255, 243, 224)
        Note over Agent,A: Phase 3: Advise
        Agent->>A: Spawn advisor
        A->>MCP: check_stock(sku) + get_recommendations(sku)
        MCP-->>A: Stock + phụ kiện
        A->>A: Tổng hợp tư vấn
        A-->>Agent: Khuyến nghị + phụ kiện
    end
    
    Agent->>Agent: Format response hoàn chỉnh
    Agent-->User: 💡 Tư vấn: Laptop X + lý do + phụ kiện + link mua
```

## Sequence Diagram: Hỗ trợ khách hàng (Support)

```mermaid
sequenceDiagram
    actor User as 👤 Khách hàng
    participant Agent as 🤖 AI Agent
    participant Support as 🆘 Support Agent
    participant RAG as 📚 RAG Data
    participant WebFetch as 🌐 webfetch

    User->>Agent: "Laptop mua 3 ngày bị lỗi, đổi trả được không?"
    
    Agent->>Agent: Phân tích: câu hỏi đổi trả → support
    Agent->>Support: Spawn phongvu-support
    
    rect rgb(232, 245, 233)
        Note over Support,RAG: Ưu tiên 1: RAG Local
        Support->>RAG: Đọc 12-doi-tra-hoan-tien.md
        RAG-->>Support: Nội dung chính sách đổi trả
    end
    
    Support->>Support: Tìm điều kiện đổi trả trong 7 ngày
    
    alt Tìm thấy trong RAG
        Support-->>Agent: Chính sách + điều kiện + quy trình
    else Không tìm thấy
        rect rgb(255, 243, 224)
            Note over Support,WebFetch: Ưu tiên 2: Fetch web
            Support->>WebFetch: webfetch("https://help.phongvu.vn/llms-full.txt")
            WebFetch-->>Support: Nội dung mới nhất
        end
        Support-->>Agent: Thông tin từ web
    end
    
    Agent-->User: ✅ Đổi trả được trong 7 ngày nếu lỗi NSX. Quy trình: ...
```

## Skill Structure

```mermaid
graph LR
    Main[📋 phongvu-sales-agent<br/>Orchestrator] --> R[🔍 phongvu-researcher<br/>Search & Filter]
    Main --> C[⚖️ phongvu-comparator<br/>Product Comparison]
    Main --> A[💡 phongvu-advisor<br/>Sales Advisor]
    Main --> S[🆘 phongvu-support<br/>Customer Support]
    
    R & C & A -->|MCP| MCP[⚙️ MCP Server<br/>6 tools]
    S -->|RAG| RAG[📚 rag-data/<br/>23 files]
    S -->|Fetch| HELP[🌐 help.phongvu.vn]
    
    MCP -->|API| PV[🔌 Phong Vũ API]
    
    style Main fill:#e8eaf6
    style R fill:#e3f2fd
    style C fill:#e0f7fa
    style A fill:#e8f5e9
    style S fill:#fff3e0
    style MCP fill:#f3e5f5
```

## MCP Tools

| Tool | Description | Input |
| --- | --- | --- |
| `search_products` | Tìm kiếm + filter (price, brand, attributes, sort) | `{ query, page?, limit?, price_lte?, price_gte?, has_promotions?, brands?, attributes?, sort?, order?, return_filterable? }` |
| `get_product_detail` | Chi tiết sản phẩm | `{ sku }` |
| `compare_products` | So sánh 2-3 sản phẩm | `{ skus: [sku1, sku2] }` |
| `get_popular_keywords` | Từ khóa phổ biến | `{ limit? }` |
| `get_recommendations` | Sản phẩm gợi ý | `{ sku }` |
| `check_stock` | Kiểm tra tồn kho & KM | `{ sku }` |

## Project Structure

```text
phongvu-ai-agent/
├── README.md
├── .mcp.json                              # MCP config
├── cloudflare-worker/                     # API Proxy (Cloudflare Worker)
│   └── src/worker.js
├── mcp-server/                            # MCP Server (Node.js)
│   └── index.js                           # 6 tools: search, detail, compare, ...
├── rag-data/                              # RAG data (23 files from help.phongvu.vn)
│   ├── phongvu-help-full.md               # Full content (1824 lines)
│   ├── 01-gioi-thieu.md ~ 23-tuyen-dung.md
│   └── README.md
└── skills/
    └── phongvu-sales-agent/
        ├── SKILL.md                       # Main orchestrator
        ├── references/api.md              # API reference
        ├── scripts/                       # Download scripts
        ├── phongvu-researcher/            # Search & filter
        │   └── SKILL.md
        ├── phongvu-comparator/            # Product comparison
        │   └── SKILL.md
        ├── phongvu-advisor/               # Sales advisor
        │   └── SKILL.md
        └── phongvu-support/               # Customer support
            ├── SKILL.md
            ├── references/rag-data-guide.md
            └── scripts/fetch-help.ts
```

## Quick Start

### 1. Deploy Cloudflare Worker

```bash
cd cloudflare-worker
npm install
wrangler deploy
wrangler secret put PHONGVU_API_BASE
```

### 2. Run MCP Server

```bash
cd mcp-server
npm install
npm start
```

### 3. Update RAG Data

```bash
cd skills/phongvu-sales-agent/phongvu-support
npx tsx scripts/fetch-help.ts --all
```

### 4. Vercel AI SDK Integration

```typescript
import { streamText, tool, isStepCount } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const tools = {
  search_products: tool({
    description: "Tìm kiếm sản phẩm Phong Vũ",
    inputSchema: z.object({
      query: z.string(),
      price_lte: z.number().optional(),
      brands: z.array(z.string()).optional(),
    }),
    execute: async ({ query, price_lte, brands }) => {
      const filter = {};
      if (price_lte) filter.priceLte = price_lte;
      if (brands?.length) filter.brands = brands;

      const res = await fetch("https://phongvu-api-proxy.tannhatcms.io.vn/v1/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, terminalCode: "phongvu", filter }),
      });
      return res.json();
    },
  }),
};

const result = streamText({
  model: openai("gpt-4o-mini"),
  system: "Bạn là trợ lý bán hàng AI của Phong Vũ...",
  messages: [{ role: "user", content: "Tìm laptop gaming dưới 20 triệu" }],
  tools,
  stopWhen: isStepCount(5),
});
```

## Security

- **Hide API gốc**: Client chỉ biết domain worker
- **Fake Headers**: Giả vờ từ phongvu.vn khi gọi upstream
- **Rate Limiting**: Giới hạn request/phút per IP
- **Endpoint Whitelist**: Chỉ cho phép các endpoint hợp lệ

## Expected Outcomes

- **+15-20%** conversion rate increase
- **-20%** customer drop-off during discovery
- **40%** offload basic product inquiries

## Key Features

1. **Real-time data** - Live price, stock, promotions
2. **Product comparison** - Side-by-side specs
3. **Smart recommendations** - Budget-aware suggestions
4. **Vietnamese language** - Native support
5. **Direct checkout links** - Guide to purchase
6. **API Security** - Cloudflare Worker proxy
7. **Customer support** - RAG-based FAQ from help.phongvu.vn
8. **Filter system** - Price, brand, attributes, sort
