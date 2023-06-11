class Store {
  constructor(defvalue) {
    this.defvalue = defvalue;
  }
  /* `setValue` is a method that takes in a parameter `newValue`. The arrow function syntax `=>` is
  used to define the function. Inside the function, the `defvalue` property of the `Store` instance
  is set to the `newValue` parameter. This means that when `setValue` is called with a new value, it
  updates the `defvalue` property of the `Store` instance to that new value. */
  setValue = (newValue) => (this.defvalue = newValue);

  /* `hook` is a method that returns an array containing two functions: `getValue` and `setValue`.
  These functions can be used to get and set the value of the `defvalue` property of the `Store`
  class instance. This is useful for implementing state management in React functional components
  using the `useState` hook. */
  hook = () => {
    return [this.defvalue, this.setValue];
  };
}

export default Store;
