import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Card, CardContent,
  Alert, CircularProgress, Button, Chip, Avatar, Divider,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FaceIcon from '@mui/icons-material/Face'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonIcon from '@mui/icons-material/Person'
import { useNavigate, useParams } from 'react-router-dom'
import WebcamCapture from '../components/WebcamCapture'
import { getEmployee } from '../api/employees'
import { registerFace } from '../api/face'
import { useAppContext } from '../context/AppContext'

// status: 'idle' | 'uploading' | 'success' | 'error'
export default function FaceRegistration() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSnackbar } = useAppContext()

  const [employee, setEmployee] = useState(null)
  const [loadingEmployee, setLoadingEmployee] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [registrationCount, setRegistrationCount] = useState(0)

  useEffect(() => {
    getEmployee(id)
      .then(res => setEmployee(res.data.data))
      .catch(() => setFetchError('Employee not found.'))
      .finally(() => setLoadingEmployee(false))
  }, [id])

  const handleCapture = async (blob) => {
    setStatus('uploading')
    setErrorMsg('')
    try {
      await registerFace(id, blob)
      setStatus('success')
      setRegistrationCount(c => c + 1)
      showSnackbar(`Face registered for ${employee?.name}!`, 'success')
    } catch (err) {
      setStatus('error')
      const msg = err.code === 'ECONNABORTED'
        ? 'Request timed out — face service is busy, please try again.'
        : (err.response?.data?.message ?? 'Registration failed — no face detected or service unavailable.')
      setErrorMsg(msg)
    }
  }

  const handleRetake = () => {
    setStatus('idle')
    setErrorMsg('')
  }

  if (loadingEmployee) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    )
  }

  if (fetchError) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="error">{fetchError}</Alert>
        <Button startIcon={<ArrowBackIcon />} sx={{ mt: 2 }} onClick={() => navigate('/employees')}>
          Back to Employees
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/employees')}
        sx={{ mb: 2 }}
      >
        Back to Employees
      </Button>

      <Typography variant="h5" fontWeight={700} mb={3}>
        <FaceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Face Registration
      </Typography>

      {/* Employee Info */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" lineHeight={1.2}>{employee.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {employee.employeeCode}
                {employee.department ? ` · ${employee.department}` : ''}
              </Typography>
            </Box>
            {registrationCount > 0 && (
              <Chip
                icon={<CheckCircleIcon />}
                label={`${registrationCount} face${registrationCount > 1 ? 's' : ''} registered`}
                color="success"
                size="small"
                sx={{ ml: 'auto' }}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Camera */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            Capture Face Image
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Position the employee's face clearly in the frame — it will be captured automatically.
            Register multiple photos to improve recognition accuracy.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <WebcamCapture
            onCapture={handleCapture}
            onRetake={handleRetake}
            loading={status === 'uploading'}
            status={status}
            autoCapture
          />

          {/* Status feedback */}
          <Box mt={2}>
            {status === 'uploading' && (
              <Box display="flex" alignItems="center" gap={1.5}>
                <CircularProgress size={20} />
                <Typography variant="body2">Uploading and processing face…</Typography>
              </Box>
            )}
            {status === 'success' && (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Face registered successfully! Capture another photo to improve accuracy, or go back.
              </Alert>
            )}
            {status === 'error' && (
              <Alert severity="error">{errorMsg}</Alert>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}
