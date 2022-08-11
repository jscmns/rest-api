const { validationResult } = require("express-validator");
const Post = require("../models/post");
const { defaultErrorHandling } = require("../utils/utils");

exports.getPosts = (req, res, next) => {
	Post.find()
		.then(posts => {
			res.status(200).json({ message: "Fetched posts successfully!", posts });
		})
		.catch(e => defaultErrorHandling(e, next));
};

exports.createPost = (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const error = new Error("Validation failed, entered data is incorrect.");
		error.statusCode = 422;
		throw error;
	}

	const title = req.body.title;
	const content = req.body.content;
	const post = new Post({
		title,
		content,
		imageUrl: req.file.path.replace("\\", "/"),
		creator: {
			name: "John Doe"
		}
	});
	post
		.save()
		.then(result => {
			console.log(result);
			res.status(201).json({
				message: "Post created successfully!",
				post: result
			});
		})
		.catch(e => defaultErrorHandling(e, next));
};

exports.getPost = (req, res, next) => {
	const { postId } = req.params;
	Post.findById(postId)
		.then(post => {
			if (!post) {
				const error = new Error("Could not find post.");
				error.statusCode = 404;
				throw error;
			}
			res.status(200).json({ message: "Post found!", post: post });
		})
		.catch(e => defaultErrorHandling(e, next));
};
