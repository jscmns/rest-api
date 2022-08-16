const { validationResult } = require("express-validator");
const Post = require("../models/post");
const {
	defaultErrorHandling,
	validationFailure,
	notFound,
	unauthorized
} = require("../utils/utils");
const fs = require("fs");
const path = require("path");
const User = require("../models/user");
const io = require("../socket");

exports.getPosts = async (req, res, next) => {
	const currentPage = req.query.page || 1;
	const perPage = 2;
	try {
		const totalItems = await Post.find().countDocuments();
		const posts = await Post.find()
			.populate("creator")
			.sort({ createdAt: -1 })
			.skip((currentPage - 1) * perPage)
			.limit(perPage);
		res.status(200).json({ message: "Fetched posts successfully!", posts, totalItems });
	} catch (e) {
		return defaultErrorHandling(e, next);
	}
};

exports.createPost = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty() || !req.file) {
		return validationFailure();
	}
	const imageUrl = req.file.path.replace("\\", "/");
	const { title, content } = req.body;
	let creator;
	const post = new Post({
		title,
		content,
		imageUrl,
		creator: req.userId
	});

	try {
		await post.save();
		const user = await User.findById(req.userId);
		creator = user;
		user.posts.push(post);
		await user.save();
		io.getIo().emit("posts", {
			action: "create",
			post: { ...post._doc, creator: { _id: req.userId, name: user.name } }
		});
		res.status(201).json({
			message: "Post created successfully!",
			post: post,
			creator: {
				_id: creator._id,
				name: creator.name
			}
		});
	} catch (e) {
		return defaultErrorHandling(e, next);
	}
};

exports.getPost = async (req, res, next) => {
	const { postId } = req.params;
	try {
		const post = await Post.findById(postId);
		if (!post) return notFound;
		res.status(200).json({ message: "Post fetched successfully!", post });
	} catch (e) {
		return defaultErrorHandling(e, next);
	}
};

exports.updatePost = async (req, res, next) => {
	const { postId } = req.params;
	const errors = validationResult(req);

	if (!errors.isEmpty()) return validationFailure();

	const { title, content } = req.body;

	const imageUrl = req.file ? req.file.path.replace("\\", "/") : req.body.image;
	if (!imageUrl) {
		const error = new Error("No image provided.");
		error.statusCode = 422;
		throw error;
	}

	try {
		const post = await Post.findById(postId).populate("creator");

		if (!post) return notFound();
		if (post.creator._id.toString() !== req.userId) return unauthorized();
		if (imageUrl !== post.imageUrl) clearImage(post.imageUrl);

		post.title = title;
		post.content = content;
		post.imageUrl = imageUrl;
		await post.save();
		io.getIo().emit("posts", { action: "update", post });

		res.status(200).json({ message: "Post updated successfully!", post });
	} catch (e) {
		return defaultErrorHandling(e, next);
	}
};

const clearImage = filePath => {
	filePath = path.join(__dirname, "..", filePath);
	fs.unlink(filePath, err => console.log(err));
};

exports.deletePost = async (req, res, next) => {
	const { postId } = req.params;
	try {
		const post = await Post.findById(postId);
		if (!post) return notFound();
		if (post.creator.toString() !== req.userId) return unauthorized();
		clearImage(post.imageUrl);
		await Post.findByIdAndRemove(postId);
		const user = await User.findById(req.userId);
		user.posts.pull(postId);
		await user.save();
		io.getIo().emit("posts", { action: "delete", postId });
		res.status(200).json({ message: "Post deleted successfully!" });
	} catch (e) {
		return defaultErrorHandling(e, next);
	}
};
