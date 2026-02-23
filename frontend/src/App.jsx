import { Routes, Route, Navigate } from 'react-router-dom'
import NavigationBar from './components/NavigationBar'
import Login from './pages/Login'
import EmployeeList from './pages/EmployeeList'
import EmployeeRegistration from './pages/EmployeeRegistration'
import BundyClock from './pages/BundyClock'
import AttendanceLogs from './pages/AttendanceLogs'
import { useAppContext } from './context/AppContext'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAppContext()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { isAuthenticated } = useAppContext()

  return (
    <>
      {isAuthenticated && <NavigationBar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><BundyClock /></PrivateRoute>} />
        <Route path="/employees" element={<PrivateRoute><EmployeeList /></PrivateRoute>} />
        <Route path="/employees/register" element={<PrivateRoute><EmployeeRegistration /></PrivateRoute>} />
        <Route path="/attendance" element={<PrivateRoute><AttendanceLogs /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
