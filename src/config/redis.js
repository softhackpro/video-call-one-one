import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();
export const pubClient = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

export const subClient = pubClient.duplicate();

export const connectRedis = async () => {
  await pubClient.connect();
  await subClient.connect();
  console.log("✅ Redis connected");
};