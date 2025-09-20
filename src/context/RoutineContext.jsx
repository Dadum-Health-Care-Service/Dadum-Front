import { createContext, useReducer } from 'react';

const initialState = {
  routine:
    localStorage.getItem('routine') == 'undefined'
      ? null
      : JSON.parse(localStorage.getItem('routine')) || null,
  originRoutine:
    localStorage.getItem('originRoutine') == 'undefined'
      ? null
      : JSON.parse(localStorage.getItem('originRoutine')) || null,
};

function routineReducer(state, action) {
  switch (action.type) {
    case 'SAVE':
      localStorage.setItem('routine', JSON.stringify(action.routine));
      localStorage.setItem('originRoutine', JSON.stringify(action.originRoutine));
      return { ...state, routine: action.routine, originRoutine: action.originRoutine };
    default:
      return state;
  }
}


// @ts-ignore
export const RoutineContext = createContext();

export function RoutineProvider({ children }) {
  const [state, dispatch] = useReducer(routineReducer, initialState);

  return (
    <>
      <RoutineContext.Provider
        value={{ routine: state.routine, originRoutine: state.originRoutine, dispatch }}
      >
        {children}
      </RoutineContext.Provider>
    </>
  );
}