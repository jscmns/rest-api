const express = require("express");
const feedController = require("../controllers/feed");
const { body } = require("express-validator");
const isAuth = require("../middleware/isAuth");
const router = express.Router();

// GET /feed/posts
router.get("/posts", isAuth, feedController.getPosts);

router.post(
	"/posts",
	isAuth,
	[body("title").trim().isLength({ min: 5 }), body("content").trim().isLength({ min: 5 })],
	feedController.createPost
);

router.get("/posts/:postId", feedController.getPost);

router.put(
	"/posts/:postId",
	isAuth,
	[body("title").trim().isLength({ min: 5 }), body("content").trim().isLength({ min: 5 })],
	feedController.updatePost
);

router.delete("/posts/:postId", isAuth, feedController.deletePost);

module.exports = router;
