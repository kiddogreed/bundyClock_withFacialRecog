import { useState } from 'react'
import {
  Box, Card, CardContent, TextField, Button,
  Typography, CircularProgress, Alert,
} from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api/auth'
import { useAppContext } from '../context/AppContext'

export default function Login() {
  const { login } = useAppContext()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi(form)
      const { token, role } = res.data.data
      login({ username: form.username, role }, token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="grey.100"
    >
      <Card sx={{ width: 360, p: 2 }}>
        <CardContent>
          <Box textAlign="center" mb={3}>
            <AccessTimeIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h5" fontWeight={700}>BundyClock</Typography>
            <Typography variant="body2" color="text.secondary">
              Time Attendance System
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Username"
              name="username"
              fullWidth
              required
              margin="normal"
              value={form.username}
              onChange={handleChange}
              autoFocus
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              fullWidth
              required
              margin="normal"
              value={form.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
