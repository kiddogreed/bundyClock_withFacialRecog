import { useEffect, useState } from 'react'
import {
  Container, Typography, Box, TextField, Button,
  Grid, Card, CardContent, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import WebcamCapture from '../components/WebcamCapture'
import { createEmployee, uploadEmployeePhoto } from '../api/employees'
import { registerFace } from '../api/face'
import { getShifts } from '../api/shifts'
import { getErrorMessage } from '../api/axiosClient'
import { useAppContext } from '../context/AppContext'

const EMPTY_FORM = {
  name: '', employeeCode: '', department: '', email: '',
  shiftScheduleId: '',
  customShiftStart: '', customShiftEnd: '',
}

export default function EmployeeRegistration() {
  const { showSnackbar } = useAppContext()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [faceBlob, setFaceBlob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shifts, setShifts] = useState([])

  useEffect(() => {
    getShifts()
      .then(res => setShifts(res.data.data ?? []))
      .catch(() => {/* non-critical */})
  }, [])

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleShiftChange = (e) => {
    const val = e.target.value
    setForm(prev => ({
      ...prev,
      shiftScheduleId: val === 'CUSTOM' ? '' : val,
      // clear custom times when switching to a predefined shift
      customShiftStart: val === 'CUSTOM' ? prev.customShiftStart : '',
      customShiftEnd:   val === 'CUSTOM' ? prev.customShiftEnd   : '',
      _shiftSelectValue: val,            // track dropdown selection including CUSTOM sentinel
    }))
  }

  const isCustomShift = form._shiftSelectValue === 'CUSTOM'

  const buildPayload = () => {
    const payload = {
      name: form.name,
      employeeCode: form.employeeCode,
      department: form.department,
      email: form.email,
      shiftScheduleId: form.shiftScheduleId || null,
      customShiftStart: isCustomShift ? (form.customShiftStart || null) : null,
      customShiftEnd:   isCustomShift ? (form.customShiftEnd   || null) : null,
    }
    return payload
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const empRes = await createEmployee(buildPayload())
      const employeeId = empRes.data.data.id

      if (faceBlob) {
        await Promise.all([
          registerFace(employeeId, faceBlob),
          uploadEmployeePhoto(employeeId, faceBlob),
        ])
        showSnackbar('Employee and face registered successfully!', 'success')
      } else {
        showSnackbar('Employee registered (no face image)', 'success')
      }
      navigate('/employees')
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>Register New Employee</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Employee Info */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Employee Information
                </Typography>
                <TextField label="Full Name" name="name" fullWidth required
                  margin="dense" value={form.name} onChange={handleChange} />
                <TextField label="Employee Code" name="employeeCode" fullWidth required
                  margin="dense" value={form.employeeCode} onChange={handleChange} />
                <TextField label="Department" name="department" fullWidth
                  margin="dense" value={form.department} onChange={handleChange} />
                <TextField label="Email" name="email" type="email" fullWidth
                  margin="dense" value={form.email} onChange={handleChange} />
              </CardContent>
            </Card>
          </Grid>

          {/* Face Capture */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Face Registration (Optional)
                </Typography>
                <WebcamCapture onCapture={setFaceBlob} loading={loading} />
                {faceBlob && (
                  <Alert severity="success" sx={{ mt: 1 }}>Face image captured</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Shift Schedule */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Shift Schedule
                </Typography>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Shift</InputLabel>
                      <Select
                        label="Shift"
                        value={form._shiftSelectValue ?? ''}
                        onChange={handleShiftChange}
                      >
                        <MenuItem value=""><em>No shift assigned</em></MenuItem>
                        {shifts.map(s => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name} ({s.startTime} – {s.endTime})
                          </MenuItem>
                        ))}
                        <MenuItem value="CUSTOM">Custom shift…</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {isCustomShift && (
                    <>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Shift Start"
                          name="customShiftStart"
                          type="time"
                          fullWidth
                          size="small"
                          required={isCustomShift}
                          value={form.customShiftStart}
                          onChange={handleChange}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Shift End"
                          name="customShiftEnd"
                          type="time"
                          fullWidth
                          size="small"
                          required={isCustomShift}
                          value={form.customShiftEnd}
                          onChange={handleChange}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>

                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                  Employees can only time in / out within 30 min before shift start and up to 2 hours after shift end.
                  Leave blank to allow attendance at any time.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Submit */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => navigate('/employees')}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {loading ? 'Registering…' : 'Register Employee'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}
