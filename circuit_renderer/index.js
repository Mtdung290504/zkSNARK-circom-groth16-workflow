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

/**
 * Renders input data to input.json file
 * @param {Array<Array<number>>} users - Array of [userId, balance] pairs
 * @param {string} expectedSum - Expected total sum as string
 * @param {string} timestamp - Timestamp as string
 * @param {string} finalHash - Final hash as string
 */
function renderPoRinput(users, expectedSum, timestamp, finalHash) {
	try {
		const inputPath = path.resolve(__dirname, '../circuits/prove_PoR/input.json');

		const inputData = {
			users: users.map((user) => [user[0].toString(), user[1].toString()]),
			expectedSum: expectedSum,
			timestamp: timestamp,
			finalHash: finalHash,
		};

		fs.writeFileSync(inputPath, JSON.stringify(inputData, null, '\t'));

		console.log('Rendered input.json successfully');
	} catch (error) {
		console.error('Error rendering input:', error.message);
	}
}

module.exports = { renderPoRcircuitCount, renderPoRinput };

/*
Usages:
renderPoRcircuitCount(8);
renderPoRinput(
	[
		[101, -1000],
		[102, 2500],
		[103, 1500],
		[104, 3000],
	],
	'8000',
	'1642617600',
	'7097152414710168883415274100263212946627332538891172344161856331893430616371'
);
*/
