import { Socket } from "socket.io";

export const games: Record<string, Game> = {};

export class Game {
  roomCode: string;
  players: Record<string, Socket> = {};
  clueGiver: Socket | undefined;

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }

  static fromSocket(socket: Socket) {
    const code = socket.data.roomCode;

    if (!code) {
      console.log("oops no code found");
      return;
    }

    const game = games[code];

    if (!game) {
      console.log("oops no game found");
      return;
    }

    return game;
  }

  getPlayers() {
    const players = Object.values(this.players).map((player) => ({
      id: player.id,
      nickname: player.data.nickname,
    }));

    return players;
  }

  addPlayer(player: Socket, nickname: string) {
    player.data.roomCode = this.roomCode;
    player.data.nickname = nickname;
    this.players[player.id] = player;

    Object.values(this.players).forEach((player) => {
      player.emit("players-update", { players: this.getPlayers() });
    });
  }

  removePlayer(player: Socket) {
    delete this.players[player.id];
  }

  changePlayerName(player: Socket, nickname: string) {
    player.data.nickname = nickname;

    Object.values(this.players).forEach((player) => {
      player.emit("players-update", { players: this.getPlayers() });
    });
  }

  startGame() {
    Object.values(this.players).forEach((player) => {
      player.emit("game-starting", { code: this.roomCode });
    });
  }

  setClueGiver(player: Socket | undefined) {
    if (player) {
      this.clueGiver = player;
    } else {
      const playersArray = Object.values(this.players);
      const chosen = playersArray[Math.floor(Math.random() * playersArray.length)];
      this.clueGiver = chosen;
    }

    Object.values(this.players).forEach((player) => {
      player.emit("guess-starting", { clueGiver: this.clueGiver?.data.nickname });
    });
  }
}
