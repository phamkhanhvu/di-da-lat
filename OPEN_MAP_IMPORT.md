# Chuẩn bị dữ liệu 500 điểm

Nhánh thử nghiệm giữ dữ liệu 50 điểm đang có để kiểm tra giao diện. Bộ nhập chỉ ghi danh sách mới khi chọn được đúng 500 địa điểm khác nhau.

```sh
node scripts/import-places.mjs
npm test
npm run build
```

Để dùng một bản tải công khai từ Overpass đã có sẵn, chạy `node scripts/import-places.mjs /duong-dan/overpass.json`. Chỉ triển khai `dist/` sau khi đã kiểm tra dữ liệu thật. Các mục có `mapRecord` lấy dữ liệu vị trí từ OpenStreetMap và được phân phối theo ODbL. Các mục chưa có ảnh địa điểm dùng biểu tượng theo nhóm.

Dữ liệu bản đồ © OpenStreetMap contributors. https://www.openstreetmap.org/copyright
