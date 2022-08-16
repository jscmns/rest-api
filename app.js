const dotenv = require("dotenv").config();
const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const mongoose = require("mongoose");
const password = encodeURIComponent("iP32Le26WjaQe7rw");
const uri = `mongodb+srv://admin:${password}@cluster0.fnumx.mongodb.net/messages?retryWrites=true&w=majority`;
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

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
	next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
	const status = error.statusCode || 500;
	const data = error.data;
	const message = error.message;
	res.status(status).json({ message, data });
});

mongoose
	.connect(uri)
	.then(() => {
		const server = app.listen(8080);
		const socketIo = require("./socket").init(server);
		socketIo.on("connection", socket => console.log("New client connected"));
	})
	.catch(err => console.log(err));
