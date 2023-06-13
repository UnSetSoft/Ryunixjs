import Ryunix from "@unsetsoft/ryunixjs";

class App extends Ryunix.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <header className="App-header">
        <p>Hello RyunixJS!</p>

        <p>
          Edit <code>App.js</code> and save!
        </p>
      </header>
    );
  }
}

export default App;
