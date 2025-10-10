import {
  createContext,
  useEffect,
  useReducer,
  useState,
  useContext,
  useMemo,
} from "react";

const initialState = {
  isRunning: false,
  setId: null,
  startTime: null,
  endTime: null,
};

function runReducer(state, action) {
  switch (action.type) {
    case "RUN":
      const start = Date.now();
      return {
        ...state,
        setId: action.setId,
        isRunning: true,
        isPaused: false,
        startTime: start,
      };
    case "COMPLETE":
      const end = Date.now();
      return { ...state, setId: action.setId, isRunning: false, endTime: end };
    case "PAUSE":
      return { ...state, isPaused: true };
    case "RESUME":
      return { ...state, isPaused: false };
    default:
      return state;
  }
}

// @ts-ignore
// Context 2개로 분리
export const RunContext = createContext();
export const RunSecondsContext = createContext();

export function RunProvider({ children }) {
  const [state, dispatch] = useReducer(runReducer, initialState);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      const interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      if (state.isPaused) {
        return;
      } else {
        setSeconds(0);
      }
    }
  }, [state]);

  const useRun = (setId) => {
    dispatch({ type: "RUN", setId: setId });
  };

  const useStop = () => {
    setSeconds(0);
    dispatch({ type: "COMPLETE" });
  };

  const usePause = () => {
    dispatch({ type: "PAUSE" });
  };
  const useResume = () => {
    dispatch({ type: "RESUME" });
  };
  const useComplete = () => {
    setSeconds(0);
    dispatch({ type: "COMPLETE" });
  };

  // seconds 제외한 value
  const value = useMemo(
    () => ({
      useRun,
      useStop,
      usePause,
      useResume,
      useComplete,
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      setId: state.setId,
      endTime: state.endTime,
      startTime: state.startTime,
    }),
    [
      state.isRunning,
      state.setId,
      state.isPaused,
      state.endTime,
      state.startTime,
    ]
  );

  return (
    <RunContext.Provider value={value}>
      <RunSecondsContext.Provider value={seconds}>
        {children}
      </RunSecondsContext.Provider>
    </RunContext.Provider>
  );
}
