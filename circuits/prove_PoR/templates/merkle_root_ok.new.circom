pragma circom 2.1.6;

template MerkleRootWithTimestamp(n, actualSize) {
    assert(n > 0);
    assert(n & (n - 1) == 0); // n phải là lũy thừa của 2
    assert(actualSize <= n);   // actualSize không được vượt quá n
    assert(actualSize > 0);    // actualSize phải > 0

    signal input data[actualSize][2];  // Chỉ nhận actualSize phần tử thực tế
    signal input timestamp;      
    signal input finalHash;      // public input để verify

    var depth = log_2(n);

    // Tạo mảng data đầy đủ với padding
    signal paddedData[n][2];
    
    // Copy dữ liệu thực tế
    for (var i = 0; i < actualSize; i++) {
        paddedData[i][0] <== data[i][0];
        paddedData[i][1] <== data[i][1];
    }
    
    // Padding với ["0", "0"] cho các vị trí còn lại
    for (var i = actualSize; i < n; i++) {
        paddedData[i][0] <== 0;
        paddedData[i][1] <== 0;
    }

    // Tính leaf = Poseidon([UID, balance])
    signal leaves[n];
    component leafHashers[n];
    for (var i = 0; i < n; i++) {
        leafHashers[i] = Poseidon(2);
        leafHashers[i].inputs[0] <== paddedData[i][0];
        leafHashers[i].inputs[1] <== paddedData[i][1];
        leaves[i] <== leafHashers[i].out;
    }

    // Mảng các tầng của Merkle tree
    signal levels[depth + 1][n];  // levels[0] = leaves, cuối là root

    for (var i = 0; i < n; i++) {
        levels[0][i] <== leaves[i];
    }

    // Hash từng tầng
    component hashers[depth][n/2];
    for (var d = 1; d <= depth; d++) {
        var width = n >> d;
        for (var i = 0; i < width; i++) {
            hashers[d - 1][i] = Poseidon(2);
            hashers[d - 1][i].inputs[0] <== levels[d - 1][2 * i];
            hashers[d - 1][i].inputs[1] <== levels[d - 1][2 * i + 1];
            levels[d][i] <== hashers[d - 1][i].out;
        }
    }

    // Hash root với timestamp
    component finalHasher = Poseidon(2);
    finalHasher.inputs[0] <== levels[depth][0];  // Merkle root
    finalHasher.inputs[1] <== timestamp;
    
    log("Actual size:", actualSize);
    log("Padded size:", n);
    log("Root:", levels[depth][0]);
    log("Final hash:", finalHasher.out);

    // Tạo constraint finalHash input phải bằng với computed hash
    finalHash === finalHasher.out;
}

// Helper functions
function log_2(x) {
    var r = 0;
    while ((1 << r) < x) {
        r++;
    }
    return r;
}