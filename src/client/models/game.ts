export enum MenuState {
  Main = "main",
  Host = "host",
  Join = "join",
  Joined = "joined",
  GameChooseClueGiver = "game-choose-clue-giver",
  GameGuess = "game-guess",
}

export interface Player {
  id: string;
  nickname: string;
}

export interface Point {
  x: number;
  y: number;
}
