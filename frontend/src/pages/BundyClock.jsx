import { useState, useEffect, useCallback } from 'react'
import {
  Container, Typography, Box, Card, CardContent, Grid,
  Alert, Button, CircularProgress, Chip, Divider, ToggleButton, ToggleButtonGroup,
} from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FaceIcon from '@mui/icons-material/Face'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import WebcamCapture from '../components/WebcamCapture'
import { timeIn, timeOut } from '../api/attendance'
import { verifyFace } from '../api/face'
import { getEmployees } from '../api/employees'
import { useAppContext } from '../context/AppContext'
import { getErrorMessage } from '../api/axiosClient'

// status: 'idle' | 'verifying' | 'recording' | 'success' | 'error'
export default function BundyClock() {
  const { showSnackbar } = useAppContext()
  const [employees, setEmployees] = useState([])
  const [mode, setMode] = useState('TIME_IN')
  const [status, setStatus] = useState('idle')
  const [matchedEmployee, setMatchedEmployee] = useState(null)
  const [confidence, setConfidence] = useState(null)
  const [lastAction, setLastAction] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [now, setNow] = useState(new Date())
  // autoActive: countdown runs when true, stops permanently after first success
  const [autoActive, setAutoActive] = useState(true)
  // everSucceeded: set to true on first successful time-in/out; never resets — keeps mode manual for the session
  const [everSucceeded, setEverSucceeded] = useState(false)
  // doneMode: locks the toggle button for the mode that already recorded successfully
  const [doneMode, setDoneMode] = useState(null)
  // scanKey: incrementing this remounts WebcamCapture to clear its internal capturedImage state
  const [scanKey, setScanKey] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    getEmployees(0, 200)  // load up to 200 employees for face-matching lookup
      .then(res => setEmployees(res.data.data?.content ?? []))
      .catch(() => {})
  }, [])

  const resetToIdle = useCallback(() => {
    setStatus('idle')
    setMatchedEmployee(null)
    setConfidence(null)
    setErrorMsg('')
  }, [])

  const handleCapture = async (blob) => {
    setStatus('verifying')
    setMatchedEmployee(null)
    setErrorMsg('')

    try {
      // Step 1 — verify face identity
      const verifyRes = await verifyFace(blob)
      const result = verifyRes.data?.data

      // Guard: unexpected response shape from the backend
      if (!result || typeof result.matched === 'undefined') {
        setStatus('error')
        setErrorMsg('Unexpected response from the server. Please try again.')
        console.error('[BundyClock] Unexpected verifyFace response shape:', verifyRes.data)
        return
      }

      if (!result.matched) {
        setStatus('error')
        setErrorMsg(result.message || 'Face not recognized. Please try again.')
        // Errors keep autoActive true so the countdown restarts automatically
        return
      }

      // Step 2 — find employee name from local list
      const emp = employees.find(e => e.id === result.employeeId)
      setMatchedEmployee(emp ?? { id: result.employeeId, name: 'Unknown' })
      setConfidence(result.confidenceScore)
      setStatus('recording')

      // Step 3 — auto time-in / time-out
      const fn = mode === 'TIME_IN' ? timeIn : timeOut
      let attendRes
      try {
        attendRes = await fn(result.employeeId, blob)
      } catch (attendErr) {
        // Attendance errors (409 already recorded, 500, timeout) must stop auto-capture
        // to prevent an infinite retry loop where the same face keeps triggering the same error.
        setAutoActive(false)
        setStatus('error')
        const msg = attendErr.friendlyMessage
          ?? (attendErr.code === 'ECONNABORTED' ? 'Request timed out — server is busy, please try again.' : null)
          ?? attendErr.response?.data?.message
          ?? 'Failed to record attendance. Please try again.'
        setErrorMsg(msg)
        return
      }
      const actionTime = new Date()
      setLastAction({ type: mode, employee: emp, time: actionTime, log: attendRes.data.data })
      setStatus('success')
      // Stop auto-capture permanently and lock the completed mode's toggle button
      setAutoActive(false)
      setEverSucceeded(true)
      setDoneMode(mode)
      showSnackbar(
        `${mode === 'TIME_IN' ? 'Time-In' : 'Time-Out'} recorded for ${emp?.name ?? 'employee'}!`,
        'success'
      )
    } catch (err) {
      // Face verification / network errors — keep autoActive true so the next person can try
      console.error('[BundyClock] Face verification error:', err.message ?? err, err)
      setStatus('error')
      // TypeError (e.g. employees.find is not a function) means a JS bug — surface it clearly
      if (err instanceof TypeError) {
        setErrorMsg(`Internal error: ${err.message}. Please refresh the page.`)
        setAutoActive(false)
        return
      }
      const msg = err.friendlyMessage
        ?? (err.code === 'ECONNABORTED'
          ? 'Face service is taking too long — it may still be loading. Please try again in a moment.'
          : null)
        ?? (typeof err.response?.data === 'object' ? err.response?.data?.message : null)
        ?? 'Face verification failed. Please try again.'
      setErrorMsg(msg)
    }
  }

  // Reset to idle for next scan — stays manual after any success; doneMode lock is permanent
  const handleScanAgain = useCallback(() => {
    resetToIdle()
    // Never re-enable auto-capture once a successful time-in/out has been recorded
    // doneMode intentionally NOT cleared — each mode can only be used once per session
    setScanKey(k => k + 1)  // remount WebcamCapture to clear frozen captured image
  }, [resetToIdle])

  const isProcessing = status === 'verifying' || status === 'recording'

  const isAttendanceError = status === 'error' && !autoActive

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Clock */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h2" fontWeight={700} letterSpacing={2}>
          {now.toLocaleTimeString()}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* Mode Toggle */}
      <Box display="flex" justifyContent="center" mb={3}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, val) => {
            if (val && val !== doneMode) {
              setMode(val)
              resetToIdle()
              // Only allow auto-capture if no successful record exists yet this session
              setAutoActive(!everSucceeded)
              setScanKey(k => k + 1)  // fresh camera on mode switch
            }
          }}
          disabled={isProcessing}
        >
          <ToggleButton value="TIME_IN" sx={{ px: 4 }} disabled={doneMode === 'TIME_IN'}>
            <LoginIcon sx={{ mr: 1 }} /> Time In
          </ToggleButton>
          <ToggleButton value="TIME_OUT" sx={{ px: 4 }} disabled={doneMode === 'TIME_OUT'}>
            <LogoutIcon sx={{ mr: 1 }} /> Time Out
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {/* Camera */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                <FaceIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                {mode === 'TIME_IN' ? 'Time In — Face Scan' : 'Time Out — Face Scan'}
              </Typography>
              <WebcamCapture
                key={scanKey}
                onCapture={handleCapture}
                onRetake={resetToIdle}
                loading={isProcessing}
                status={status}
                autoCapture={autoActive}
              />
              {/* Scan Again button shown after success or after an attendance error (loop-stopped) */}
              {(status === 'success' || isAttendanceError) && !autoActive && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Button
                    variant="outlined"
                    startIcon={<CameraAltIcon />}
                    onClick={handleScanAgain}
                  >
                    Scan Again
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Status Panel */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Status</Typography>

              {status === 'idle' && (
                <Alert severity="info" icon={<FaceIcon />}>
                  Position your face in the frame — it will be captured automatically.
                </Alert>
              )}

              {status === 'verifying' && (
                <Box display="flex" alignItems="center" gap={1.5}>
                  <CircularProgress size={22} />
                  <Typography>Identifying face…</Typography>
                </Box>
              )}

              {status === 'recording' && (
                <Box>
                  <Alert severity="success" sx={{ mb: 1 }}>
                    Face matched — <strong>{matchedEmployee?.name}</strong>
                  </Alert>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <CircularProgress size={22} />
                    <Typography>Recording attendance…</Typography>
                  </Box>
                </Box>
              )}

              {status === 'success' && matchedEmployee && (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  <Typography fontWeight={700}>{matchedEmployee.name}</Typography>
                  <Typography variant="body2">
                    {mode === 'TIME_IN' ? 'Timed In' : 'Timed Out'} at{' '}
                    {lastAction?.time.toLocaleTimeString()}
                  </Typography>
                  {confidence != null && (
                    <Typography variant="caption" display="block" mt={0.5}>
                      Confidence: {(confidence * 100).toFixed(1)}%
                    </Typography>
                  )}
                </Alert>
              )}

              {status === 'error' && (
                <Alert severity="error">{errorMsg}</Alert>
              )}

              {lastAction && (
                <Box mt={2}>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="caption" color="text.secondary">Last Action</Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
                    <Chip
                      label={lastAction.type === 'TIME_IN' ? 'Time In' : 'Time Out'}
                      color={lastAction.type === 'TIME_IN' ? 'success' : 'error'}
                      size="small"
                    />
                    <Typography variant="body2">
                      {lastAction.employee?.name} — {lastAction.time.toLocaleTimeString()}
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
