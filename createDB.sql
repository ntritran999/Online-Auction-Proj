create table Users (
    user_id serial primary key,
    full_name text not null,
    email text not null unique,
    password_hash text not null,
    address text,
    role text check (role in ('bidder','seller','admin')) default 'bidder',
    rating_plus integer default 0,
    rating_minus integer default 0,
    created_at timestamp default now()
);

create table Category (
    category_id serial primary key,
    category_name text not null,
    parent_cat integer null references Category(category_id)
);

create table Products (
    product_id serial primary key,
    seller_id integer references Users(user_id) on delete cascade,
    category_id integer references Category(category_id) on delete set null,
    product_name text not null,
    description text,
    start_price numeric(12,2) not null,
    step_price numeric(12,2) not null,
    buy_now_price numeric(12,2),
    current_price numeric(12,2),
    auto_extend boolean default false,
    created_at timestamp default now(),
    end_time timestamp not null,
    bid_count integer default 0,
    highest_bidder integer references Users(user_id)
);

create table ProductImages (
    image_id serial primary key,
    product_id integer references Products(product_id) on delete cascade,
    image_url text not null
);

create table Bids (
    bid_id serial primary key,
    product_id integer references Products(product_id) on delete cascade,
    bidder_id integer references Users(user_id) on delete cascade,
    bid_amount numeric(12,2) not null,
    created_at timestamp default now()
);

create table AutoBids (
    autobid_id serial primary key,
    product_id integer references Products(product_id) on delete cascade,
    bidder_id integer references Users(user_id) on delete cascade,
    max_bid numeric(12,2) not null,
    created_at timestamp default now()
);

create table Watchlist (
    watch_id serial primary key,
    user_id integer references Users(user_id) on delete cascade,
    product_id integer references Products(product_id) on delete cascade,
    added_at timestamp default now()
);

create table Ratings (
    rating_id serial primary key,
    rater_id integer references Users(user_id) on delete cascade,
    target_id integer references Users(user_id) on delete cascade,
    product_id integer references Products(product_id) on delete cascade,
    rating_value integer check (rating_value in (1,-1)),
    comment text,
    created_at timestamp default now()
);

create table Questions (
    question_id serial primary key,
    product_id integer references Products(product_id) on delete cascade,
    user_id integer references Users(user_id) on delete cascade,
    question_text text not null,
    created_at timestamp default now()
);

create table Answers (
    answer_id serial primary key,
    question_id integer references Questions(question_id) on delete cascade,
    seller_id integer references Users(user_id) on delete cascade,
    answer_text text not null,
    created_at timestamp default now()
);

create table Transactions (
    transaction_id serial primary key,
    product_id integer references Products(product_id) on delete cascade,
    buyer_id integer references Users(user_id) on delete cascade,
    seller_id integer references Users(user_id) on delete cascade,
    invoice_url text,
    shipping_address text,
    payment_status text,
    created_at timestamp default now()
);

create table EmailNotifications (
    email_id serial primary key,
    user_id integer references Users(user_id) on delete cascade,
    subject text,
    message text,
    sent_at timestamp default now()
);

create table ChatMessages (
    chat_id serial primary key,
    transaction_id integer references Transactions(transaction_id) on delete cascade,
    sender_id integer references Users(user_id) on delete cascade,
    message_text text not null,
    sent_at timestamp default now()
);

create table SystemConfig (
    config_id serial primary key,
    key text unique,
    value text
);

create extension if not exists unaccent;
create or replace function immutable_unaccent(word text) returns text
as $$
  select unaccent(word);
$$ language sql immutable parallel safe strict;

alter table products
add column if not exists fts tsvector generated always as (to_tsvector('english', immutable_unaccent(lower(product_name)) || ' ' || immutable_unaccent(lower(description)))) stored;

create index if not exists products_fts on products using gin (fts);

