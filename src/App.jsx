import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, ToastProvider, useAuth } from './auth'
import { Spinner } from './components/ui'
import Login from './pages/Login'
import Profile from './pages/Profile'
import StudentHome from './pages/StudentHome'
import NewRequest from './pages/NewRequest'
import RequestDetail from './pages/RequestDetail'
import AdminDashboard from './pages/AdminDashboard'
import AdminRequest from './pages/AdminRequest'
import AdminWorkers from './pages/AdminWorkers'
import JobSheet from './pages/JobSheet'

// Route guard: signed in? right role? profile complete?
function Gate({ role, children }) {
  const { loading, user, profile } = useAuth()
  if (loading) return <Spinner />
  if (!user || !profile) return <Navigate to="/login" replace />
  if (role === 'admin' && profile.role !== 'admin') return <Navigate to="/" replace />
  if (role === 'student') {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    if (!profile.hostel || !profile.room || !profile.phone) return <Profile firstTime />
  }
  return children
}

function LoginRoute() {
  const { loading, user, profile } = useAuth()
  if (loading) return <Spinner />
  if (user && profile) return <Navigate to={profile.role === 'admin' ? '/admin' : '/'} replace />
  return <Login />
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/" element={<Gate role="student"><StudentHome /></Gate>} />
            <Route path="/new" element={<Gate role="student"><NewRequest /></Gate>} />
            <Route path="/r/:id" element={<Gate role="student"><RequestDetail /></Gate>} />
            <Route path="/profile" element={<Gate role="student"><Profile /></Gate>} />
            <Route path="/admin" element={<Gate role="admin"><AdminDashboard /></Gate>} />
            <Route path="/admin/r/:id" element={<Gate role="admin"><AdminRequest /></Gate>} />
            <Route path="/admin/workers" element={<Gate role="admin"><AdminWorkers /></Gate>} />
            <Route path="/admin/sheet" element={<Gate role="admin"><JobSheet /></Gate>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
