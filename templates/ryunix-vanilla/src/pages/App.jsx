import Ryunix, { Component } from "@unsetsoft/ryunixjs";

class App extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <header className="App-header">

        <p>Hello RyunixJS!</p>

        <p>
          Edit <code>App.jsx</code> and save to test HMR updates.
        </p>
      </header>
    );
  }
}

export default App;