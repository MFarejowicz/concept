import { Socket } from "socket.io";

export const games: Record<string, Game> = {};

export class Game {
  roomCode: string;
  players: Record<string, Socket> = {};

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }

  // static getGame(code: string) {
  //   return games[code];
  // }

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

  getPlayers() {
    const players = Object.values(this.players).map((player) => ({
      id: player.id,
      nickname: player.data.nickname,
    }));

    return players;
  }
}
