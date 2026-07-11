/**
 * Fetch Phong Vũ Help Center data and save to rag-data/
 *
 * Usage:
 *   npx tsx scripts/fetch-help.ts              # Fetch llms-full.txt (full content)
 *   npx tsx scripts/fetch-help.ts --urls        # Fetch llms.txt (URL list only)
 *   npx tsx scripts/fetch-help.ts --all         # Fetch both full + individual pages
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAG_DIR = join(__dirname, "..", "..", "..", "..", "rag-data");

const URLS = {
  full: "https://help.phongvu.vn/llms-full.txt",
  index: "https://help.phongvu.vn/llms.txt",
};

const PAGES: Record<string, string> = {
  "01-gioi-thieu.md": "https://help.phongvu.vn/master.md",
  "02-bao-mat-du-lieu.md": "https://help.phongvu.vn/chinh-sach-chung/bao-mat-thong-tin.md",
  "03-gia-ca-thanh-toan.md": "https://help.phongvu.vn/chinh-sach-chung/gia-ca-va-hinh-thuc-thanh-toan.md",
  "04-canh-bao-gia-mao.md": "https://help.phongvu.vn/chinh-sach-chung/canh-bao-gia-mao-nhan-vien-giao-hang-de-lua-dao-shipper.md",
  "05-dieu-kien-giao-dich.md": "https://help.phongvu.vn/chinh-sach-ban-hang/dieu-kien-giao-dich.md",
  "06-giai-quyet-khieu-nai.md": "https://help.phongvu.vn/chinh-sach-ban-hang/chinh-sach-giai-quyet-khieu-nai.md",
  "07-huong-dan-mua-hang.md": "https://help.phongvu.vn/chinh-sach-ban-hang/huong-dan-mua-hang-online.md",
  "08-chinh-sach-thanh-toan.md": "https://help.phongvu.vn/chinh-sach-ban-hang/chinh-sach-thanh-toan.md",
  "09-bao-mat-thanh-toan.md": "https://help.phongvu.vn/chinh-sach-ban-hang/chinh-sach-bao-mat-thanh-toan.md",
  "10-giao-hang-ho-ky-thuat.md": "https://help.phongvu.vn/chinh-sach-ban-hang/giao-hang-va-lap-dat-tai-nha.md",
  "11-lap-dat-nang-cap.md": "https://help.phongvu.vn/chinh-sach-ban-hang/dich-vu-lap-dat-nang-cap-pc-nang-cap-laptop-tai-showroom-ttbh-cua-phong-vu.md",
  "12-doi-tra-hoan-tien.md": "https://help.phongvu.vn/chinh-sach-ban-hang/doi-tra-va-hoan-tien.md",
  "13-khui-hop-apple.md": "https://help.phongvu.vn/chinh-sach-ban-hang/chinh-sach-khui-hop-san-pham-apple.md",
  "14-chinh-sach-bao-hanh.md": "https://help.phongvu.vn/chinh-sach-ban-hang/bao-hanh.md",
  "15-chinh-sach-tra-gop.md": "https://help.phongvu.vn/chinh-sach-ban-hang/tra-gop.md",
  "16-huong-dan-vnpay-qr.md": "https://help.phongvu.vn/chinh-sach-ban-hang/huong-dan-thanh-toan-vnpay-qr.md",
  "17-dat-coc-giu-hang.md": "https://help.phongvu.vn/chinh-sach-ban-hang/chinh-sach-dat-coc-va-giu-hang.md",
  "18-trung-tam-bao-hanh.md": "https://help.phongvu.vn/dich-vu-khach-hang/he-thong-trung-tam-bao-hanh-phong-vu.md",
  "19-dich-vu-sua-chua.md": "https://help.phongvu.vn/dich-vu-khach-hang/dich-vu-sua-chua-va-bao-tri.md",
  "20-the-thanh-vien.md": "https://help.phongvu.vn/dich-vu-khach-hang/the-thanh-vien.md",
  "21-doanh-nghiep-than-thiet.md": "https://help.phongvu.vn/dich-vu-khach-hang/doanh-nghiep-than-thiet.md",
  "22-tich-diem-loyalty.md": "https://help.phongvu.vn/dich-vu-khach-hang/quy-trinh-ve-tich-and-doi-diem-loyalty-tren-ung-dung-phong-vu.md",
  "23-tuyen-dung.md": "https://help.phongvu.vn/ho-tro/tuyen-dung.md",
};

function fixUrls(content: string): string {
  content = content.replace("](/files/", "](https://help.phongvu.vn/files/");
  content = content.replace('src="/files/', 'src="https://help.phongvu.vn/files/');
  return content;
}

async function fetchText(url: string): Promise<string> {
  console.log(`Fetching: ${url}`);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PhongVuAgent/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

async function fetchFull() {
  const content = await fetchText(URLS.full);
  const fixed = fixUrls(content);
  const filepath = join(RAG_DIR, "phongvu-help-full.md");
  writeFileSync(filepath, fixed, "utf-8");
  console.log(`Saved: ${filepath} (${fixed.length} bytes)`);
}

async function fetchIndex() {
  const content = await fetchText(URLS.index);
  const filepath = join(RAG_DIR, "llms-index.txt");
  writeFileSync(filepath, content, "utf-8");
  console.log(`Saved: ${filepath} (${content.length} bytes)`);
}

async function fetchAllPages() {
  for (const [filename, url] of Object.entries(PAGES)) {
    try {
      const content = await fetchText(url);
      const fixed = fixUrls(content);
      const filepath = join(RAG_DIR, filename);
      writeFileSync(filepath, fixed, "utf-8");
      console.log(`  ${filename} (${fixed.length} bytes)`);
    } catch (err) {
      console.error(`  FAILED: ${filename} - ${err}`);
    }
  }
}

async function main() {
  if (!existsSync(RAG_DIR)) {
    mkdirSync(RAG_DIR, { recursive: true });
  }

  const args = process.argv.slice(2);

  if (args.includes("--urls")) {
    await fetchIndex();
  } else if (args.includes("--all")) {
    await fetchFull();
    await fetchIndex();
    await fetchAllPages();
  } else {
    await fetchFull();
  }

  console.log("Done!");
}

main().catch(console.error);
