const nodemailer = require('nodemailer');

class Helpers {
	constructor(){}
	
	sendNodeMailer(mailOptions){
		return new Promise((resolve, reject)=>{
			let transporter = nodemailer.createTransport(config.nodemailerObj);
			transporter.sendMail(mailOptions, (error, info) => {
		        if (error) {
		            reject(error);
		        }else{
		        	resolve(info);
		        }
		    });
		});
	}

}

module.exports = Helpers;