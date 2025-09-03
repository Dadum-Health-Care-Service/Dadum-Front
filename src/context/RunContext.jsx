import { createContext, useEffect, useReducer, useState } from 'react';

const initialState = {
  isRunning: false,
  startTime: null,
  endTime: null,
};

function runReducer(state, action) {
  switch (action.type) {
    case 'RUN':
      const start = Date.now();
      return { ...state, isRunning: true, startTime: start };
    case 'COMPLETE':
      const end = Date.now();
      return { ...state, isRunning: false, endTime: end };
    default:
      return state;
  }
}

// @ts-ignore
export const RunContext = createContext();

export function RunProvider({ children }) {
  const [state, dispatch] = useReducer(runReducer, initialState);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (state.isRunning) {
      const interval = setInterval(() => {
        setSeconds(prev => prev + 1);
        console.log(seconds);
      }, 1000);

      return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
    } else {
      setSeconds(0);
    }
  }, [state]);

  return (
    <>
      <RunContext.Provider
        value={{
          isRunning: state.isRunning,
          seconds: seconds,
          startTime: state.startTime,
          endTime: state.endTime,
          dispatch,
        }}
      >
        {children}
      </RunContext.Provider>
    </>
  );
}
