import { useRef } from "react";
import useImage from "use-image";
import { Layer, Stage, Image, Circle } from "react-konva";
import { Stage as StageT } from "konva/lib/Stage";
import { KonvaEventObject } from "konva/lib/Node";

import boardImage from "../../assets/concept.jpg";

import { Point } from "../../models";
import { getCenter, getDistance, isTouchEnabled } from "../../utils";

const SCALE_FACTOR = 1.02;

interface Props {
  placeHint: VoidFunction;
  hints: Point[];
  stageRef: React.RefObject<StageT>;
}

export function Guess({ placeHint, hints, stageRef }: Props) {
  const lastCenter = useRef<Point | null>(null);
  const lastDist = useRef<number>(0);

  const [board] = useImage(boardImage);

  // 20px padding from each side
  const width = window.innerWidth - 40;
  // 20px padding from each side + some buffer
  const height = window.innerHeight - 240;

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
      const newScale =
        event.evt.deltaY > 0
          ? oldScale * SCALE_FACTOR
          : oldScale / SCALE_FACTOR;
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
          <Image
            image={board}
            // should probably both be bigger of width or height
            width={width}
            height={width}
            onClick={placeHint}
            perfectDrawEnabled={false}
          />
          {hints.map((hint, index) => (
            <Circle
              key={index}
              x={hint.x}
              y={hint.y}
              radius={30}
              fill="red"
              perfectDrawEnabled={false}
            />
          ))}
        </Layer>
      </Stage>
    </>
  );
}
