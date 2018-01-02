const shortid = require('shortid');
const crypto = require('crypto');
const helpersConfigs = require('../helpers/helpers.json');
const UsersHelper = require('../helpers/users.helper');
const usersHelper = new UsersHelper();
const BillingsHelper = require('../helpers/billings.helper');
const billingsHelper = new BillingsHelper();
const jwt = require('jsonwebtoken');
const Helpers = require('../helpers/helpers');
const htmlToText = require('html-to-text');

class UsersController {
	constructor(){}
	
	listUser(req, res){
		let lang = req.headers['language'] || 'en';
		let languagePath = `../helpers/language/lang_${lang}`;
		let langObj = require(languagePath);
		if(req.headers && parseInt(req.headers.role) === helpersConfigs.SUPER_ADMIN_ROLE){
			usersHelper.findUser({}, {_id: 0, password: 0})
				.then(userInfos=>{
					res.status(200).json({
						success: true,
						data: userInfos,
						message: langObj['User list retrieved successfully.'] || 'User list retrieved successfully.'
					});
				})
				.catch(userInfoErr=>{
					res.status(400).json({
						success: false,
						data: userInfoErr,
						message: langObj['Failed to retrieve user list.'] || 'Failed to retrieve user list.'
					});
				});
		}else{
			res.status(401).json({
				success: false,
				data: {},
				message: langObj['Unauthorized User. Access Denied.'] || 'Unauthorized User. Access Denied.'
			});
		}
	}

	getUser(req, res){
		let lang = req.headers['language'] || 'en';
		let languagePath = `../helpers/language/lang_${lang}`;
		let langObj = require(languagePath);
		if(req.headers && parseInt(req.headers.role) >= helpersConfigs.ADMIN_ROLE){
			usersHelper.findUser(req.query, {_id: 0, password: 0})
				.then(userInfos=>{
					res.status(200).json({
						success: true,
						data: userInfos,
						message: langObj['User information retrieved successfully.'] || 'User information retrieved successfully.'
					});
				})
				.catch(userInfoErr=>{
					res.status(400).json({
						success: false,
						data: userInfoErr,
						message: langObj['Failed to retrieve user information.'] || 'Failed to retrieve user information.'
					});
				});
		}else{
			res.status(401).json({
				success: false,
				data: {},
				message: langObj['Unauthorized User. Access Denied.'] || 'Unauthorized User. Access Denied.'
			});
		}
	}

	createUser(req, res){
		let lang = req.headers['language'] || 'en';
		let languagePath = `../helpers/language/lang_${lang}`;
		let langObj = require(languagePath);

		let saveObj = {
			"short_user_id": shortid.generate(),
			"first_name": req.body.first_name,
			"last_name": req.body.last_name,
			"full_name": `${req.body.first_name} ${req.body.last_name}`,
			"role": helpersConfigs.ADMIN_ROLE,
			"email": req.body.email,
			"company_name": req.body.company_name,
			"business_type": req.body.business_type,
			"country": req.body.country,
			"time_zone": req.body.time_zone,
			"currency": req.body.currency,
			"created_date": new Date(),
			"updated_date": new Date()
		};

		saveObj.password = crypto.createHmac(config.userAuths.algorithm, config.userAuths.secretKey).update(req.body.password).digest('hex');
		
		usersHelper.saveUser(saveObj)
			.then(saveUserResp=>{
				this.createUserFreeBilling(saveUserResp.short_user_id)
					.then(userBilling=>{
						let updateQuery = {
							short_user_id: saveUserResp.short_user_id
						};

						let updateObj = {
							billingType: userBilling.billingType,
							office_hour: helpersConfigs['OFFICE_HOUR'],
							updated_date: new Date()
						};

						usersHelper.updateUser(updateQuery, updateObj)
							.then(updateResp=>{
								this.sendRegisterEmail(req.body.email)
									.then(emailResponse=>{
										res.status(200).json({
											success: true, 
											data: saveUserResp,
											message: langObj['User Created Successfully.'] || 'User Created Successfully.'
										});
									})
									.catch(emailError=>{
										res.status(200).json({
											success: false, 
											data: emailError,
											message: langObj['User Created Successfully. But failed to send registraion success email.'] || 'User Created Successfully. But failed to send registraion success email.'
										});
									});
							})
							.catch(updateErr=>{
								res.status(400).json({
									success: false,
									data: updateErr,
									message: langObj['Failed to update user information.'] || 'Failed to update user information.'
								});
							});
					})
					.catch(userBillingErr=>{
						res.status(400).json({
							success: false,
							data: userBillingErr,
							message: langObj['Failed to create user free billing.'] || 'Failed to create user free billing.'
						});
					});
				
			})
			.catch(saveUserErr=>{
				res.status(400).json({
					success: false,
					data: saveUserErr,
					message: langObj['Failed to create user.'] || 'Failed to create user.'
				});
			});
	}

	createUserFreeBilling(userId){
		return new Promise((resolve, reject)=>{
			let currentDateTime = new Date();
			currentDateTime.setHours(0,0,0,0);
			let activateDate = Math.floor(currentDateTime/1000);
			let expireDate = activateDate+7*24*3600;
			
			let billingObj = {
				userId: userId,
				billingType: helpersConfigs['FREE_BILLING'],
				cost: 0,
				activatedOn: activateDate,
				expiresOn: expireDate,
				paymentMethod: '',
				remainingDays: 7,
				usesDays: 0,
				created_date: new Date(),
				updated_date: new Date()
			};

			billingsHelper.saveBilling(billingObj)
				.then(billingData=>{
					resolve(billingData);
				})
				.catch(billingDataErr=>{
					reject(billingDataErr);
				});
		});
	}

