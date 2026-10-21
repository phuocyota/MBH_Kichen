import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import http, { AUTH_KEY, readSession } from '../api/httpClient'
import { AuthContext, useAuth } from './authContext'
export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const [branchId, setBranch] = useState(
    () =>
      readSession()?.branchId || sessionStorage.getItem('kitchen_branch') || '',
  )
  useEffect(() => {
    const expired = () => {
      setSession(null)
      setBranch('')
    }
    window.addEventListener('kitchen:session-expired', expired)
    return () => window.removeEventListener('kitchen:session-expired', expired)
  }, [])
  async function login(email, password, role) {
    const data = await http.post(
      `/auth/login/${role === 'KITCHEN' ? 'kitchen' : 'admin'}`,
      { email, password },
    )
    if (
      !['CASHIER','KITCHEN', 'MANAGER', 'ADMIN'].includes(data?.userType) ||
      !data.accessToken
    )
      throw new Error('Tài khoản không có quyền vào portal bếp')
    if (data.userType !== 'ADMIN' && !data.branchId)
      throw new Error('Tài khoản chưa được gắn chi nhánh làm việc')
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(data))
    setSession(data)
    setBranch(data.branchId || '')
  }
  function logout() {
    sessionStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem('kitchen_branch')
    setSession(null)
    setBranch('')
  }
  function selectBranch(id) {
    if (session.userType !== 'ADMIN') return
    sessionStorage.setItem('kitchen_branch', id)
    setBranch(id)
  }
  return (
    <AuthContext.Provider
      value={{
        session,
        branchId,
        selectBranch,
        login,
        logout,
        manager: ['ADMIN', 'MANAGER'].includes(session?.userType),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
export function ProtectedRoute() {
  const { session } = useAuth()
  return session ? <Outlet /> : <Navigate to="/login" replace />
}
