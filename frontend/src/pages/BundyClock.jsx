import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Card, CardContent, Grid,
  Button, Alert, CircularProgress, Chip, Select, MenuItem,
  FormControl, InputLabel, Divider,
} from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import WebcamCapture from '../components/WebcamCapture'
import { timeIn, timeOut } from '../api/attendance'
import { getEmployees } from '../api/employees'
import { useAppContext } from '../context/AppContext'

export default function BundyClock() {
  const { showSnackbar } = useAppContext()
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [capturedBlob, setCapturedBlob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastAction, setLastAction] = useState(null)
  const [now, setNow] = useState(new Date())

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    getEmployees()
      .then(res => setEmployees(res.data.data))
      .catch(() => {})
  }, [])

  const handleAction = async (type) => {
    if (!selectedEmployee) {
      showSnackbar('Please select an employee first', 'warning')
      return
    }
    setLoading(true)
    try {
      const fn = type === 'TIME_IN' ? timeIn : timeOut
      const res = await fn(selectedEmployee, capturedBlob)
      setLastAction({ type, log: res.data.data, time: new Date() })
      showSnackbar(`${type === 'TIME_IN' ? 'Time-In' : 'Time-Out'} recorded successfully!`, 'success')
      setCapturedBlob(null)
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Action failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Clock Display */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h2" fontWeight={700} letterSpacing={2}>
          {now.toLocaleTimeString()}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Camera + Employee Selector */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Camera</Typography>
              <WebcamCapture onCapture={setCapturedBlob} loading={loading} />
            </CardContent>
          </Card>
        </Grid>

        {/* Action Panel */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Attendance Action</Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Select Employee"
                  onChange={e => setSelectedEmployee(e.target.value)}
                >
                  {employees.map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}
                onClick={() => handleAction('TIME_IN')}
                disabled={loading}
                sx={{ mb: 1 }}
              >
                Time In
              </Button>

              <Button
                fullWidth
                variant="contained"
                color="error"
                size="large"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LogoutIcon />}
                onClick={() => handleAction('TIME_OUT')}
                disabled={loading}
              >
                Time Out
              </Button>

              {capturedBlob && (
                <Alert severity="info" sx={{ mt: 2 }}>Face image ready</Alert>
              )}

              {lastAction && (
                <Box mt={2}>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="caption" color="text.secondary">Last Action</Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Chip
                      label={lastAction.type}
                      color={lastAction.type === 'TIME_IN' ? 'success' : 'error'}
                      size="small"
                    />
                    <Typography variant="body2">
                      {lastAction.time.toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
