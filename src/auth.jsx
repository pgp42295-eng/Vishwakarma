import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, profile: null })

  const refresh = useCallback(async () => {
    try {
      const user = await api.getUser()
      const profile = user ? await api.getMyProfile() : null
      setState({ loading: false, user, profile })
    } catch {
      setState({ loading: false, user: null, profile: null })
    }
  }, [])

  useEffect(() => {
    refresh()
    return api.onAuthChange(refresh)
  }, [refresh])

  return <AuthCtx.Provider value={{ ...state, refresh }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)

// Toasts (no browser alerts)
const ToastCtx = createContext(() => {})
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((msg, kind = 'ok') => {
    const id = Math.random()
    setToasts((t) => [...t, { id, msg, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex w-[calc(100%-3rem)] max-w-sm flex-col gap-2 no-print">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${t.kind === 'err' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)
