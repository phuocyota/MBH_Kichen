import { createContext, useContext } from 'react'
export const AUTH_KEY = 'kitchen_session'
export const LOGIN_TOAST_KEY = 'kido_canteen_login_toast'
export const AuthContext = createContext(null)
export function useAuth() {
  return useContext(AuthContext)
}
