import Store from "./store";
const useStore = (val) => new Store(val).hook();
export { useStore };
export default { useStore };
