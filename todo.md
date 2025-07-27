*Quan trọng*: Cần setup môi trường theo link này trước: https://docs.google.com/document/d/1e6rXiNfLfY0tyGLNRCeN4jCv5qX2kDYzorYolOLc7ZY/edit?tab=t.m53yszyif1vt#heading=h.d97jf1b071bh

*Quan trọng 2*: Cần có mạng để chạy, vì phase trusted setup nó cần tạo ra powers_of_tau đủ chịu được ràng buộc
    mà máy thường chạy thì có khi không nổi nên nó sẽ tải file sẵn có trên github về tự động, nên nếu offline sẽ bị lỏ
    những file tải thêm mở thư mục ./compiler/powers_of_tau/ để xem
    con số sau cùng của tên file (tạm gọi là k) sẽ đại diện cho nó hỗ trợ cho mạch có tối đa 2^k constraints

Nếu cần test 1 mạch nào đó:
    - Trong thư mục `./circuits/` tạo 1 folder tên gì thì tùy (T có làm ví dụ với folder `all_non_negative`)
    - Trong folder vừa tạo chứa: 
        - 1 file `gì đó`.circom (Mạch cần test) (Trong ví dụ t đặt tên file cùng tên folder luôn)
        - 1 file `input.json` chứa input cần truyền vào (khác với trên web là comment)

Chạy lệnh: `node .\complier\ <đường dẫn đến thư mục chứa mạch>`
    Ví dụ: `node .\complier\ .\circuits\all_non_negative\`

Chạy xong thì trong thư mục chứa mạch sinh ra 1 thư mục output, xem output/public input trong file public.json trong thư mục đó