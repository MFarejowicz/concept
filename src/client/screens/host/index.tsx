import { Player } from "../../models";

interface Props {
  roomCode: string;
  nickname: string;
  handleNicknameShuffle: VoidFunction;
  players: Player[];
  startGame: VoidFunction;
}

export function Host({
  roomCode,
  nickname,
  handleNicknameShuffle,
  players,
  startGame,
}: Props) {
  return (
    <>
      <div>room code: {roomCode}</div>
      <div>
        <p>you are: {nickname}</p>
        <button onClick={handleNicknameShuffle}>shuffle</button>
      </div>
      <div>current players:</div>
      {players.map((player) => (
        <div key={player.id}>
          <span>{player.nickname}</span>
          {player.nickname === nickname && <span> (YOU!)</span>}
        </div>
      ))}
      <div>
        <button onClick={startGame}>start game</button>
      </div>
    </>
  );
}
