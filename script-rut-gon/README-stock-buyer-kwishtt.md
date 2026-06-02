# MG: Stock Buyer

Userscript cho Magic Garden giúp theo dõi shop và tự động mua các item đã chọn khi có stock.

Made by kwishtt.

## Cài đặt nhanh

1. Cài một userscript manager:
   - Tampermonkey : 
   - Violentmonkey
2. Xem huớng dẫn trong Tampermonkey/Violentmonkey để mở allow user script. 
3. Bấm link cài script:
   https://raw.githubusercontent.com/kwishtt/MG-Stock-Buyer/refs/heads/main/stock-buyer-kwishtt.user.js
4. Bấm `Install` / `Confirm installation`.
5. Mở lại Magic Garden và vào room như bình thường.

Script hoạt động trên: Web, Discord Web. Không hoạt động trên app desktop.

## Chức năng chính

- Tự động mua item trong shop theo danh sách bạn chọn.
- Hỗ trợ `Seed`, `Egg`, `Tool`, và `Decor`.
- Đọc stock shop và inventory để xác nhận mua thành công.
- Lấy tên item, giá coin và hình ảnh từ Magic Garden API.
- Có catalog dự phòng nếu API tạm thời lỗi.
- Lưu cấu hình, danh sách item và thống kê mua trên trình duyệt.
- Cơ chế anti-AFK chạy kèm script.
- Nút `Vào vườn MGL` để chuyển nhanh sang room `MGL`.

## Cách dùng

1. Vào game và chờ panel `Stock Buyer` hiện lên.
2. Chọn loại item và item cần mua trong dropdown.
3. Bấm nút `+` để thêm item vào danh sách.
4. Bấm `Mua nhanh` nếu muốn quét shop và mua ngay một lần.
5. Bật `Auto: ON` nếu muốn script tự quét shop theo chu kỳ.

## Tùy chọn

- `Quét mỗi`: thời gian giữa các lần tự động quét shop.
- `Mua Tối đa`: số lượng tối đa mỗi item trong một lần quét.
- `Max Stock`: mua tối đa theo stock hiện có của shop.

Ví dụ: nếu `Mua Tối đa = 10` nhưng shop chỉ còn 3 item, script chỉ mua tối đa 3 item.

## Nút trên panel

- `Vào vườn MGL`: chuyển tab hiện tại sang `https://magicgarden.gg/r/MGL`.
- `Auto: ON/OFF`: bật hoặc tắt chế độ tự động quét.
- `Mua nhanh`: quét shop và mua ngay một lần.
- Nút thùng rác: reset thống kê mua.
- Nút giỏ hàng trên từng item: mua riêng item đó một lần.
- Nút xóa trên từng item: xóa item khỏi danh sách.

## Trạng thái và log

Panel sẽ hiện log ngắn gọn để biết script đang làm gì:

- `Đã mua ...`: mua thành công.
- `Hết hàng`: shop không còn item đó.
- `Túi đồ đầy`: inventory đầy, script dừng mua.
- `Lỗi lấy dữ liệu shop`: script chưa đọc được stock shop.
- `Không mua được ...`: đã gửi lệnh mua nhưng game không xác nhận stock/inventory thay đổi.

## Cập nhật script

Khi có phiên bản mới, mở lại link cài đặt:

https://raw.githubusercontent.com/kwishtt/MG-Stock-Buyer/refs/heads/main/stock-buyer-kwishtt.user.js

Tampermonkey/Violentmonkey sẽ hiện màn hình cập nhật nếu script đã được cài trước đó.

## Lưu ý

- Script cần đọc được game state để biết shop còn hàng hay không.
- Nếu game đổi cấu trúc nội bộ, tính năng xác nhận mua có thể cần cập nhật lại.
- Giá và hình ảnh item lấy từ `https://mg-api.ariedam.fr`; nếu API lỗi, script sẽ dùng catalog dự phòng.
- Hãy kiểm tra danh sách item và giới hạn mua trước khi bật `Auto: ON`.
