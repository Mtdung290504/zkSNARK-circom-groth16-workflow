const fs = require('fs');
const path = require('path');

/**
 * Renders the ProvePoR circuit with a dynamic count parameter
 * @param {number} count - The number of users/entries for the circuit
 */
function renderPoRcircuitCount(count) {
	try {
		// Tìm đường dẫn tuyệt đối đến file circom
		const circuitPath = path.resolve(__dirname, '../circuits/prove_PoR/prove_PoR.circom');

		// Đọc nội dung file
		const content = fs.readFileSync(circuitPath, 'utf8');

		// Thay thế parameter bằng regex
		const updatedContent = content.replace(/ProvePoR\(\d+\)/g, `ProvePoR(${count})`);

		// Ghi lại file
		fs.writeFileSync(circuitPath, updatedContent);

		console.log(`Updated ProvePoR parameter to ${count}`);
	} catch (error) {
		console.error('Error updating circuit:', error.message);
	}
}

module.exports = { renderPoRcircuitCount };