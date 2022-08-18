const dotenv = require("dotenv").config();
const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const password = encodeURIComponent("iP32Le26WjaQe7rw");
const uri = `mongodb+srv://admin:${password}@cluster0.fnumx.mongodb.net/messages?retryWrites=true&w=majority`;
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const { clearImage } = require("./utils/utils");

const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const isAuth = require("./middleware/isAuth");

const fileStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "images");
	},
	filename: function (req, file, cb) {
		cb(null, uuidv4());
	}
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === "image/png" ||
		file.mimetype === "image/jpg" ||
		file.mimetype === "image/jpeg"
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	if (req.method === "OPTIONS") return res.sendStatus(200);
	next();
});

app.use(isAuth);

app.put("/post-image", (req, res, next) => {
	if (!req.isAuth) {
		const error = new Error("Not authenticated.");
		error.statusCode = 401;
		throw error;
	}
	if (!req.file) {
		return res.status(200).json({ message: "No file provided" });
	}
	if (req.body.oldPath) {
		clearImage(req.body.oldPath);
	}
	console.log(req.file.path.replace("\\", "/"));
	return res
		.status(201)
		.json({ message: "File stored.", filePath: req.file.path.replace("\\", "/") });
});

app.use(
	"/graphql",
	graphqlHTTP({
		schema: graphqlSchema,
		rootValue: graphqlResolver,
		graphiql: true,
		customFormatErrorFn(err) {
			if (!err.originalError) {
				return err;
			}
			const data = err.originalError.data;
			const message = err.message || "An error occurred.";
			const code = err.originalError.code || 500;
			return { message, status: code, data };
		}
	})
);

app.use((error, req, res, next) => {
	const status = error.statusCode || 500;
	const data = error.data;
	const message = error.message;
	res.status(status).json({ message, data });
});

mongoose
	.connect(uri)
	.then(() => {
		app.listen(8080);
	})
	.catch(err => console.log(err));
