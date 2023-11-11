import { Config, adjectives, animals, uniqueNamesGenerator } from "unique-names-generator";

const customConfig: Config = {
  dictionaries: [adjectives, animals],
  separator: "-",
  length: 2,
};

export function getNickname() {
  return uniqueNamesGenerator(customConfig);
}

export interface Point {
  x: number;
  y: number;
}

export function getDistance(p1: Point, p2: Point) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function getCenter(p1: Point, p2: Point) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function isTouchEnabled() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRelativePointerPosition(node: any): Point {
  const transform = node.getAbsoluteTransform().copy();
  transform.invert();
  return transform.point(node.getStage().getPointerPosition());
}
