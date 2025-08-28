
/**
 * Tool xác minh verification_key.json có đúng với circuit.circom không
 *
 * Yêu cầu:
 *   - Node.js 18+
 *   - snarkjs CLI cài toàn cục: npm i -g snarkjs
 *   - circom CLI trong PATH
 *
 * Cách chạy:
 *   node index.js ./circuit.circom ./circuit_final.zkey ./verification_key.json
 */

const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');
const path = require('path');

function sha256Json(obj) {
	return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

function main() {
	const [, , circuitPath, zkeyPath, vkPath] = process.argv;

	if (!circuitPath || !zkeyPath || !vkPath) {
		console.error('Usage: node index.js <circuit.circom> <circuit_final.zkey> <verification_key.json>');
		process.exit(1);
	}

	// tạo output folder tuyệt đối trong cùng thư mục script
	const outDir = path.resolve(__dirname, 'tmp');
	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir, { recursive: true });
	}

	// Bước 1: compile circuit ra .r1cs
	console.log('Compiling circuit...');
	execSync(`circom ${circuitPath} --r1cs --wasm --sym -o ${outDir}`, { stdio: 'inherit' });

	// Bước 2: export verification key từ zkey bằng snarkjs CLI
	console.log('Exporting verification key from zkey...');
	const vkGenPath = path.join(outDir, 'vk_generated.json');
	execSync(`snarkjs zkey export verificationkey ${zkeyPath} ${vkGenPath}`, { stdio: 'inherit' });

	// Bước 3: đọc cả 2 file vk
	const vkGenerated = JSON.parse(fs.readFileSync(vkGenPath, 'utf8'));
	const vkPublished = JSON.parse(fs.readFileSync(vkPath, 'utf8'));

	// Bước 4: so sánh hash
	const genHash = sha256Json(vkGenerated);
	const pubHash = sha256Json(vkPublished);

	if (genHash === pubHash) {
		console.log('verification_key.json KHỚP với circuit + zkey');
	} else {
		console.error('verification_key.json KHÔNG khớp');
		console.log('Generated vk hash:', genHash);
		console.log('Published vk hash:', pubHash);
	}
}

main();
