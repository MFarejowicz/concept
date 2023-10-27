import { Config, adjectives, animals, uniqueNamesGenerator } from "unique-names-generator";

const customConfig: Config = {
  dictionaries: [adjectives, animals],
  separator: "-",
  length: 2,
};

export function getNickname() {
  return uniqueNamesGenerator(customConfig);
}
