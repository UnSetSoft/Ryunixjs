import Ryunix, { useStore, useEffect } from "../../../ryunix/dist/Ryunix"

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
    }
  }, [currentPath]);

  return currentPath === path ? component() : null;
};

export default Router;