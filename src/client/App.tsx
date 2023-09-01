import { useCallback, useEffect, useState } from "react";
import { socket } from "./socket";
import { ServerAckEvent } from "./models";

import "./App.css";

enum MenuState {
  Main = "main",
  Host = "host",
  Join = "join",
}

function App() {
  const [menuState, setMenuState] = useState<MenuState>(MenuState.Main);
  const [roomCode, setRoomCode] = useState<string>("");

  useEffect(() => {
    function handleServerAck(data: ServerAckEvent) {
      console.log("server ack received");
      console.log(data);
    }

    socket.on("server-ack", handleServerAck);

    return () => {
      socket.off("server-ack", handleServerAck);
    };
  }, []);

  const hostGame = useCallback(async () => {
    setMenuState(MenuState.Host);
    const roomCode = await socket.emitWithAck("host-game", { foo: "bar" });
    // console.log(roomCode);
    setRoomCode(roomCode);
  }, []);

  const joinGame = useCallback(() => {
    setMenuState(MenuState.Join);
  }, []);

  const renderMenuState = useCallback(() => {
    switch (menuState) {
      case MenuState.Main:
        return (
          <>
            <div>
              <button onClick={hostGame}>host</button>
            </div>
            <div>
              <button onClick={joinGame}>join</button>
            </div>
          </>
        );
      case MenuState.Host:
        return (
          <>
            <div>room code: {roomCode}</div>
            <div>
              <p>you are: bob</p>
              <button>shuffle</button>
            </div>
            <div>current players:</div>
            <div>a</div>
            <div>b</div>
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
              <input></input>
              <button>join</button>
            </div>
          </>
        );
      default:
        return "oops";
    }
  }, [hostGame, joinGame, menuState, roomCode]);

  return (
    <div className="App">
      <h1>Concept!</h1>
      {renderMenuState()}
    </div>
  );
}

export default App;
