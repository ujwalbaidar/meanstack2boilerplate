const path = require('path');
const jwt = require('jsonwebtoken');

module.exports = function(app){
	app.use('/api/users', require('../api/users'));
	app.route('*')
		.get((req, res) => {
			res.render('index');
		});

	function adminAuth(req, res, next){
		let headerToken = req.headers.token;
		let jwtSecretKey = config.jwt.secretKey;
		let jwtAlgorithm = { algorithms: config.jwt.algorithm };
		jwt.verify(headerToken, jwtSecretKey, jwtAlgorithm, (err, decoded) => {
			if(err){
				res.status(401).send({success:false, message: 'Login is Required!'});
			}else{
				req.headers.userId = decoded.userId;
				req.headers.email = decoded.email;
				req.headers.role = decoded.role;
				req.headers.billingType = decoded.billingType;
				next();
			}
		});
	}
}