# Đà Lạt Đi Đâu trên Zalo

Bản Mini App dùng chung danh mục, bài chi tiết và ảnh với website trong kho này. App có tìm kiếm tiếng Việt, bộ lọc, danh sách đã lưu, mục Sense Acoustic Cafe và trang giới thiệu Sense Group. Nút chat xuất hiện khi cấu hình OA SENSE DALAT.

## Chạy thử

Cần Node.js 20 trở lên. Chạy từ thư mục gốc của kho.

```sh
cd zalo-mini-app
npm install
npm test
npm run start
```

Bản trình duyệt dùng để kiểm tra giao diện và danh mục. Kiểm tra chức năng gọi, chat và lưu lâu dài trên thiết bị qua bản Testing của Zalo.

```sh
npm run build
```

Gói nằm ở `zalo-mini-app/www`. Vite và plugin Zalo tạo danh sách tài nguyên cho `app-config.json` trong gói.

## Kết nối OA và tải bản Testing

1. Điền OA ID công khai vào `VITE_SENSE_OA_ID` trong `.env.local` nếu muốn mở chat và hỏi đặt bàn qua Zalo. Dùng `.env.example` làm mẫu rồi build lại. Giá trị này là OA ID, khác Mini App ID.
2. Tạo hoặc mở ứng dụng **Đà Lạt Đi Đâu** trong [trang quản lý Zalo Mini App](https://mini.zalo.me/developers/), lấy **Mini App ID** và đăng nhập ZMP CLI bằng tài khoản có quyền triển khai.
3. Từ `zalo-mini-app`, chạy `zmp login`, rồi `zmp deploy`. Chọn **Deploy your existing project**, nhập Mini App ID và chọn thư mục `www` theo hướng dẫn của CLI. Quét QR của bản Testing trên Zalo.
4. Sau khi kiểm tra xong và xác thực Mini App, gửi phiên bản để Zalo xét duyệt. Phát hành từ Mini App Center khi được duyệt.

[Hướng dẫn triển khai dự án có sẵn](https://docs.zaloplatforms.com/docs/MA/intro/getting-started/convert-web-app-to-mini-app) · [Hướng dẫn phát hành](https://docs.zaloplatforms.com/docs/MA/intro/public-mini-program)

Địa chỉ trong app có thể chọn và sao chép để tra đường. Danh sách đã lưu chỉ chứa ID địa điểm. Các bản ghi bản đồ dùng dữ liệu © OpenStreetMap contributors theo ODbL, dữ liệu nguồn có trong `map-catalog.json` của nhánh `deploy-static`.

### Tải bản Testing bằng đăng nhập QR

Chạy từ thư mục `zalo-mini-app` sau khi cài các gói npm.

```sh
npx --yes zmp-cli@4.0.7 login
npm run build
npx --yes zmp-cli@4.0.7 deploy --existing --testing --outputDir www --desc "Da Lat Di Dau - ban kiem thu"
```

Ở bước đăng nhập, nhập Mini App ID `3562112578721673014` và chọn xác thực bằng QR. Dùng Zalo của tài khoản có vai trò Admin hoặc Developer trong Mini App này để quét mã. Sau khi CLI báo tải lên thành công, dùng mã QR của bản Testing để mở app trên điện thoại.

[Đăng nhập Zalo CLI](https://docs.zaloplatforms.com/docs/MA/devtools/cli/login) · [Tải phiên bản Testing](https://docs.zaloplatforms.com/docs/MA/devtools/cli/deploy)

### Tải bản Testing bằng GitHub Actions

Job **Upload Zalo Testing** dành cho Mini App ID `3562112578721673014`. Job dùng Access Token của tài khoản Developer có quyền với Mini App này.

1. Tạo Access Token trong [Zalo API Explorer](https://developers.zalo.me/tools/explorer/) từ Zalo App cha đã liên kết với Mini App.
2. Lưu Access Token vào [GitHub Actions Secrets](https://github.com/phamkhanhvu/di-da-lat/settings/secrets/actions) với tên `ZALO_DEVELOPER_ACCESS_TOKEN`.
3. Chạy lại job **Upload Zalo Testing** trên pull request Mini App. Sau khi tải lên thành công, kiểm tra phiên bản Testing và mã QR trong Zalo Mini App Center.

Job đặt loại phiên bản là Testing. Khóa xác thực chỉ được nhập qua Actions Secrets.
