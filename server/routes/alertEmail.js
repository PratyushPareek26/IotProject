const express = require('express');
const nodemailer = require('nodemailer');
const emailTemplate = require('email-templates');
const router = express.Router();

require("dotenv").config();   //shouldn't have had to do that. But wasn't recognizing env vars without this.

const User = require('../models/user.model');

router.post('/', (req, res) => {
	// console.log('req backend ', req.body);
	const {deets, currentpH, currentTDS} = req.body;

	console.log('deets ae', deets);

	let currentLastWorked = '999'
	
	User.find({})
	.then(async (users) => {
			let alertEmail = 'bbb'
			await users.forEach(user => {
				if(user.lastWorked <= currentLastWorked){
					console.log("lw ", user.alertEmail)
					alertEmail = user.alertEmail
					currentLastWorked = user.lastWorked
				}
			})

			await updateLastWorked(alertEmail)
			sendEmail(alertEmail);

			// await console.log(alertEmails)
		})
		.catch(err => console.log('could not get user emails', err));

		const updateLastWorked = (alertEmail) => {
			

				console.log("ae to update", alertEmail)
			User.findOne({alertEmail})
				.then((user) => {
					console.log("user ", user)
					var today = new Date();	
					var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
					var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
					var dateTime = date+' '+time;

					user.lastWorked = dateTime

					user.save()
						.then(()=>{
							res.send({success: true})
						})
				})
				.catch(err =>{
                    console.error('lw update error')
                    res.send({
                        success: false,
                        errors: ['server error']
                    })
                })
		}

		const sendEmail = (alertEmail) => {
			let transporter = nodemailer.createTransport({
				host :'smtp.gmail.com',
				auth:{
				  user: process.env.EMAIL,  
				  pass: process.env.EMAIL_PASS
				}
			})
	
			const email = {
				from: process.env.EMAIL,
				to: alertEmail,
				subject: 'alert for ' + deets.coolerName,
				html: `water of ${deets.coolerName} is unsafe to drink. The ph is currently ${deets.currentpH} and TDS is currently ${deets.currentTDS}. Location is ${deets.location}`
			} 
		
			transporter.sendMail(email, (err, data) => {
				if(err){
					console.log('alert mail error ', err);
					res.send({
						success: false,
						errors: ['server error']
					})
				}
				else{
					console.log('sent alert', data)
					res.send({success: true})
				}
			})
		}

		

	// const email = new emailTemplate({
	// 	transport: transporter,
	// 	send: true,
	// 	preview: false,
	// 	// views: {
	// 	// 	root: '../emailTemplates'
	// 	// }
	// })
	
	// const sendEmails = (alertEmails) => {
	// 	console.log("ae", alertEmails)
	// 	email.send({
	// 		template: 'alert',
	// 		message: {
	// 			from: process.env.EMAIL,
	// 			to: alertEmails
	// 			// to: 'pareekpratyush2626@gmail.com'
	// 		},
	// 		locals: {name: deets.coolerName, currentpH, location: deets.location}
	// 	})
	// 		.then(data => {
	// 			console.log('sent')
	// 			res.send('sent email')
	// 		})
	// 		.catch(err => console.log('error sending ', err))

	// }
})

module.exports = router;