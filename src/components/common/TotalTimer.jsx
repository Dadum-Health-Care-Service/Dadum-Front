import { RunSecondsContext } from "../../context/RunContext";
import { useContext, useEffect, useState } from "react";

export default function TotalTimer({ type, size = "20px" }) {
  const seconds = useContext(RunSecondsContext);
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };
  const styles = {
    container: {
      width: "fit-content",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    time: {
      fontSize: size,
      color: type && type === "DETAIL" ? "black" : "white",
      fontWeight: "bold",
      margin: 0,
    },
  };
  return (
    <div style={styles.container}>
      <h1 style={styles.time}>{formatTime(seconds)}</h1>
    </div>
  );
}
