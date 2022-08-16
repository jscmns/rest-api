const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { body } = require("express-validator");
const User = require("../models/user");
const isAuth = require("../middleware/isAuth");

router.put(
	"/signup",
	[
		body("email")
			.isEmail()
			.withMessage("Please enter a valid email.")
			.custom((value, { req }) => {
				return User.findOne({ email: value })
					.then(userDoc => {
						if (userDoc) {
							return Promise.reject("E-mail already exists!");
						}
					})
					.catch(e => {
						console.log(e);
					});
			})
			.normalizeEmail(),
		body("password")
			.trim()
			.isLength({ min: 5 })
			.withMessage("Password must be at least 5 characters long."),
		body("name").trim().not().isEmpty().withMessage("Name is required.")
	],
	authController.signup
);

router.post("/login", authController.login);

router.get("/status", isAuth, authController.getStatus);

router.put(
	"/status",
	isAuth,
	[body("status").trim().not().isEmpty().withMessage("Status is required.")],
	authController.updateStatus
);

module.exports = router;
