import express from "express";
import ViteExpress from "vite-express";
import http from "http";
import { Server } from "socket.io";
import "dotenv/config";

import { Game, games } from "./game";
import { generateCode } from "./utils";
import { HostGameEvent, JoinGameEvent, NicknameChangeEvent } from "./models";

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

  socket.on("host-game", (data: HostGameEvent, ack: (arg: string) => void) => {
    // console.log("host-game");
    // console.log(data);
    const { nickname } = data;

    const roomCode = generateCode();
    const game = new Game(roomCode);
    games[roomCode] = game;
    game.addPlayer(socket, nickname);
    ack(roomCode);
  });

  socket.on("join-game", (data: JoinGameEvent, ack: (arg: string) => void) => {
    // console.log("join-game");
    // console.log(data);

    const { code, nickname } = data;
    const game = games[code];

    if (game) {
      game.addPlayer(socket, nickname);
      ack("success");
    } else {
      ack("failure");
    }
  });

  socket.on("nickname-change", (data: NicknameChangeEvent) => {
    const { nickname } = data;
    const code = socket.data.roomCode;

    const game = games[code];
    if (game) {
      game.changePlayerName(socket, nickname);
    } else {
      console.log("oops");
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("listening on *:3000");
});

ViteExpress.bind(app, server);
