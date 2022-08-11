const express = require("express");
const feedController = require("../controllers/feed");
const { body } = require("express-validator");
const router = express.Router();

// GET /feed/posts
router.get("/posts", feedController.getPosts);

router.post(
	"/post",
	[body("title").trim().isLength({ min: 5 }), body("content").trim().isLength({ min: 5 })],
	feedController.createPost
);

router.get('/posts/:postId', feedController.getPost);

module.exports = router;
