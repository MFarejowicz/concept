interface Props {
  roomCode: string;
  handleRoomCodeChange: (event: React.FormEvent<HTMLInputElement>) => void;
  joinGame: VoidFunction;
}

export function Join({ roomCode, handleRoomCodeChange, joinGame }: Props) {
  return (
    <>
      <div>
        <p>enter room code</p>
        <input value={roomCode} onChange={handleRoomCodeChange}></input>
        <button onClick={joinGame}>join</button>
      </div>
    </>
  );
}
