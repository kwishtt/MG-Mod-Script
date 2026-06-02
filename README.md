# MG Stock Buyer

Userscript rieng cho Magic Garden, chi giu phan Stock Buyer tu script goc va them mot so tien ich nho.

Made by kwishtt.

## Cai dat

1. Cai Tampermonkey hoac Violentmonkey.
2. Mo file `stock-buyer-kwishtt.user.js`.
3. Copy noi dung script vao userscript moi.
4. Luu script va vao game Magic Garden.

Script chay tren:

- `https://magicgarden.gg/r/*`
- `https://magiccircle.gg/r/*`
- `https://starweaver.org/r/*`
- Discord Activity domain cua game

## Chuc nang

- Tu dong mua item trong shop theo danh sach da dang ky.
- Ho tro seed, egg, tool, decor.
- Lay data item, gia coin va hinh anh tu Magic Garden API.
- Xac nhan mua bang cach doi shop stock giam va inventory tang.
- Log gon: tien trinh mua nhieu cai se cap nhat tren mot dong.
- Anti-AFK tu script goc: giu tab visible/focus, audio keep-alive, mousemove heartbeat, ping vi tri player.
- Nut `Vao vuon MGL` de chuyen tab hien tai sang `https://magicgarden.gg/r/MGL`.

## Cach dung

1. Vao game va cho panel `Stock Buyer` hien len.
2. Chon item trong dropdown.
3. Bam nut `+` de them item vao danh sach.
4. Bam `Mua nhanh` de quet va mua ngay.
5. Bat `Auto: ON` neu muon script tu quet theo chu ky.

## Tuy chon

- `Quet moi`: chon khoang thoi gian tu dong quet shop.
- `Mua Toi da`: so luong toi da moi item moi lan quet.
- `Max Stock`: neu shop con bao nhieu thi mua het bay nhieu, toi khi het stock hoac tui do day.

Vi du: neu dat `Mua Toi da = 10` ma shop chi con 3 mon, script chi mua toi da 3 mon.

## Nut tren panel

- `Vao vuon MGL`: doi tab hien tai sang room MGL.
- `Auto: ON/OFF`: bat/tat che do tu dong quet.
- `Mua nhanh`: quet va mua mot lan ngay lap tuc.
- Nut thung rac: reset thong ke mua.
- Nut gio hang tren tung item: mua ngay 1 lan item do.
- Nut xoa tren tung item: xoa item khoi danh sach.

## Log

Log hien trang thai ngan gon:

- `Da mua ...`: mua thanh cong.
- `Het hang`: shop khong con item do.
- `Tui do day`: inventory day, script dung mua.
- `Loi lay du lieu shop`: chua doc duoc stock shop.
- `Khong mua duoc ...`: lenh da gui nhung shop/inventory khong xac nhan thay doi.

## Luu y

- Script can doc duoc game atoms hoac WebSocket state de xac nhan stock.
- Gia va hinh anh item lay tu `https://mg-api.ariedam.fr`; neu API loi, script se dung catalog du phong.
- Anti-AFK chay tu dong cung script.
- Script khong co dry-run mode.

## File lien quan

- Script: `tools/stock-buyer-kwishtt.user.js`
- Smoke test: `tests/stock-buyer-standalone.test.js`
- Purchase payload test: `tests/stock-buyer-purchase-shop-item.test.js`
