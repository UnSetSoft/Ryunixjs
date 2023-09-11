import { useStore, useEffect } from "./hooks";
import { createElement } from "./createElement";
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

const Link = (props) => {
  const p = {
    href: props.to,
    ...props,
  };

  return createElement("a", p, props.children);
};

export { Router, Link };
