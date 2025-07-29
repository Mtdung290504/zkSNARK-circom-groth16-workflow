const { buildPoseidon } = require('circomlibjs');
const fs = require('fs');
const path = require('path');

class PoseidonMerkleTree {
	constructor(leaves) {
		this.leaves = leaves;
		this.layers = [];
		this.poseidon = null;
		this.F = null;
		this.timestamp = null;
		this.finalRoot = null;
	}

	// Initialize Poseidon
	async init() {
		this.poseidon = await buildPoseidon();
		this.F = this.poseidon.F;
		this.timestamp = Date.now();
		await this.buildTree();
		await this.computeFinalRoot();
	}

	async initFromJSON(jsonData) {
		this.poseidon = await buildPoseidon();
		this.F = this.poseidon.F;
		this.leaves = jsonData.leaves;
		this.layers = jsonData.layers;
		this.timestamp = jsonData.timestamp;
		this.finalRoot = jsonData.finalRoot;
	}

	// Hash function sử dụng Poseidon - compatible với circom
	hash(inputs) {
		// Convert inputs to field elements
		const fieldInputs = inputs.map((input) => {
			if (typeof input === 'string') {
				// Convert string to BigInt
				const bytes = Buffer.from(input, 'utf8');
				let num = BigInt(0);
				for (let i = 0; i < bytes.length; i++) {
					num = (num << BigInt(8)) + BigInt(bytes[i]);
				}
				return this.F.e(num);
			}
			return this.F.e(BigInt(input));
		});

		const result = this.poseidon(fieldInputs);
		return this.F.toString(result);
	}

	// Tính final root = hash(merkleRoot + timestamp)
	async computeFinalRoot() {
		const merkleRoot = this.getRoot();
		if (!merkleRoot || !this.timestamp) return null;

		// Hash(merkleRoot + timestamp) - compatible với circom
		this.finalRoot = this.hash([BigInt(merkleRoot), BigInt(this.timestamp)]);

		return this.finalRoot;
	}

	// Hash một leaf node từ [UID, balance]
	hashLeaf(uid, balance) {
		// Handle both string and number UIDs
		let uidForHash;
		if (typeof uid === 'string') {
			// Convert string UID to number representation
			const uidBytes = Buffer.from(uid, 'utf8');
			let uidNum = BigInt(0);
			for (let i = 0; i < uidBytes.length; i++) {
				uidNum = (uidNum << BigInt(8)) + BigInt(uidBytes[i]);
			}
			uidForHash = uidNum;
		} else {
			// UID is already a number, convert to BigInt
			uidForHash = BigInt(uid);
		}

		return this.hash([uidForHash, BigInt(balance)]);
	}

	// Build Merkle Tree với padding bằng ["0", "0"]
	async buildTree() {
		// Tạo layer đầu tiên từ leaves
		let currentLayer = this.leaves.map(([uid, balance]) => ({
			hash: this.hashLeaf(uid, balance),
			uid: uid,
			balance: balance,
		}));

		this.layers.push(currentLayer);

		// Build các layer tiếp theo
		while (currentLayer.length > 1) {
			const newLayer = [];

			for (let i = 0; i < currentLayer.length; i += 2) {
				const left = currentLayer[i];
				let right = currentLayer[i + 1];

				// Pad bằng [0, 0] thay vì duplicate
				if (!right) {
					right = {
						hash: this.hashLeaf(0, 0),
						uid: 0,
						balance: 0,
					};
				}

				const combinedHash = this.hash([BigInt(left.hash), BigInt(right.hash)]);

				newLayer.push({
					hash: combinedHash,
					left: left,
					right: right,
				});
			}

			this.layers.push(newLayer);
			currentLayer = newLayer;
		}
	}

	// Get Merkle root
	getRoot() {
		if (this.layers.length === 0) return null;
		return this.layers[this.layers.length - 1][0].hash;
	}