	sendRegisterEmail(sendToEmail){
		return new Promise((resolve, reject)=>{
			let helpers = new Helpers();
			let mailOptions = {
		        from: `"${helpersConfigs['APP_EMAIL_FROM']}"<${config['nodemailerObj']['auth']['user']}>`,
		        to: 'baidar.ujwal@gmail.com',
		        subject: helpersConfigs['USER_REGISTRATION_EMAIL_SUBJECT'],
		        text: 'Hello world?',
		        html: '<b>Hello world?</b>'
		    };
		    // let templateString = fs.readFileSync('server/api/helpers/email-templates/user-registration-complete.ejs', 'utf-8');
			helpers.sendNodeMailer(mailOptions)
				.then(mailInfo=>{
					resolve(mailInfo);
				})
				.catch(mailError=>{
					reject(mailError);
				});
		});
	}

	editUser(req, res){
		let lang = req.headers['language'] || 'en';
		let languagePath = `../helpers/language/lang_${lang}`;
		let langObj = require(languagePath);
		if(req.headers && parseInt(req.headers.role) >= helpersConfigs.ADMIN_ROLE){
			let updateQuery = {short_user_id:req.query.short_user_id};
			let updateObj = {
				"first_name": req.body.first_name,
				"last_name": req.body.last_name,
				"full_name": `${req.body.first_name} ${req.body.last_name}`,
				"company_name": req.body.company_name,
				"business_type": req.body.business_type,
				"country": req.body.country,
				"time_zone": req.body.time_zone,
				"currency": req.body.currency,
				"updated_date": new Date()
			};
			usersHelper.updateUser(updateQuery, updateObj)
				.then(updateResp=>{
					res.status(200).json({
						success: true,
						data: updateObj,
						message: langObj['User information updated successfully.'] || 'User information updated successfully.'
					});
				})
				.catch(updateErr=>{
					res.status(400).json({
						success: false,
						data: updateErr,
						message: langObj['Failed to update user information.'] || 'Failed to update user information.'
					});
				});
		}else{
			res.status(401).json({
				success: false,
				data: {},
				message: langObj['Unauthorized User. Access Denied.'] || 'Unauthorized User. Access Denied.'
			});
		}
	}

	deleteUser(req, res){
		let lang = req.headers['language'] || 'en';
		let languagePath = `../helpers/language/lang_${lang}`;
		let langObj = require(languagePath);
		if(req.headers && parseInt(req.headers.role) >= helpersConfigs.ADMIN_ROLE){
			usersHelper.removeUser({short_user_id: req.query.short_user_id})
				.then(userDelResp=>{
					res.status(200).json({
						success: true,
						data: userDelResp,
						message: langObj['User deleted successfully.'] || 'User deleted successfully.'
					})
				})
				.catch(userDelErr=>{
					res.status(400).json({
						success: false,
						data: userDelErr,
						message: langObj['Failed to delete user.'] || 'Failed to delete user.'
					})
				});
		}else{
			res.status(401).json({
				success: false,
				data: {},
				message: langObj['Unauthorized User. Access Denied.'] || 'Unauthorized User. Access Denied.'
			});
		}
	}

	loginUser(req, res){
		let lang = req.headers['language'] || 'en';
		let languagePath = `../helpers/language/lang_${lang}`;
		let langObj = require(languagePath);
		usersHelper.findUser({email: req.body.email})
			.then(userInfos=>{
				if(userInfos.length>0){
					let userPassword = crypto.createHmac(config.userAuths.algorithm, config.userAuths.secretKey).update(req.body.password).digest('hex');
					if(userInfos[0]['password'] === userPassword){
						let userInfo = userInfos[0];
						let jwtSignData = {
							userId: userInfo._id,
							email: userInfo.email,
							role: userInfo.role,
							billingType: userInfo.billingType
						};

						let jwtSignOptions = {
							expiresIn: config.jwt.expireTime, 
							algorithm: config.jwt.algorithm 
						};

						let authToken = jwt.sign(jwtSignData, config.jwt.secretKey, jwtSignOptions);
						res.status(200).json({
							success: true,
							data: {
								first_name: userInfo.first_name,
								full_name: userInfo.full_name,
								role: userInfo.role,
								email: userInfo.email,
								billingType: userInfo.billingType,
								initial_setup: userInfo.initial_setup,
								authToken: authToken
							},
							message: langObj['User logged in successfully.'] || 'User logged in successfully.'
						});
					}else{
						res.status(204).json({
							success: false,
							data: {},
							message: langObj['Password does not match.'] || 'Password does not match.'
						});
					}
				}else{
					res.status(204).json({
						success: false,
						data: {},
						message: langObj['Email does not exist.'] || 'Email does not exist.'
					});
				}
			})
			.catch(userInfoErr=>{
				res.status(400).json({
					success: false,
					data: userInfoErr,
					message: langObj['Failed to retrieve user information.'] || 'Failed to retrieve user information.'
				});
			});
	}
}

module.exports = UsersController;