import React, { useState, useEffect } from "react";
import DeveloperTerminal from "./DeveloperTerminal";

interface SecretTerminalProps {
  secretSequence?: string[];
  resetTimeout?: number;
}

export default function SecretTerminal({
  secretSequence = ["Shift", "Shift", "Shift"],
  resetTimeout = 3000,
}: SecretTerminalProps) {
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [lastKeyTime, setLastKeyTime] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();

      // Reset sequence if too much time has passed
      if (currentTime - lastKeyTime > resetTimeout) {
        setKeySequence([]);
      }

      setLastKeyTime(currentTime);

      // Add the key to sequence
      const newSequence = [...keySequence, event.key];

      // Keep only the last N keys where N is the length of secret sequence
      const trimmedSequence = newSequence.slice(-secretSequence.length);
      setKeySequence(trimmedSequence);

      // Check if the sequence matches
      if (trimmedSequence.length === secretSequence.length) {
        const matches = trimmedSequence.every(
          (key, index) => key === secretSequence[index]
        );
        if (matches) {
          setIsTerminalVisible(true);
          setKeySequence([]); // Reset after successful activation
        }
      }
    };

    // Also listen for specific developer key combinations
    const handleKeyUp = (event: KeyboardEvent) => {
      // F12 + Shift + Ctrl opens terminal
      if (event.key === "F12" && event.shiftKey && event.ctrlKey) {
        event.preventDefault();
        setIsTerminalVisible(true);
        setKeySequence([]);
      }

      // Escape closes terminal
      if (event.key === "Escape" && isTerminalVisible) {
        setIsTerminalVisible(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    keySequence,
    secretSequence,
    resetTimeout,
    lastKeyTime,
    isTerminalVisible,
  ]);

  // Konami code Easter egg
  useEffect(() => {
    const konamiCode = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "KeyB",
      "KeyA",
    ];
    let konamiSequence: string[] = [];

    const handleKonamiKey = (event: KeyboardEvent) => {
      konamiSequence.push(event.code);
      konamiSequence = konamiSequence.slice(-konamiCode.length);

      if (
        konamiSequence.length === konamiCode.length &&
        konamiSequence.every((key, index) => key === konamiCode[index])
      ) {
        setIsTerminalVisible(true);
        konamiSequence = [];

        // Add a fun message to the terminal
        setTimeout(() => {
          console.log("🎮 Konami Code activated! Developer terminal unlocked!");
        }, 100);
      }
    };

    document.addEventListener("keydown", handleKonamiKey);
    return () => document.removeEventListener("keydown", handleKonamiKey);
  }, []);

  const handleCloseTerminal = () => {
    setIsTerminalVisible(false);
    setKeySequence([]);
  };

  return (
    <DeveloperTerminal
      isVisible={isTerminalVisible}
      onClose={handleCloseTerminal}
    />
  );
}
