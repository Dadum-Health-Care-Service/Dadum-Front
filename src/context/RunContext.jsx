import { createContext, useEffect, useReducer, useState, useContext } from 'react';

const initialState = {
  isRunning: false,
  setId: null,
  startTime: null,
  endTime: null,
};

function runReducer(state, action) {
  switch (action.type) {
    case 'RUN':
      const start = Date.now();
      return { ...state, setId: action.setId, isRunning: true, startTime: start };
    case 'COMPLETE':
      const end = Date.now();
      return { ...state, setId: action.setId, isRunning: false, endTime: end };
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
      }, 1000);

      return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
    } else {
      setSeconds(0);
    }
  }, [state]);
  const useRun = (setId) => {
    dispatch({ type: 'RUN', setId: setId });
  };
  const useStop = () => {
    setSeconds(0);
    dispatch({ type: 'COMPLETE' });
  };
  const value = {
    useRun,
    useStop,
    isRunning: state.isRunning,
    seconds: seconds,
    setId: state.setId,
  }

  return (
    <>
      <RunContext.Provider
        value={
          value
        }
      >
        {children}
      </RunContext.Provider>
    </>
  );
}
