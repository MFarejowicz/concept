export interface HostGameEvent {
  nickname: string;
}

export interface JoinGameEvent {
  code: string;
  nickname: string;
}

export interface StartGameEvent {}

export interface NicknameChangeEvent {
  nickname: string;
}

export interface ClueGiverEvent {
  random: boolean;
}
