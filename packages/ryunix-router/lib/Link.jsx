import Ryunix from "@unsetsoft/ryunixjs";

const Link = ({ to, children }) => {
  const preventReload = (event) => {
    event.preventDefault();
    if (window.location.pathname !== to) {
      window.history.pushState({}, "", to);
      const navigationEvent = new Event("pushsatate");
      window.dispatchEvent(navigationEvent);
    }
  };
  return (
    <div>
      <a href={to} onClick={preventReload}>{children}</a>
    </div>
  )
};
export default Link;
