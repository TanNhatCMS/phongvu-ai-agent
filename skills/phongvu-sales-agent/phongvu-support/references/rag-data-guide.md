# RAG Data - Phong Vũ Help Center

Dữ liệu đã crawl từ https://help.phongvu.vn/ dùng cho hệ thống RAG.

## Nguồn dữ liệu

| URL | Mô tả |
|-----|-------|
| `https://help.phongvu.vn/llms-full.txt` | Toàn bộ nội dung (markdown) |
| `https://help.phongvu.vn/llms.txt` | Danh sách tất cả trang |

## Cấu trúc thư mục rag-data

```
rag-data/
├── phongvu-help-full.md          # Toàn bộ nội dung help (1824 dòng)
├── 01-gioi-thieu.md              # Giới thiệu Phong Vũ
├── 02-bao-mat-du-lieu.md         # Chính sách bảo mật
├── 03-gia-ca-thanh-toan.md       # Giá cả & thanh toán
├── 04-canh-bao-gia-mao.md        # Cảnh báo giả mạo
├── 05-dieu-kien-giao-dich.md     # Điều kiện giao dịch
├── 06-giai-quyet-khieu-nai.md    # Giải quyết khiếu nại
├── 07-huong-dan-mua-hang.md      # Hướng dẫn mua hàng
├── 08-chinh-sach-thanh-toan.md   # Chính sách thanh toán
├── 09-bao-mat-thanh-toan.md      # Bảo mật thanh toán
├── 10-giao-hang-ho-ky-thuat.md   # Giao hàng & hỗ trợ kỹ thuật
├── 11-lap-dat-nang-cap.md        # Lắp đặt & nâng cấp
├── 12-doi-tra-hoan-tien.md       # Đổi trả & hoàn tiền
├── 13-khui-hop-apple.md          # Khui hộp Apple
├── 14-chinh-sach-bao-hanh.md     # Chính sách bảo hành
├── 15-chinh-sach-tra-gop.md      # Trả góp
├── 16-huong-dan-vnpay-qr.md      # Hướng dẫn VNPay QR
├── 17-dat-coc-giu-hang.md        # Đặt cọc giữ hàng
├── 18-trung-tam-bao-hanh.md      # Trung tâm bảo hành
├── 19-dich-vu-sua-chua.md        # Dịch vụ sửa chữa
├── 20-the-thanh-vien.md          # Thẻ thành viên
├── 21-doanh-nghiep-than-thiet.md # Doanh nghiệp thân thiết
├── 22-tich-diem-loyalty.md       # Tích điểm Loyalty
├── 23-tuyen-dung.md              # Tuyển dụng
```

## Mapping URL → File

| File | Nguồn URL |
|------|-----------|
| `01-gioi-thieu.md` | https://help.phongvu.vn/master.md |
| `02-bao-mat-du-lieu.md` | https://help.phongvu.vn/chinh-sach-chung/bao-mat-thong-tin.md |
| `03-gia-ca-thanh-toan.md` | https://help.phongvu.vn/chinh-sach-chung/gia-ca-va-hinh-thuc-thanh-toan.md |
| `04-canh-bao-gia-mao.md` | https://help.phongvu.vn/chinh-sach-chung/canh-bao-gia-mao-nhan-vien-giao-hang-de-lua-dao-shipper.md |
| `05-dieu-kien-giao-dich.md` | https://help.phongvu.vn/chinh-sach-ban-hang/dieu-kien-giao-dich.md |
| `06-giai-quyet-khieu-nai.md` | https://help.phongvu.vn/chinh-sach-ban-hang/chinh-sach-giai-quyet-khieu-nai.md |
| `07-huong-dan-mua-hang.md` | https://help.phongvu.vn/chinh-sach-ban-hang/huong-dan-mua-hang-online.md |
| `08-chinh-sach-thanh-toan.md` | https://help.phongvu.vn/chinh-sach-ban-hang/chinh-sach-thanh-toan.md |
| `09-bao-mat-thanh-toan.md` | https://help.phongvu.vn/chinh-sach-ban-hang/chinh-sach-bao-mat-thanh-toan.md |
| `10-giao-hang-ho-ky-thuat.md` | https://help.phongvu.vn/chinh-sach-ban-hang/giao-hang-va-lap-dat-tai-nha.md |
| `11-lap-dat-nang-cap.md` | https://help.phongvu.vn/chinh-sach-ban-hang/dich-vu-lap-dat-nang-cap-pc-nang-cap-laptop-tai-showroom-ttbh-cua-phong-vu.md |
| `12-doi-tra-hoan-tien.md` | https://help.phongvu.vn/chinh-sach-ban-hang/doi-tra-va-hoan-tien.md |
| `13-khui-hop-apple.md` | https://help.phongvu.vn/chinh-sach-ban-hang/chinh-sach-khui-hop-san-pham-apple.md |
| `14-chinh-sach-bao-hanh.md` | https://help.phongvu.vn/chinh-sach-ban-hang/bao-hanh.md |
| `15-chinh-sach-tra-gop.md` | https://help.phongvu.vn/chinh-sach-ban-hang/tra-gop.md |
| `16-huong-dan-vnpay-qr.md` | https://help.phongvu.vn/chinh-sach-ban-hang/huong-dan-thanh-toan-vnpay-qr.md |
| `17-dat-coc-giu-hang.md` | https://help.phongvu.vn/chinh-sach-ban-hang/chinh-sach-dat-coc-va-giu-hang.md |
| `18-trung-tam-bao-hanh.md` | https://help.phongvu.vn/dich-vu-khach-hang/he-thong-trung-tam-bao-hanh-phong-vu.md |
| `19-dich-vu-sua-chua.md` | https://help.phongvu.vn/dich-vu-khach-hang/dich-vu-sua-chua-va-bao-tri.md |
| `20-the-thanh-vien.md` | https://help.phongvu.vn/dich-vu-khach-hang/the-thanh-vien.md |
| `21-doanh-nghiep-than-thiet.md` | https://help.phongvu.vn/dich-vu-khach-hang/doanh-nghiep-than-thiet.md |
| `22-tich-diem-loyalty.md` | https://help.phongvu.vn/dich-vu-khach-hang/quy-trinh-ve-tich-and-doi-diem-loyalty-tren-ung-dung-phong-vu.md |
| `23-tuyen-dung.md` | https://help.phongvu.vn/ho-tro/tuyen-dung.md |

## Cập nhật dữ liệu

Chạy script `scripts/fetch-help.ts` để download lại dữ liệu mới nhất:

```bash
npx tsx scripts/fetch-help.ts
```

Hoặc fetch thủ công:
```bash
curl https://help.phongvu.vn/llms-full.txt -o rag-data/phongvu-help-full.md
```
