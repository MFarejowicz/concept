interface Props {
  chooseClueGiver: (random: boolean) => void;
}

export function ClueGiverSelect({ chooseClueGiver }: Props) {
  return (
    <>
      <div>this is the game!</div>
      <button onClick={() => chooseClueGiver(false)}>be clue giver</button>
      <button onClick={() => chooseClueGiver(true)}>random clue giver</button>
    </>
  );
}