	// Get proof cho một UID từ stored data (optimized)
	getProofFromStoredData(uid) {
		// Tìm leaf node
		const leafLayer = this.layers[0];
		let nodeIndex = leafLayer.findIndex((node) => node.uid === uid);

		if (nodeIndex === -1) {
			return null; // UID không tồn tại
		}

		const proof = [];
		const currentNode = leafLayer[nodeIndex];

		// Duyệt từ leaf lên root
		for (let layerIndex = 0; layerIndex < this.layers.length - 1; layerIndex++) {
			const currentLayer = this.layers[layerIndex];
			const isLeftNode = nodeIndex % 2 === 0;
			const siblingIndex = isLeftNode ? nodeIndex + 1 : nodeIndex - 1;

			if (siblingIndex < currentLayer.length) {
				proof.push({
					hash: currentLayer[siblingIndex].hash,
					position: isLeftNode ? 'right' : 'left',
				});
			}

			nodeIndex = Math.floor(nodeIndex / 2);
		}

		return {
			uid: uid,
			balance: currentNode.balance,
			leafHash: currentNode.hash,
			proof: proof,
			merkleRoot: this.getRoot(),
			timestamp: this.timestamp,
			finalRoot: this.finalRoot,
		};
	}

	// Export tree data to JSON
	exportToJSON() {
		return {
			merkleRoot: this.getRoot(),
			timestamp: this.timestamp.toString(),
			finalRoot: this.finalRoot,
			leaves: this.leaves,
			layers: this.layers.map((layer) =>
				layer.map((node) => ({
					hash: node.hash,
					uid: node.uid,
					balance: node.balance,
				}))
			),
			hashFunction: 'poseidon',
		};
	}
}

// Hàm build tree từ input data - FIXED: return đúng format
async function buildMerkleTree(input) {
	const tree = new PoseidonMerkleTree(input);
	await tree.init();

	// Lưu tree data vào file JSON
	const treeData = tree.exportToJSON();
	const filePath = path.join(__dirname, 'poseidon-merkle-tree-data.json');

	fs.writeFileSync(filePath, JSON.stringify(treeData, null, 2));
	console.log(`Poseidon Merkle tree data saved to: ${filePath}`);

	// FIXED: Return đúng format như yêu cầu
	return {
		finalHash: tree.finalRoot,
		timestamp: tree.timestamp,
	};
}

// Hàm get proof từ UID - OPTIMIZED VERSION (không rebuild tree)
async function getMerkleProof(uid, treeDataPath = null) {
	let treeData;

	if (treeDataPath) {
		// Load tree từ file JSON
		treeData = JSON.parse(fs.readFileSync(treeDataPath, 'utf8'));
	} else {
		// Load từ file mặc định
		const defaultPath = path.join(__dirname, 'poseidon-merkle-tree-data.json');
		treeData = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
	}

	// OPTIMIZED: Không rebuild tree, chỉ init từ JSON
	const tree = new PoseidonMerkleTree([]);
	await tree.initFromJSON(treeData);

	// Get proof từ stored data (không cần rebuild)
	const proof = tree.getProofFromStoredData(uid);
	console.log(`Merkle proof created for user::${uid}:`, proof);

	return proof;
}

// Helper function để convert UID to field element (hỗ trợ cả string và number)
function uidToFieldElement(uid) {
	if (typeof uid === 'string') {
		const bytes = Buffer.from(uid, 'utf8');
		let num = BigInt(0);
		for (let i = 0; i < bytes.length; i++) {
			num = (num << BigInt(8)) + BigInt(bytes[i]);
		}
		return num;
	} else {
		// UID is already a number, convert to BigInt
		return BigInt(uid);
	}
}

// Export các hàm
module.exports = {
	buildMerkleTree,
	getMerkleProof,
	PoseidonMerkleTree,
	uidToFieldElement,
};

// Ví dụ sử dụng
if (require.main === module) {
	(async () => {
		// Test data với number UIDs
		const input = [
			[101, 1000],
			[102, 2500],
			[103, 1500],
			[104, 3000]
		];

		// Build tree
		console.log('Building Poseidon Merkle Tree...');
		const result = await buildMerkleTree(input);
		console.log('Build result:', result);
		console.log('Final hash:', result.finalHash);
		console.log('Timestamp:', result.timestamp);

		// Get proof cho UID 103
		console.log('\nGetting proof for UID 103...');
		const proof = await getMerkleProof(103);
	})();
}
