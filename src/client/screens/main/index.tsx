interface Props {
  startHost: VoidFunction;
  startJoin: VoidFunction;
}

export function Main({ startHost, startJoin }: Props) {
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
}