insert into users (full_name, email, password_hash, address, role)
values
('Nguyễn Văn A', 'a@gmail.com', 'hash1', 'Hà Nội', 'seller'),
('Trần Thị B', 'b@gmail.com', 'hash2', 'Đà Nẵng', 'bidder'),
('Lê Văn C', 'c@gmail.com', 'hash3', 'TP. Hồ Chí Minh', 'bidder'),
('Phạm Thị D', 'd@gmail.com', 'hash4', 'Huế', 'bidder'),
('Đỗ Văn E', 'e@gmail.com', 'hash5', 'Hà Nội', 'seller'),
('Hoàng Thị F', 'f@gmail.com', 'hash6', 'Cần Thơ', 'bidder'),
('Nguyễn Văn G', 'g@gmail.com', 'hash7', 'TP. Hồ Chí Minh', 'bidder'),
('Trần Thị H', 'h@gmail.com', 'hash8', 'Đà Nẵng', 'seller'),
('Lê Văn I', 'i@gmail.com', 'hash9', 'Hải Phòng', 'bidder'),
('Phạm Thị K', 'k@gmail.com', 'hash10', 'Hà Nội', 'admin');


insert into category (category_name) values
('Điện tử'),
('Thời trang'),
('Sách'),
('Đồ gia dụng'),
('Sưu tầm');

insert into category (category_name, parent_cat) values
('Điện thoại', 1),
('Máy tính', 1),
('Tai nghe', 1),

('Quần áo nam', 2),
('Quần áo nữ', 2),
('Giày dép', 2),

('Sách nấu ăn', 3),
('Sách Thiếu nhi', 3),

('Đồ nhà bếp', 4),
('Đồ phòng ngủ', 4),

('Tiền xu', 5),
('Tem', 5);

insert into products (seller_id, category_id, product_name, description, start_price, step_price, buy_now_price, end_time)
values
(1, 1, 'Điện thoại iPhone 14 Pro', 'Điện thoại Apple 256GB, hàng chính hãng', 20000000, 500000, 25000000, now() + interval '3 days'),
(1, 1, 'Tivi Samsung 55 inch', 'Tivi thông minh 4K UHD', 12000000, 300000, 15000000, now() + interval '4 days'),
(1, 1, 'Laptop Macbook Air M2', 'Máy tính xách tay Apple M2 2023', 25000000, 500000, 28000000, now() + interval '5 days'),
(1, 2, 'Giày Nike Air Max', 'Giày thể thao nam chính hãng', 2000000, 100000, 2500000, now() + interval '3 days'),
(1, 3, 'Bộ truyện Harry Potter', 'Trọn bộ 7 tập, bản tiếng Việt', 800000, 50000, 1000000, now() + interval '2 days'),
(5, 4, 'Máy xay sinh tố Panasonic', 'Công suất 600W, 2 cối thủy tinh', 1500000, 50000, 1800000, now() + interval '4 days'),
(5, 4, 'Nồi chiên không dầu Philips', 'Dung tích 3 lít, tiết kiệm điện', 2200000, 100000, 2500000, now() + interval '4 days'),
(5, 5, 'Bộ tiền xu cổ Việt Nam', 'Tiền sưu tầm hiếm thế kỷ 20', 3000000, 100000, 4000000, now() + interval '3 days'),
(5, 2, 'Áo khoác Adidas nam', 'Chống gió, giữ ấm tốt', 1800000, 100000, 2200000, now() + interval '3 days'),
(8, 3, 'Bộ tiểu thuyết Chúa Nhẫn', 'Ấn bản sưu tầm tiếng Việt', 2000000, 100000, 2500000, now() + interval '2 days'),
(8, 1, 'Laptop Dell XPS 13', 'Core i7, RAM 16GB, SSD 512GB', 23000000, 500000, 26000000, now() + interval '5 days'),
(8, 2, 'Túi xách Gucci nữ', 'Chính hãng, da thật 100%', 15000000, 500000, 20000000, now() + interval '4 days'),
(8, 2, 'Đồng hồ Casio nam', 'Dây thép không gỉ, chống nước', 2500000, 100000, 3000000, now() + interval '3 days'),
(8, 3, 'Sách Atomic Habits', 'Thói quen nguyên tử - James Clear', 400000, 50000, 600000, now() + interval '2 days'),
(8, 4, 'Robot hút bụi Xiaomi', 'Bản quốc tế, điều khiển qua app', 4500000, 100000, 5000000, now() + interval '4 days'),
(5, 5, 'Bình gốm cổ', 'Đồ cổ thế kỷ 19, hoa văn rồng phượng', 6000000, 200000, 8000000, now() + interval '5 days'),
(1, 1, 'Máy quay GoPro Hero 11', 'Quay phim 5K, chống nước 10m', 7000000, 200000, 8500000, now() + interval '3 days'),
(1, 4, 'Loa Bluetooth Sony', 'Âm thanh sống động, pin 12h', 2500000, 100000, 3000000, now() + interval '4 days'),
(5, 3, 'Sách Dữ liệu lớn & Trí tuệ nhân tạo', 'Hướng dẫn Python và Machine Learning', 1000000, 50000, 1300000, now() + interval '3 days'),
(5, 2, 'Quần jean Levi’s', 'Chính hãng, phong cách cổ điển', 1200000, 100000, 1500000, now() + interval '2 days'),
(8, 4, 'Máy lạnh LG Inverter 1.5HP', 'Tiết kiệm điện, vận hành êm', 15000000, 500000, 18000000, now() + interval '5 days'),
(8, 4, 'Lò vi sóng Sharp 20L', 'Có chức năng rã đông, hẹn giờ', 2500000, 100000, 3000000, now() + interval '3 days'),
(1, 2, 'Kính mát Rayban', 'Chống tia UV400, gọng kim loại', 3500000, 100000, 4000000, now() + interval '2 days'),
(5, 1, 'Máy tính bảng iPad Pro 12.9', 'Chip M2, 256GB, hỗ trợ bút Pencil', 22000000, 500000, 25000000, now() + interval '4 days'),
(8, 3, 'Giết con chim nhại', 'Tác phẩm kinh điển Mỹ', 800000, 50000, 1000000, now() + interval '2 days');


