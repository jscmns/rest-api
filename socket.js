let io;

module.exports = {
	init: httpServer => {
		io = require("socket.io")(httpServer, {
			cors: {
				origin: "*",
				methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
				allowedHeaders: ["Content-Type", "Authorization"]
			}
		});
		return io;
	},
	getIo: () => {
		if (!io) throw new Error("Socket.io not initialized");
		return io;
	}
};
