const circomlibjs = require('circomlibjs');
const fs = require('fs');

class ProductionMerkleTree {
	constructor() {
		this.tree = null;
		this.hashFunction = null;
	}

	async initialize() {
		const poseidon = await circomlibjs.buildPoseidon();
		this.hashFunction = (a, b) => poseidon.F.toString(poseidon([BigInt(a), BigInt(b)]));
	}

	// Phase 1: Build tree từ snapshot và lưu vào storage
	async buildTreeFromSnapshot(input, outputPath = './merkle_snapshot.json') {
		console.log('Building Merkle Tree from snapshot...');

		// Hash từng leaf
		let leaves = input.map(([uid, balance]) => this.hashFunction(uid, balance));
		let tree = [leaves.slice()];

		// Build tree từ bottom-up
		while (leaves.length > 1) {
			let nextLevel = [];
			for (let i = 0; i < leaves.length; i += 2) {
				if (i + 1 < leaves.length) {
					nextLevel.push(this.hashFunction(leaves[i], leaves[i + 1]));
				} else {
					// Duplication approach
					nextLevel.push(this.hashFunction(leaves[i], leaves[i]));
				}
			}
			tree.push(nextLevel);
			leaves = nextLevel;
		}

		// Tạo metadata để optimize proof generation
		const metadata = {
			totalLeaves: input.length,
			treeDepth: tree.length - 1,
			merkleRoot: tree[tree.length - 1][0],
			leafMapping: {}, // Map từ user ID sang leaf index
		};

		// Tạo mapping cho nhanh
		input.forEach(([uid, balance], index) => {
			metadata.leafMapping[uid] = {
				index,
				leaf: tree[0][index],
				balance,
			};
		});

		// Lưu vào file/database
		const treeData = {
			tree,
			metadata,
			timestamp: Date.now(),
		};

		fs.writeFileSync(outputPath, JSON.stringify(treeData, null, 2));
		console.log(`Tree saved to ${outputPath}`);
		console.log(`Tree depth: ${metadata.treeDepth}, Root: ${metadata.merkleRoot}`);

		this.tree = treeData;
		return treeData;
	}

	// Phase 2: Load tree từ storage
	loadTreeFromStorage(filePath = './merkle_snapshot.json') {
		console.log('Loading tree from storage...');
		const treeData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
		this.tree = treeData;
		return treeData;
	}

	// Phase 3: Generate proof nhanh từ precomputed tree
	getProofForUser(userId) {
		if (!this.tree) {
			throw new Error('Tree not loaded. Call loadTreeFromStorage() first.');
		}

		const { tree, metadata } = this.tree;
		const userInfo = metadata.leafMapping[userId];

		if (!userInfo) {
			throw new Error(`User ${userId} not found in snapshot`);
		}

		const leafIndex = userInfo.index;
		const proof = [];
		let idx = leafIndex;

		// Traverse from leaf to root, collect siblings
		for (let level = 0; level < tree.length - 1; level++) {
			const levelNodes = tree[level];
			let siblingIdx = idx ^ 1; // XOR to get sibling

			if (siblingIdx < levelNodes.length) {
				proof.push(levelNodes[siblingIdx]);
			} else {
				// Duplication case
				proof.push(levelNodes[idx]);
			}

			idx = Math.floor(idx / 2);
		}

		return {
			leaf: userInfo.leaf,
			proof,
			leafIndex,
			merkleRoot: metadata.merkleRoot,
			balance: userInfo.balance,
		};
	}

	// Verify proof (client-side hoặc smart contract)
	verifyProof(leaf, proof, merkleRoot, leafIndex) {
		let currentHash = leaf;
		let currentIndex = leafIndex;

		for (let i = 0; i < proof.length; i++) {
			const sibling = proof[i];

			if (currentIndex % 2 === 0) {
				currentHash = this.hashFunction(currentHash, sibling);
			} else {
				currentHash = this.hashFunction(sibling, currentHash);
			}

			currentIndex = Math.floor(currentIndex / 2);
		}

		return currentHash === merkleRoot;
	}

	// Utility: Get tree stats
	getTreeStats() {
		if (!this.tree) return null;

		const { metadata, tree } = this.tree;
		return {
			totalUsers: metadata.totalLeaves,
			treeDepth: metadata.treeDepth,
			merkleRoot: metadata.merkleRoot,
			storageSize: JSON.stringify(tree).length,
			averageProofSize: metadata.treeDepth,
		};
	}
}

// Demo usage như trong production
async function productionDemo() {
	const merkleTree = new ProductionMerkleTree();
	await merkleTree.initialize();

	// Simulate large snapshot data
	const snapshotData = [];
	for (let i = 1; i <= 10000; i++) {
		snapshotData.push([i, Math.floor(Math.random() * 1000) + 100]);
	}

	console.log('=== PRODUCTION MERKLE TREE DEMO ===\n');

	// Phase 1: Admin builds tree từ snapshot (chỉ làm 1 lần)
	console.time('Build Tree');
	await merkleTree.buildTreeFromSnapshot(snapshotData.slice(0, 8)); // Test với 8 users
	console.timeEnd('Build Tree');

	console.log('\nTree Stats:', merkleTree.getTreeStats());

	// Phase 2: Server loads tree (khi khởi động)
	merkleTree.loadTreeFromStorage();
	console.log('\nTree loaded from storage');

	// Phase 3: Users request proofs (nhiều lần, nhanh)
	console.log('\n=== USER PROOF REQUESTS ===');

	console.time('Generate Proof');
	const userProof = merkleTree.getProofForUser(3);
	console.timeEnd('Generate Proof');

	console.log(`User 3 proof:`, {
		leaf: userProof.leaf,
		proofLength: userProof.proof.length,
		balance: userProof.balance,
	});

	// Verify proof
	const isValid = merkleTree.verifyProof(userProof.leaf, userProof.proof, userProof.merkleRoot, userProof.leafIndex);
	console.log('Proof valid:', isValid);

	// Benchmark multiple proof generations
	console.log('\nPerformance test:');
	console.time('100 Proof Generations');
	for (let i = 1; i <= 100; i++) {
		merkleTree.getProofForUser((i % 8) + 1);
	}
	console.timeEnd('100 Proof Generations');
}

productionDemo();
