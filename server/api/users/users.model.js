const mongoose = require('mongoose');
let UsersSchema = new mongoose.Schema({
	short_user_id: {type: String, unique: true, required: true},
	first_name: String,
	last_name: String,
	full_name: String,
	role: Number,
	email: {type: String, unique: true, required: true},
	password: String,
	company_name: String,
	business_type: String,
	country: String,
	time_zone: String,
	currency: String,
	billingType: Number,
	initial_setup: {type: Boolean, default: false},
	office_hour: Object,
	status: {type: Boolean, default: true},
	created_date: Date,
	updated_date: Date
});
mongoose.model('Users', UsersSchema);