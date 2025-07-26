*Quan trọng*: Cần setup môi trường theo link này trước: https://docs.google.com/document/d/1e6rXiNfLfY0tyGLNRCeN4jCv5qX2kDYzorYolOLc7ZY/edit?tab=t.m53yszyif1vt#heading=h.d97jf1b071bh

Nếu cần test 1 mạch nào đó:
    - Trong thư mục `./circuits/` tạo 1 folder tên gì thì tùy (T có làm ví dụ với folder `all_non_negative`)
    - Trong folder vừa tạo chứa: 
        - 1 file `gì đó`.circom (Mạch cần test) (Trong ví dụ t đặt tên file cùng tên folder luôn)
        - 1 file `input.json` chứa input cần truyền vào (khác với trên web là comment)

Chạy lệnh: `node .\complier\ <đường dẫn đến thư mục chứa mạch>`
    Ví dụ: `node .\complier\ .\circuits\all_non_negative\`