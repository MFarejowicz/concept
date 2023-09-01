import express from "express";
import ViteExpress from "vite-express";
import http from "http";
import { Server } from "socket.io";
import { generateCode } from "./utils";
import { HostGameEvent } from "./models";

import "dotenv/config";

const app = express();
const server = http.createServer(app);
// socket.io guide claims that cors might be necessary, but it does not seem so for me
// const io = new Server(server, { cors: { origin: "http://localhost:3000" } });
const io = new Server(server);

app.get("/hello", (_, res) => {
  res.send("Hello Vite + React + TypeScript!");
});

io.on("connection", (socket) => {
  socket.emit("server-ack", { id: socket.id });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("host-game", (_data: HostGameEvent, ack: (arg: string) => void) => {
    // console.log("host-game");
    // console.log(data);
    const roomCode = generateCode();
    ack(roomCode);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("listening on *:3000");
});

ViteExpress.bind(app, server);
