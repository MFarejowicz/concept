import { Player } from "./game";

export interface ServerAckEvent {
  id: string;
}

export interface PlayersUpdateEvent {
  players: Player[];
}

export interface GameStartingEvent {
  code: string;
}

export interface GuessStartingEvent {
  clueGiver: string;
}
