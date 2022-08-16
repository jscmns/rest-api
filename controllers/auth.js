const User = require("../models/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { defaultErrorHandling, notFound } = require("../utils/utils");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error("Validation failed, entered data is incorrect.");
		error.statusCode = 422;
		error.data = errors.array();
		throw error;
	}

	const { email, name, password } = req.body;
	try {
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = new User({
			email,
			name,
			password: hashedPassword
		});
		const result = await user.save();
		res.status(201).json({ message: "User created!", userId: result._id });
	} catch (e) {
		return defaultErrorHandling(e, next);
	}
};

exports.login = async (req, res, next) => {
	const { email, password } = req.body;

	try {
		const user = await User.findOne({ email });
		if (!user) {
			const error = new Error("A user with this email could not be found.");
			error.statusCode = 401;
			throw error;
		}

		const isEqual = await bcrypt.compare(password, user.password);
		if (!isEqual) {
			const error = new Error("Wrong password!");
			error.statusCode = 401;
			throw error;
		}

		const token = jwt.sign(
			{ email: user.email, userId: user._id.toString() },
			process.env.SECRET,
			{ expiresIn: "1h" }
		);
		res.status(200).json({ token, userId: user._id.toString() });
	} catch (e) {
		return defaultErrorHandling(e, next);
	}
};

exports.getStatus = (req, res, next) => {
	User.findById(req.userId)
		.then(user => {
			if (!user) return notFound();
			res.status(200).json({ status: user.status });
		})
		.catch(err => defaultErrorHandling(err, next));
};

exports.updateStatus = (req, res, next) => {
	const { status } = req.body;
	User.findByIdAndUpdate(req.userId, { status }, { new: true })
		.then(user => {
			if (!user) return notFound();
			user.status = status;
			return user.save();
		})
		.catch(err => defaultErrorHandling(err, next));
};
