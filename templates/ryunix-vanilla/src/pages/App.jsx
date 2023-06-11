import Ryunix, { Component } from "@unsetsoft/ryunixjs";

class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const click = () => {
      alert('Click')
    }
    return (
      <button onClick={click}>Click</button>
    );
  }
}

export default App;