insert into productimages (product_id, image_url)
select product_id, concat('https://example.com/hinhanh/sanpham_', product_id, '.jpg')
from products;


do $$
declare
    p record;
    b integer;
    base numeric(12,2);
begin
    for p in select product_id, start_price, step_price from products loop
        base := p.start_price;
        for b in 1..5 loop
            insert into bids (product_id, bidder_id, bid_amount, created_at)
            values (
                p.product_id,
                (select user_id from users where role='bidder' order by random() limit 1),
                base + (b * p.step_price),
                now() - (interval '1 hour' * (6 - b))
            );
        end loop;
    end loop;
end $$;

insert into transactions (product_id, buyer_id, seller_id, invoice_url, shipping_address, payment_status)
values
(1, 2, 1, 'https://example.com/invoice/hd_1.pdf', 'Đà Nẵng', 'Đã thanh toán'),
(3, 3, 1, 'https://example.com/invoice/hd_2.pdf', 'TP. Hồ Chí Minh', 'Đang giao hàng'),
(6, 4, 5, 'https://example.com/invoice/hd_3.pdf', 'Huế', 'Đã thanh toán'),
(9, 7, 5, 'https://example.com/invoice/hd_4.pdf', 'TP. Hồ Chí Minh', 'Chờ thanh toán'),
(11, 9, 8, 'https://example.com/invoice/hd_5.pdf', 'Hải Phòng', 'Đã giao thành công'),
(13, 3, 8, 'https://example.com/invoice/hd_6.pdf', 'TP. Hồ Chí Minh', 'Đã thanh toán'),
(16, 4, 5, 'https://example.com/invoice/hd_7.pdf', 'Huế', 'Đang giao hàng'),
(18, 7, 1, 'https://example.com/invoice/hd_8.pdf', 'TP. Hồ Chí Minh', 'Đã giao thành công'),
(20, 6, 5, 'https://example.com/invoice/hd_9.pdf', 'Cần Thơ', 'Chờ thanh toán'),
(23, 2, 1, 'https://example.com/invoice/hd_10.pdf', 'Đà Nẵng', 'Đã thanh toán');

