*Quan trọng 1*: Cần setup môi trường theo link này trước: https://docs.google.com/document/d/1e6rXiNfLfY0tyGLNRCeN4jCv5qX2kDYzorYolOLc7ZY/edit?tab=t.m53yszyif1vt#heading=h.d97jf1b071bh và clone circomlib vào thư mục gốc của dự án: `git clone https://github.com/iden3/circomlib.git` cuối cùng, chạy `npm i` để cài đặt toàn bộ package cần thiết.

*Quan trọng 2*:
- Rất nên có mạng để chạy, vì phase trusted setup cần tạo ra powers_of_tau đủ cho số ràng buộc của mạch.
- Máy thường chạy thì có khi không nổi với mạch lớn nên script sẽ tải file sẵn có trên storage người ta đã làm sẵn về tự động
- Nếu máy offline script sẽ buộc phải tự sinh powers_of_tau, đây là tác vụ có thể từ nhẹ đến không chạy nổi tùy vào số lượng constraints của mạch
- Những file tải thêm mở thư mục `compiler/powers_of_tau/` để xem. Con số sau cùng của tên file (tạm gọi là k) sẽ đại diện cho nó hỗ trợ cho mạch có tối đa 2^k constraints
- *Những file powers_of_tau cho mạch cực lớn có thể nặng đến 9GB (với k = 32 thì phải), nhưng hiện tại các mạch đã demo chỉ mới cần - khoảng k = 15 nên download khá nhanh, cần lưu ý phần này.
- Nếu muốn tải powers_of_tau trước mà không để script tự tải thì vào link: https://github.com/iden3/snarkjs#7-prepare-phase-2 tải về và cho vào thư mục `compiler/powers_of_tau/`.

*Quan trọng 3*: Các lệnh chạy dưới đây đều cần chạy ở thư mục gốc dự án, nếu cd lung tung, chạy sẽ bị lỗi.

Nếu cần test 1 mạch Circom nào đó:
- Trong thư mục `circuits/` tạo 1 folder tên gì thì tùy (T có làm ví dụ với folder `all_non_negative`)
- Trong folder vừa tạo chứa: 
    - 1 file `gì đó`.circom (Mạch cần test) (Trong ví dụ t đặt tên file cùng tên folder luôn)
    - 1 file `input.json` chứa input cần truyền vào (khác với trên web là comment)
-   Chạy lệnh: `node .\complier\ <đường dẫn đến thư mục chứa mạch>`
        Ví dụ: `node .\complier\ .\circuits\all_non_negative\`
- *Mạch circom chính nằm trong thư mục `circuits/prove_PoR/`*. Thư mục `circuits/prove_PoR/templates` chứa các mạch khác đã bỏ hàm main và include để cho mạch chính include.

Chạy xong thì trong thư mục chứa mạch sinh ra 1 thư mục `output`, chứa các file kết quả compile,... nhưng quan trọng gồm:
- `proof.json`
- `public.json`
- `verification_key.json`
- 3 file trên sẽ cung cấp cho verifier đi verify (public ra) hay có thể gọi chúng là bằng chứng.

Các demo gọi zk-SNARK flow từ chương trình thay vì dùng CLI chạy lệnh node như trên:
- File `test_zk-snark_flow/success-but-blocking.test.js` là file thử nghiệm import hàm sinh bằng chứng và chạy, cũng là demo cách sinh bằng chứng từ circuit gọi từ chương trình nhưng việc sinh bằng chứng là tác vụ nặng. Nó sẽ gây chặn luồng chính -> Chạy `node .\test_zk-snark_flow\success-but-blocking.test.js` để thử nghiệm.
- File `test_zk-snark_flow/success-non-blocking.test.js` cải tiến, sử dụng worker thread để chạy song song tiến trình sinh bằng chứng mà không chặn luồng chính -> Chạy `node .\test_zk-snark_flow\success-non-blocking.test.js` để thử nghiệm.

*Thư mục `verifier/` có thể tách riêng hoàn toàn khỏi dự án, xem như dùng công cụ bên thứ 3 để verify bằng chứng ZKP download từ server.
Bằng chứng được tạo sử dụng Groth16...