import { useState, useEffect, useRef } from 'react'
import {
  Container, Typography, Box, Card, CardContent,
  Alert, CircularProgress, Button, Chip, Avatar, Divider,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FaceIcon from '@mui/icons-material/Face'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonIcon from '@mui/icons-material/Person'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import { useNavigate, useParams } from 'react-router-dom'
import WebcamCapture from '../components/WebcamCapture'
import { getEmployee, uploadEmployeePhoto } from '../api/employees'
import { registerFace } from '../api/face'
import { getErrorMessage } from '../api/axiosClient'
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
  // autoActive controls whether auto-capture countdown is running
  const [autoActive, setAutoActive] = useState(true)
  const lastBlobRef = useRef(null)

  useEffect(() => {
    getEmployee(id)
      .then(res => setEmployee(res.data.data))
      .catch(() => setFetchError('Employee not found.'))
      .finally(() => setLoadingEmployee(false))
  }, [id])

  const handleCapture = async (blob) => {
    lastBlobRef.current = blob
    setStatus('uploading')
    setErrorMsg('')
    try {
      await registerFace(id, blob)
      // Stop auto-capture immediately on success
      setAutoActive(false)
      setStatus('success')
      setRegistrationCount(c => c + 1)
      showSnackbar(`Face registered for ${employee?.name}!`, 'success')

      // Automatically set the captured image as profile photo
      try {
        const photoRes = await uploadEmployeePhoto(id, blob)
        setEmployee(photoRes.data.data)  // updates photoUrl so avatar refreshes immediately
        showSnackbar('Profile photo updated from captured image', 'success')
      } catch {
        // Non-critical — face was registered, photo update is best-effort
      }
    } catch (err) {
      setStatus('error')
      const msg = err.friendlyMessage
        ?? (err.code === 'ECONNABORTED'
          ? 'Request timed out — face service is busy, please try again.'
          : (err.response?.data?.message ?? 'Registration failed — no face detected or service unavailable.'))
      setErrorMsg(msg)
    }
  }

  const handleRetake = () => {
    setStatus('idle')
    setErrorMsg('')
  }

  // "Capture Another" — re-enables auto-capture countdown
  const handleCaptureAnother = () => {
    setStatus('idle')
    setErrorMsg('')
    setAutoActive(true)
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

  const avatarSrc = employee.photoUrl ? `http://localhost:8080${employee.photoUrl}` : null

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
            <Avatar
              src={avatarSrc}
              sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}
            >
              {!avatarSrc && <PersonIcon />}
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
            {autoActive
              ? 'Position the employee\'s face clearly in the frame — it will be captured automatically.'
              : 'Face captured and set as profile photo. Click "Capture Another" to add more angles.'}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <WebcamCapture
            onCapture={handleCapture}
            onRetake={handleRetake}
            loading={status === 'uploading'}
            status={status}
            autoCapture={autoActive}
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
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 1.5 }}>
                Face registered and set as profile photo!
              </Alert>
            )}
            {status === 'error' && (
              <Alert severity="error">{errorMsg}</Alert>
            )}

            {/* Show Capture Another only after stopping */}
            {!autoActive && status !== 'uploading' && (
              <Box display="flex" justifyContent="center" mt={1.5}>
                <Button
                  variant="outlined"
                  startIcon={<CameraAltIcon />}
                  onClick={handleCaptureAnother}
                >
                  Capture Another
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}
