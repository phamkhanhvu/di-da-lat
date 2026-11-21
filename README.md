# Đà Lạt Đi Đâu

Cẩm nang 50 địa điểm ở Đà Lạt và vùng ven. Tìm tên có hoặc không dấu, lọc theo loại, lưu địa điểm trên trình duyệt và mở chỉ đường. Mỗi địa điểm có trang riêng.

## Chạy trên máy hoặc Codex Cloud

Dùng Node.js 20 trở lên. Dự án không có phụ thuộc bên ngoài.

```sh
npm run build
npm test
npm start
```

Mở địa chỉ mà lệnh `npm start` in ra. Lệnh `npm run build` xuất trang chủ và các trang chi tiết vào `dist/`. Để triển khai, dùng thư mục `dist/` với dịch vụ lưu trữ website tĩnh.

## Cập nhật nội dung

Danh sách địa điểm nằm trong `src/places.mjs`. Thời lượng là gợi ý cho khách. Giờ và vé chỉ xuất hiện khi có dữ liệu đối chiếu, và có thể thay đổi. Ảnh địa điểm và ảnh bìa được lấy từ các địa chỉ ảnh hiện có khi trình duyệt có kết nối.
