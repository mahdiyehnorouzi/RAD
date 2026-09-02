import { useState } from "react";

export function usePasswordVisibility() {
  const [visible, setVisible] = useState(false);
  return {
    visible,
    inputType: visible ? "text" : "password",
    toggle: () => setVisible((current) => !current),
  };
}
