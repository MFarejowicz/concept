import { useCallback, useEffect, useRef, useState } from "react";
import useImage from "use-image";
import { Stage, Layer, Image, Circle } from "react-konva";
import { socket } from "./socket";
import {
  Point,
  getCenter,
  getDistance,
  getNickname,
  getRelativePointerPosition,
  isTouchEnabled,
} from "./utils";
import {
  Player,
  PlayersUpdateEvent,
  ServerAckEvent,
  GameStartingEvent,
  GuessStartingEvent,
} from "./models";

import thing from "./assets/concept-board.jpeg";

import "./App.css";
import { Stage as StageT } from "konva/lib/Stage";
import { KonvaEventObject } from "konva/lib/Node";

const SCALE_FACTOR = 1.01;

enum MenuState {
  Main = "main",
  Host = "host",
  Join = "join",
  Joined = "joined",
  GameChooseClueGiver = "game-choose-clue-giver",
  GameGuess = "game-guess",
}

function App() {
  const [menuState, setMenuState] = useState<MenuState>(MenuState.Main);
  const [roomCode, setRoomCode] = useState<string>("");
  const [nickname, setNickname] = useState<string>(getNickname());
  const [players, setPlayers] = useState<Array<Player>>([]);
  const [clueGiver, setClueGiver] = useState<string>("");

  const [image] = useImage(thing);
  const [hints, setHints] = useState<Array<Point>>([]);

  const stageRef = useRef<StageT>(null);
  const lastCenter = useRef<Point | null>(null);
  const lastDist = useRef<number>(0);

  const isClueGiver = nickname === clueGiver;
  // 20px padding from each side
  const width = window.innerWidth - 40;
  // 20px padding from each side + some buffer
  const height = window.innerHeight - 240;

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

  const chooseClueGiver = useCallback((random: boolean) => {
    socket.emit("clue-giver", { random });
  }, []);

  const zoomStage = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    if (stageRef.current !== null) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const stagePointer = stage.getPointerPosition();
      if (!stagePointer) {
        return;
      }
      const { x: pointerX, y: pointerY } = stagePointer;
      const mousePointTo = {
        x: (pointerX - stage.x()) / oldScale,
        y: (pointerY - stage.y()) / oldScale,
      };
      const newScale = event.evt.deltaY > 0 ? oldScale * SCALE_FACTOR : oldScale / SCALE_FACTOR;
      stage.scale({ x: newScale, y: newScale });
      const newPos = {
        x: pointerX - mousePointTo.x * newScale,
        y: pointerY - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    }
  };

  const handleTouch = (event: KonvaEventObject<TouchEvent>) => {
    event.evt.preventDefault();
    const touch1 = event.evt.touches[0];
    const touch2 = event.evt.touches[1];
    const stage = stageRef.current;
    if (stage !== null) {
      if (touch1 && touch2) {
        if (stage.isDragging()) {
          stage.stopDrag();
        }

        const p1 = {
          x: touch1.clientX,
          y: touch1.clientY,
        };
        const p2 = {
          x: touch2.clientX,
          y: touch2.clientY,
        };

        if (!lastCenter.current) {
          lastCenter.current = getCenter(p1, p2);
          return;
        }
        const newCenter = getCenter(p1, p2);

        const dist = getDistance(p1, p2);

        if (!lastDist.current) {
          lastDist.current = dist;
        }

        // local coordinates of center point
        const pointTo = {
          x: (newCenter.x - stage.x()) / stage.scaleX(),
          y: (newCenter.y - stage.y()) / stage.scaleX(),
        };

        const scale = stage.scaleX() * (dist / lastDist.current);

        stage.scaleX(scale);
        stage.scaleY(scale);

        // calculate new position of the stage
        const dx = newCenter.x - lastCenter.current.x;
        const dy = newCenter.y - lastCenter.current.y;

        const newPos = {
          x: newCenter.x - pointTo.x * scale + dx,
          y: newCenter.y - pointTo.y * scale + dy,
        };

        stage.position(newPos);
        stage.batchDraw();

        lastDist.current = dist;
        lastCenter.current = newCenter;
      }
    }
  };

  const handleTouchEnd = () => {
    lastCenter.current = null;
    lastDist.current = 0;
  };

  const placeThing = () => {
    if (stageRef.current !== null) {
      const stage = stageRef.current;
      const stagePointer = stage.getPointerPosition();
      if (!stagePointer) {
        return;
      }
      const test = getRelativePointerPosition(stage);
      const newHint = {
        x: test.x,
        y: test.y,
      };
      setHints((oldHints) => [...oldHints, newHint]);
    }
  };

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
      case MenuState.GameChooseClueGiver:
        return (
          <>
            <div>this is the game!</div>
            <button onClick={() => chooseClueGiver(false)}>be clue giver</button>
            <button onClick={() => chooseClueGiver(true)}>random clue giver</button>
          </>
        );
      case MenuState.GameGuess:
        return (
          <>
            <div>this is the game!</div>
            <Stage
              width={width}
              height={height}
              draggable={!isTouchEnabled()}
              onWheel={zoomStage}
              onTouchMove={handleTouch}
              onTouchEnd={handleTouchEnd}
              ref={stageRef}
            >
              <Layer>
                <Image image={image} onClick={placeThing} />
                {hints.map((hint, index) => (
                  <Circle key={index} x={hint.x} y={hint.y} radius={30} fill="red" />
                ))}
              </Layer>
            </Stage>
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
    width,
    height,
    image,
    hints,
    chooseClueGiver,
  ]);

  return (
    <div className="App">
      <h1>Concept!</h1>
      {renderMenuState()}
    </div>
  );
}

export default App;
