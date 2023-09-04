import { useStore } from "@unsetsoft/ryunixjs";

function App() {
  const [count, setCount] = useStore(0);

  const handleButtonClick = () => {
    setCount((c) => c + 1);
  };

  return (
    <div className="main">
      <h1>Hello from RyunixJS v0.2.11!</h1>
      <h2>Webpack Update!</h2>
      <p>
        Edit <code>App.tsx</code> and save!
      </p>
      <p>Clicks {count}!</p>
      <button className="button" onClick={handleButtonClick}>
        Click to increment
      </button>
    </div>
  );
}

export default App;
