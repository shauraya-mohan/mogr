"use client";

import { useLayoutEffect } from "react";

/**
 * The marketing site has no light mode. If the console's theme toggle left
 * `data-theme="light"` on `<html>` (client-side nav carries the attribute
 * over, it isn't reset per route), force it back to dark here before paint.
 */
export default function ForceDarkTheme() {
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return null;
}
