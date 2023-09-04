import { useEffect, useStore } from "../dom";
/**
 * The Router component is responsible for rendering a specific component based on the current path in
 * the browser's URL.
 * @returns The `Router` component returns the `component` if the `currentPath` matches the specified
 * `path`, otherwise it returns `null`.
 */
const Router = ({ path, component }) => {
  const [currentPath, setCurrentPath] = useStore(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(() => window.location.pathname);
    };

    window.addEventListener("navigate", onLocationChange);
    window.addEventListener("pushsatate", onLocationChange);
    window.addEventListener("popstate", onLocationChange);

    return () => {
      window.removeEventListener("navigate", onLocationChange);
      window.removeEventListener("pushsatate", onLocationChange);
      window.removeEventListener("popstate", onLocationChange);
    };
  }, [currentPath]);

  return currentPath === path ? component() : null;
};

export default Router;
