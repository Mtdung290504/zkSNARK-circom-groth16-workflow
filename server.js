const express = require('express');
const app = express();
const routes = require('./BE/routes/index');
const cors = require('cors');
const session = require('express-session');
const DepositProcessor = require('./BE/services/depositProcessor');
const { getAllUsersForProof, genProof } = require('./gen_proof');
const { buildMerkleTree } = require('./merkle_tree');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
	cors({
		origin: '*',
		credentials: true,
	})
);

app.use(
	session({
		secret: 'zkp-secret',
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
			maxAge: 1000 * 60 * 60,
		},
	})
);

app.get('/', (req, res) => {
	res.send('Welcome to the API!');
});

// Routes
app.use('/', routes);

// Error handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);

	// Start deposit processor
	const depositProcessor = new DepositProcessor();
	depositProcessor.start();

	// Interval sinh bằng chứng, trong ngữ cảnh demo, chỉ dùng setTimeout
	// Trong thực tế triển khai thì có thể quy định thêm ngưỡng giao dịch để cập nhật (Cứ mỗi 100 giao dịch thì cập nhật)
	// Tối ưu interval, nếu check trong khoảng vừa rồi không có giao dịch thì không sinh bằng chứng
	setTimeout(async () => {
		getAllUsersForProof()
			.then((users) => {
				buildMerkleTree(users).then((result) => {
					console.log('Build merkle tree result', result);
					genProof(users, result.finalHash, result.timestamp, './circuits/prove_PoR');
				});
			})
			.catch((e) => console.log(e));
	}, 2000);
});