insert into emailnotifications (user_id, subject, message)
values
(2, 'Chúc mừng bạn đã thắng đấu giá!', 'Bạn đã thắng phiên đấu giá sản phẩm "Điện thoại iPhone 14 Pro".'),
(3, 'Sản phẩm bạn theo dõi sắp kết thúc', 'Sản phẩm "Laptop Macbook Air M2" chỉ còn 2 giờ nữa sẽ đóng phiên đấu giá.'),
(4, 'Xác nhận thanh toán', 'Thanh toán cho đơn hàng "Máy xay sinh tố Panasonic" đã được xác nhận.'),
(7, 'Cập nhật trạng thái giao hàng', 'Đơn hàng "Loa Bluetooth Sony" của bạn đang được giao.'),
(9, 'Thông báo giao dịch thành công', 'Đơn hàng "Laptop Dell XPS 13" đã giao thành công. Cảm ơn bạn!'),
(1, 'Báo cáo doanh thu tuần', 'Tuần qua bạn đã bán được 3 sản phẩm, tổng giá trị 65 triệu đồng.'),
(5, 'Cảnh báo tồn kho thấp', 'Một số sản phẩm trong kho sắp hết. Vui lòng kiểm tra để bổ sung.'),
(8, 'Tin nhắn mới từ người mua', 'Người mua Trần Thị B vừa gửi tin nhắn hỏi về "Đồng hồ Casio nam".'),
(6, 'Sản phẩm mới từ người bán yêu thích', 'Người bán Nguyễn Văn A vừa đăng sản phẩm mới: "Kính mát Rayban".'),
(10, 'Báo cáo hệ thống hàng tuần', 'Toàn hệ thống hoạt động ổn định, không phát sinh lỗi nghiêm trọng.');



insert into chatmessages (transaction_id, sender_id, message_text)
values
(1, 2, 'Chào anh, cho em hỏi khi nào hàng được giao ạ?'),
(1, 1, 'Chào bạn, hàng sẽ được giao trong 2 ngày tới nhé.'),
(3, 3, 'Em đã chuyển khoản, anh kiểm tra giúp em nhé.'),
(3, 1, 'Anh nhận được rồi, cảm ơn em!'),
(5, 9, 'Máy hoạt động tốt, cảm ơn shop nhiều!'),
(5, 8, 'Cảm ơn bạn đã mua hàng, hẹn gặp lại!');


insert into systemconfig (key, value)
values
('site_name', 'Đấu Giá Online Việt Nam'),
('currency', 'VND'),
('max_autobid_limit', '100000000'),
('email_sender', 'no-reply@daugia.vn'),
('support_phone', '1900-8888'),
('auction_extend_time', '5 phút'),
('max_product_images', '10'),
('enable_auto_extend', 'true'),
('maintenance_mode', 'false'),
('default_language', 'vi');


create table upgrade_requests (
    request_id serial primary key,
    user_id integer references users(user_id) on delete cascade,
    note text,
    status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
    created_at timestamp default now()
);


insert into upgrade_requests (user_id, note) values
(2, 'Muốn bán sản phẩm điện tử'),
(3, 'Muốn bán đồ thời trang'),
(4, 'Muốn bán sách và đồ sưu tầm'),
(6, 'Muốn bán nông sản từ Cần Thơ'),
(7, 'Muốn bán đồ công nghệ cũ');

insert into SystemConfig (key, value) values
('highLightTime', '300000'),
('relativeTimeDays', '3'),
('extendBoundary', '300000'),
('extendTime', '600000');
