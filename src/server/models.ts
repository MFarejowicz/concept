export interface HostGameEvent {
  nickname: string;
}

export interface JoinGameEvent {
  code: string;
  nickname: string;
}

export interface NicknameChangeEvent {
  nickname: string;
}
