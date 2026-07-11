import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
rag_dir = os.path.join(SCRIPT_DIR, "..", "..", "..", "rag-data")

files = {
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
}

# Print URLs for reference
for name, url in files.items():
    print(f"{name}: {url}")

print(f"\nTotal: {len(files)} files")
print(f"\nFiles to create in: {rag_dir}")
