import { useCallback, useEffect, useRef, useState } from "react";
import { Stage as StageT } from "konva/lib/Stage";

import { socket } from "./socket";
import { Host, Main, Join, Joined, ClueGiverSelect, Guess } from "./screens";
import {
  Player,
  Point,
  PlayersUpdateEvent,
  ServerAckEvent,
  GameStartingEvent,
  GuessStartingEvent,
  MenuState,
} from "./models";
import { getNickname, getRelativePointerPosition } from "./utils";

import "./App.css";

function App() {
  const [menuState, setMenuState] = useState<MenuState>(MenuState.Main);
  const [roomCode, setRoomCode] = useState<string>("");
  const [nickname, setNickname] = useState<string>(getNickname());
  const [players, setPlayers] = useState<Array<Player>>([]);
  const [clueGiver, setClueGiver] = useState<string>("");

  const stageRef = useRef<StageT>(null);
  const [hints, setHints] = useState<Array<Point>>([]);

  const isClueGiver = nickname === clueGiver;

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

      setMenuState(MenuState.GameChooseClueGiver);
    }

    function handleGuessStarting(data: GuessStartingEvent) {
      // console.log("guess starting received");
      // console.log(data);

      const { clueGiver } = data;
      setClueGiver(clueGiver);
      setMenuState(MenuState.GameGuess);
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

  const handleRoomCodeChange = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      const newVal = event.currentTarget.value;

      setRoomCode(newVal.toUpperCase());
    },
    []
  );

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

  const chooseClueGiver = useCallback((random: boolean) => {
    socket.emit("clue-giver", { random });
  }, []);

  const placeHint = useCallback(() => {
    if (stageRef.current !== null) {
      const stage = stageRef.current;
      const stagePointer = stage.getPointerPosition();
      if (!stagePointer) {
        return;
      }

      const transformedStagePointer = getRelativePointerPosition(stage);
      const newHint = {
        x: transformedStagePointer.x,
        y: transformedStagePointer.y,
      };

      setHints((oldHints) => [...oldHints, newHint]);
    }
  }, []);

  const renderMenuState = () => {
    switch (menuState) {
      case MenuState.Main:
        return <Main startHost={startHost} startJoin={startJoin} />;
      case MenuState.Host:
        return (
          <Host
            roomCode={roomCode}
            nickname={nickname}
            handleNicknameShuffle={handleNicknameShuffle}
            players={players}
            startGame={startGame}
          />
        );
      case MenuState.Join:
        return (
          <Join
            roomCode={roomCode}
            handleRoomCodeChange={handleRoomCodeChange}
            joinGame={joinGame}
          />
        );
      case MenuState.Joined:
        return (
          <Joined
            roomCode={roomCode}
            nickname={nickname}
            handleNicknameShuffle={handleNicknameShuffle}
            players={players}
          />
        );
      case MenuState.GameChooseClueGiver:
        return <ClueGiverSelect chooseClueGiver={chooseClueGiver} />;
      case MenuState.GameGuess:
        return (
          <Guess placeHint={placeHint} hints={hints} stageRef={stageRef} />
        );
      default:
        return "oops";
    }
  };

  return (
    <div className="App">
      <h1>Concept!</h1>
      {renderMenuState()}
    </div>
  );
}

export default App;
