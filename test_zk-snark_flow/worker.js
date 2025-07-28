const { parentPort, workerData } = require('worker_threads');
const { runZKSNARKWorkflow } = require('../complier');

(async () => {
	const result = await runZKSNARKWorkflow(workerData.circuitPath);
	parentPort.postMessage(result);
})();
