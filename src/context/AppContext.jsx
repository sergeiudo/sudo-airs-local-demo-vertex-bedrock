import React, { createContext, useContext, useReducer } from 'react'

const AppContext = createContext(null)

const initialState = {
  isProtected: false,
  activeView: 'home',
  scmUrl: null,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_PROTECTION':
      return { ...state, isProtected: !state.isProtected }
    case 'SET_VIEW':
      return { ...state, activeView: action.payload }
    case 'SET_SCM_URL':
      return { ...state, scmUrl: action.payload }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
