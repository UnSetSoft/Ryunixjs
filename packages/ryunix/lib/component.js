import { scheduleUpdate } from "./reconciler";
export class Component {
  constructor(props) {
    this.props = props;
    this.state = this.state || {};
  }
  setState(partialState) {
    // this.state = Object.assign({}, this.state, partialState);
    // scheduleUpdate(this.__internalInstance, partialState);
    throw Error(
      "This function is not implemented yet, has a lot of bugs. You can check https://github.com/UnSetSoft/Ryunixjs/issues/10 for more information."
    );
  }
}
