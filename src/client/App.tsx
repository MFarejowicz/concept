import { useCallback, useEffect, useState } from "react";
import { uniqueNamesGenerator, Config, adjectives, animals } from "unique-names-generator";
import { socket } from "./socket";
import { Player, PlayersUpdateEvent, ServerAckEvent } from "./models";

import "./App.css";

enum MenuState {
  Main = "main",
  Host = "host",
  Join = "join",
  Joined = "joined",
}

const customConfig: Config = {
  dictionaries: [adjectives, animals],
  separator: "-",
  length: 2,
};

function App() {
  const [menuState, setMenuState] = useState<MenuState>(MenuState.Main);
  const [roomCode, setRoomCode] = useState<string>("");
  const [nickname, setNickname] = useState<string>(uniqueNamesGenerator(customConfig));
  const [players, setPlayers] = useState<Array<Player>>([]);

  useEffect(() => {
    function handleServerAck(data: ServerAckEvent) {
      console.log("server ack received");
      console.log(data);
    }

    function handlePlayersUpdate(data: PlayersUpdateEvent) {
      console.log("players update received");
      console.log(data);

      const { players } = data;
      setPlayers(players);
    }

    socket.on("server-ack", handleServerAck);
    socket.on("players-update", handlePlayersUpdate);

    return () => {
      socket.off("server-ack", handleServerAck);
      socket.off("players-update", handlePlayersUpdate);
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

  const handleNicknameShuffle = useCallback(() => {
    const newName = uniqueNamesGenerator(customConfig);

    socket.emit("nickname-change", { nickname: newName });

    setNickname(newName);
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
              <div key={player.id}>{player.nickname}</div>
            ))}
            <div>
              <button>start game</button>
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
              <div key={player.id}>{player.nickname}</div>
            ))}
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
    handleRoomCodeChange,
    joinGame,
  ]);

  return (
    <div className="App">
      <h1>Concept!</h1>
      {renderMenuState()}
    </div>
  );
}

export default App;
