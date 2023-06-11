const useLoaded = (fn) => {
  return document.addEventListener("DOMContentLoaded", fn);
};

export { useLoaded };
