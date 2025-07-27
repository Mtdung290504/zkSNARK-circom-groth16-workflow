pragma circom 2.1.6;

// Include cac circuits con
include "./templates/all_non_negative.circom";
include "./templates/merkle_root_ok.circom";
include "./templates/sum_ok.circom";

// Main circuit tong hop kiem tra
template ProvePoR(n) {
    signal input users[n][2];
    signal input expectedSum;
    signal input timestamp;
    signal input finalHash;

    signal allChecksPass;
    signal nonNegativeCheck;
    signal sumCheck;
    signal merkleCheck;
    
    // Circuit 1: Kiem tra tat ca balance >= 0
    component allNonNeg = AllNonNegative(n);
    for (var i = 0; i < n; i++) {
        allNonNeg.users[i][0] <== users[i][0];
        allNonNeg.users[i][1] <== users[i][1];
    }
    nonNegativeCheck <== allNonNeg.allNonNegative;
    
    // Circuit 2: Kiem tra tong balance
    component sumBalances = SumBalances(n);
    for (var i = 0; i < n; i++) {
        sumBalances.balances[i] <== users[i][1];
    }
    sumBalances.expectedSum <== expectedSum;
    sumCheck <== sumBalances.isCorrect;
    
    // Circuit 3: Kiem tra Merkle Root
    component merkleRoot = MerkleRootWithTimestamp(n);
    for (var i = 0; i < n; i++) {
        merkleRoot.data[i][0] <== users[i][0];
        merkleRoot.data[i][1] <== users[i][1];
    }
    merkleRoot.timestamp <== timestamp;
    merkleRoot.finalHash <== finalHash;
    merkleCheck <== 1; // Neu khong assert fail thi merkle check = 1
    
    // Tong hop ket qua - tat ca phai pass
    signal temp1;
    temp1 <== nonNegativeCheck * sumCheck;
    allChecksPass <== temp1 * merkleCheck;
    
    log("=== MAIN CIRCUIT RESULTS ===");
    log("Non-negative check:", nonNegativeCheck);
    log("Sum check:", sumCheck);
    log("Merkle check:", merkleCheck);
    log("All checks pass:", allChecksPass);
}

component main { public [ expectedSum, timestamp, finalHash ] } = ProvePoR(4);