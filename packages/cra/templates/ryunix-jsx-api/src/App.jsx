import { useStore } from '@unsetsoft/ryunixjs'

function App() {
  const [count, setCount] = useStore(0)

  const handleButtonClick = () => {
    setCount((c) => c + 1)
  }

  return (
    <div className="main">
      <h1>Hello from RyunixJS!</h1>

      <p>
        Edit <code>App.jsx</code> and save!
      </p>
      <p>Clicks {count}!</p>
      <button className="button" onClick={handleButtonClick}>
        Click to increment
      </button>
    </div>
  )
}

export default App
