import {
  AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem,
} from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const NAV_LINKS = [
  { label: 'Bundy Clock', path: '/' },
  { label: 'Employees', path: '/employees' },
  { label: 'Attendance Logs', path: '/attendance' },
]

export default function NavigationBar() {
  const { user, logout } = useAppContext()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <AccessTimeIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ mr: 3 }}>
          BundyClock
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          {NAV_LINKS.map(link => (
            <Button
              key={link.path}
              color="inherit"
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </Button>
          ))}
        </Box>

        <Typography variant="body2" sx={{ mr: 2, opacity: 0.8 }}>
          {user?.username ?? 'Admin'}
        </Typography>
        <Button color="inherit" onClick={handleLogout}>Logout</Button>
      </Toolbar>
    </AppBar>
  )
}
