const fs = require("fs");
const path = require("path");

exports.defaultErrorHandling = (e, next) => {
	if (!e.statusCode) {
		e.statusCode === 500;
	}
	next(e);
};

exports.validationFailure = () => {
	const error = new Error("Validation failed, entered data is incorrect.");
	error.statusCode = 422;
	throw error;
};

exports.notFound = () => {
	const error = new Error("Could not find post.");
	error.statusCode = 404;
	throw error;
};

exports.unauthorized = () => {
	const error = new Error("Not authorized!");
	error.statusCode = 403;
	throw error;
};

exports.clearImage = filePath => {
	filePath = path.join(__dirname, "..", filePath);
	fs.unlink(filePath, err => console.log(err));
};
