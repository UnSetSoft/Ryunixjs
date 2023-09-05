/**
 * The Link function is a Ryunix component that prevents page reload when a link is clicked and updates
 * the browser's history and local storage.
 * @param props - The `props` parameter is an object that contains the properties passed to the `Link`
 * component. These properties can include the following:
 * @returns The Link component is being returned.
 */
const Link = (props) => {
  const preventReload = (event) => {
    event.preventDefault();
    if (window.location.pathname !== props.to) {
      window.history.pushState({}, "", props.to);
      const navigationEvent = new Event("pushsatate");
      window.dispatchEvent(navigationEvent);
      localStorage.setItem("pathname", props.to);
    }
  };

  const isCurrentPath = window.location.pathname === props.to ? true : false;
  const activeClassName = props.activeClassName || "";
  return (
    <a
      href={props.to}
      className={isCurrentPath ? `${props.className} ${activeClassName}` : ""}
      onClick={preventReload}
      {...props}
    >
      {props.children}
    </a>
  );
};

export default Link;
