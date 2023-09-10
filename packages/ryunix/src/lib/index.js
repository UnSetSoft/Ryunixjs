import { createElement, Fragments } from "./createElement";
import { render, init } from "./render";
import { useContext, useStore, useEffect } from "./hooks";
import { createContext } from "./createContext";

export { useStore, useEffect, createContext, useContext, Fragments };

export default {
  createElement,
  render,

  init,
  Fragments,
};
