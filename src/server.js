import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import { registerCallHandlers } from "./sockets/call-handlers.js";
import { initSocket } from "./sockets/socket.js";
import { connectRedis } from "./config/redis.js";

dotenv.config();

const server = http.createServer(app);

// connect redis first
await connectRedis();

// init socket
const io = initSocket(server);

// register handlers
io.on("connection", (socket) => {
  registerCallHandlers(io, socket);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});