import { RYUNIX_TYPES } from "../utils/index";

/**
 * The function createContext creates a context object with a default value and methods to set and get
 * the context value.
 * @param defaultValue - The `defaultValue` parameter is the initial value that will be assigned to the
 * `contextValue` variable if no value is provided when creating the context.
 * @returns a context object.
 * @deprecated
 */
const createContext = (defaultValue) => {
  throw Error("createContext is bugged and will be removed");
  let contextValue = defaultValue || null;

  const context = {
    tag: RYUNIX_TYPES.RYUNIX_CONTEXT,
    Value: contextValue,
    Provider(props) {
      this.Value = props.value;
    },
  };

  return context;
};

export { createContext };
