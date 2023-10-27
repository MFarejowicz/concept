import { useCallback, useEffect, useState } from "react";
import { socket } from "./socket";
import { getNickname } from "./utils";
import {
  Player,
  PlayersUpdateEvent,
  ServerAckEvent,
  GameStartingEvent,
  GuessStartingEvent,
} from "./models";

import "./App.css";

enum MenuState {
  Main = "main",
  Host = "host",
  Join = "join",
  Joined = "joined",
  Game = "game",
}

function App() {
  const [menuState, setMenuState] = useState<MenuState>(MenuState.Main);
  const [roomCode, setRoomCode] = useState<string>("");
  const [nickname, setNickname] = useState<string>(getNickname());
  const [players, setPlayers] = useState<Array<Player>>([]);

  useEffect(() => {
    function handleServerAck(data: ServerAckEvent) {
      console.log("server ack received");
      console.log(data);
    }

    function handlePlayersUpdate(data: PlayersUpdateEvent) {
      // console.log("players update received");
      // console.log(data);

      const { players } = data;
      setPlayers(players);
    }

    function handleGameStarting(_data: GameStartingEvent) {
      // console.log("game starting received");
      // console.log(data);

      setMenuState(MenuState.Game);
    }

    function handleGuessStarting(data: GuessStartingEvent) {
      // console.log("guess starting received");
      console.log(data);
    }

    socket.on("server-ack", handleServerAck);
    socket.on("players-update", handlePlayersUpdate);
    socket.on("game-starting", handleGameStarting);
    socket.on("guess-starting", handleGuessStarting);

    return () => {
      socket.off("server-ack", handleServerAck);
      socket.off("players-update", handlePlayersUpdate);
      socket.off("game-starting", handleGameStarting);
      socket.off("guess-starting", handleGuessStarting);
    };
  }, []);

  const startHost = useCallback(async () => {
    const roomCode = await socket.emitWithAck("host-game", { nickname });
    // console.log(roomCode);
    setMenuState(MenuState.Host);
    setRoomCode(roomCode.toUpperCase());
  }, [nickname]);

  const startJoin = useCallback(() => {
    setMenuState(MenuState.Join);
  }, []);

  const handleRoomCodeChange = useCallback((event: React.FormEvent<HTMLInputElement>) => {
    const newVal = event.currentTarget.value;

    setRoomCode(newVal.toUpperCase());
  }, []);

  const joinGame = useCallback(async () => {
    const code = roomCode.toUpperCase();
    if (code.length !== 4) {
      console.log("oops");
      return;
    }

    const res = await socket.emitWithAck("join-game", { code, nickname });
    if (res === "success") {
      setMenuState(MenuState.Joined);
    } else {
      console.log("oops");
    }
  }, [nickname, roomCode]);

  const startGame = useCallback(() => {
    socket.emit("start-game");
  }, []);

  const handleNicknameShuffle = useCallback(() => {
    const newName = getNickname();

    socket.emit("nickname-change", { nickname: newName });

    setNickname(newName);
  }, []);

  const setClueGiver = useCallback((random: boolean) => {
    socket.emit("clue-giver", { random });
  }, []);

  const renderMenuState = useCallback(() => {
    switch (menuState) {
      case MenuState.Main:
        return (
          <>
            <div>
              <button onClick={startHost}>host</button>
            </div>
            <div>
              <button onClick={startJoin}>join</button>
            </div>
          </>
        );
      case MenuState.Host:
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
      case MenuState.Join:
        return (
          <>
            <div>
              <p>enter room code</p>
              <input value={roomCode} onChange={handleRoomCodeChange}></input>
              <button onClick={joinGame}>join</button>
            </div>
          </>
        );
      case MenuState.Joined:
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
          </>
        );
      case MenuState.Game:
        return (
          <>
            <div>this is the game!</div>
            <button onClick={() => setClueGiver(false)}>be clue giver</button>
            <button onClick={() => setClueGiver(true)}>random clue giver</button>
          </>
        );
      default:
        return "oops";
    }
  }, [
    menuState,
    startHost,
    startJoin,
    roomCode,
    nickname,
    handleNicknameShuffle,
    players,
    startGame,
    handleRoomCodeChange,
    joinGame,
    setClueGiver,
  ]);

  return (
    <div className="App">
      <h1>Concept!</h1>
      {renderMenuState()}
    </div>
  );
}

export default App;
