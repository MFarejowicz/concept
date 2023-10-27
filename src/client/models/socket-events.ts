export interface ServerAckEvent {
  id: string;
}

export interface Player {
  id: string;
  nickname: string;
}

export interface PlayersUpdateEvent {
  players: Array<Player>;
}
