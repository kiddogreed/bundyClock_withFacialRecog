import { useState } from 'react'
import {
  Container, Typography, Box, TextField, Button,
  Grid, Card, CardContent, Alert, CircularProgress, Divider,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import WebcamCapture from '../components/WebcamCapture'
import { createEmployee } from '../api/employees'
import { registerFace } from '../api/face'
import { useAppContext } from '../context/AppContext'

const EMPTY_FORM = { name: '', employeeCode: '', department: '', email: '' }

export default function EmployeeRegistration() {
  const { showSnackbar } = useAppContext()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [faceBlob, setFaceBlob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const empRes = await createEmployee(form)
      const employeeId = empRes.data.data.id

      if (faceBlob) {
        await registerFace(employeeId, faceBlob)
        showSnackbar('Employee and face registered successfully!', 'success')
      } else {
        showSnackbar('Employee registered (no face image)', 'success')
      }
      navigate('/employees')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.')
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
