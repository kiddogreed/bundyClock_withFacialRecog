import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Avatar, Box, Button, Card, CardContent, CircularProgress,
  Container, Divider, Grid, IconButton, TextField, Tooltip,
  Typography, Alert, Chip, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import FaceIcon from '@mui/icons-material/Face'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleIcon from '@mui/icons-material/Schedule'
import { getEmployee, updateEmployee, uploadEmployeePhoto } from '../api/employees'
import { getShifts } from '../api/shifts'
import { getFaceStatus } from '../api/face'
import { getErrorMessage } from '../api/axiosClient'
import { useAppContext } from '../context/AppContext'

export default function EmployeeProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSnackbar } = useAppContext()
  const photoInputRef = useRef(null)

  const [employee, setEmployee] = useState(null)
  const [form, setForm] = useState({
    name: '', employeeCode: '', department: '', email: '',
    shiftScheduleId: null, customShiftStart: '', customShiftEnd: '',
    _shiftSelectValue: '',
  })
  const [editing, setEditing] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPhoto, setSavingPhoto] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoBlob, setPhotoBlob] = useState(null)
  const [faceStatus, setFaceStatus] = useState(null)
  const [shifts, setShifts] = useState([])

  /** Returns the display label for the employee's current shift. */
  const shiftLabel = (emp) => {
    if (!emp) return null
    if (emp.shiftScheduleId) {
      const s = shifts.find(x => x.id === emp.shiftScheduleId)
      return s ? `${s.name} (${s.startTime} – ${s.endTime})` : emp.shiftScheduleId
    }
    if (emp.customShiftStart && emp.customShiftEnd) {
      return `Custom: ${emp.customShiftStart} – ${emp.customShiftEnd}`
    }
    return 'No shift assigned'
  }

  const fetchEmployee = async () => {
    try {
      const res = await getEmployee(id)
      const emp = res.data.data
      setEmployee(emp)
      const selectValue = emp.shiftScheduleId
        ? emp.shiftScheduleId
        : (emp.customShiftStart ? 'CUSTOM' : '')
      setForm({
        name: emp.name ?? '',
        employeeCode: emp.employeeCode ?? '',
        department: emp.department ?? '',
        email: emp.email ?? '',
        shiftScheduleId: emp.shiftScheduleId ?? null,
        customShiftStart: emp.customShiftStart?.slice(0, 5) ?? '',
        customShiftEnd:   emp.customShiftEnd?.slice(0, 5) ?? '',
        _shiftSelectValue: selectValue,
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load employee details.'))
    } finally {
      setLoading(false)
    }
  }

  const fetchFaceStatus = async () => {
    try {
      const res = await getFaceStatus(id)
      setFaceStatus(res.data.data)
    } catch {
      // non-critical — silently ignore
    }
  }

  useEffect(() => {
    fetchEmployee()
    fetchFaceStatus()
    getShifts()
      .then(res => setShifts(res.data.data ?? []))
      .catch(() => {/* non-critical */})
  }, [id])

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleShiftChange = (e) => {
    const val = e.target.value
    setForm(prev => ({
      ...prev,
      shiftScheduleId: val === 'CUSTOM' || val === '' ? null : val,
      customShiftStart: val === 'CUSTOM' ? prev.customShiftStart : '',
      customShiftEnd:   val === 'CUSTOM' ? prev.customShiftEnd   : '',
      _shiftSelectValue: val,
    }))
  }

  const isCustomShift = form._shiftSelectValue === 'CUSTOM'

  const handleSaveInfo = async () => {
    setSavingInfo(true)
    try {
      const payload = {
        name: form.name,
        employeeCode: form.employeeCode,
        department: form.department,
        email: form.email,
        shiftScheduleId: form.shiftScheduleId ?? null,
        customShiftStart: isCustomShift ? (form.customShiftStart || null) : null,
        customShiftEnd:   isCustomShift ? (form.customShiftEnd   || null) : null,
      }
      const res = await updateEmployee(id, payload)
      setEmployee(res.data.data)
      setEditing(false)
      showSnackbar('Employee details updated', 'success')
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Update failed', 'error')
    } finally {
      setSavingInfo(false)
    }
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoBlob(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSavePhoto = async () => {
    if (!photoBlob) return
    setSavingPhoto(true)
    try {
      const res = await uploadEmployeePhoto(id, photoBlob)
      setEmployee(res.data.data)
      setPhotoBlob(null)
      showSnackbar('Profile photo updated', 'success')
    } catch {
      showSnackbar('Photo upload failed', 'error')
    } finally {
      setSavingPhoto(false)
    }
  }

  const avatarSrc = photoPreview ?? (employee?.photoUrl ? `http://localhost:8080${employee.photoUrl}` : null)
  const avatarLabel = employee?.name?.charAt(0)?.toUpperCase() ?? '?'

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} startIcon={<ArrowBackIcon />} onClick={() => navigate('/employees')}>
          Back
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <IconButton onClick={() => navigate('/employees')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>Employee Profile</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* ── Photo Card ── */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} alignSelf="flex-start">
                Profile Photo
              </Typography>

              {/* Avatar with hover-to-change overlay */}
              <Box
                sx={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => photoInputRef.current?.click()}
              >
                <Avatar
                  src={avatarSrc}
                  sx={{ width: 120, height: 120, fontSize: 48, bgcolor: 'primary.main' }}
                >
                  {!avatarSrc && avatarLabel}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    bgcolor: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s',
                    '&:hover': { opacity: 1 },
                  }}
                >
                  <Tooltip title="Change photo">
                    <CameraAltIcon sx={{ color: 'white', fontSize: 32 }} />
                  </Tooltip>
                </Box>
              </Box>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoSelect}
              />

              <Typography variant="caption" color="text.secondary" textAlign="center">
                Click the photo to select a new image
              </Typography>

              {photoBlob && (
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  startIcon={savingPhoto ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  disabled={savingPhoto}
                  onClick={handleSavePhoto}
                >
                  {savingPhoto ? 'Uploading…' : 'Save Photo'}
                </Button>
              )}

              <Divider flexItem />

              {/* Employee metadata */}
              <Box width="100%">
                {employee.department && (
                  <Chip label={employee.department} size="small" sx={{ mb: 1 }} />
                )}
                <Typography variant="caption" color="text.secondary" display="block">
                  Code: <strong>{employee.employeeCode}</strong>
                </Typography>
                {employee.createdAt && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Joined: {new Date(employee.createdAt).toLocaleDateString()}
                  </Typography>
                )}
              </Box>

              <Divider flexItem />

              {/* Face registration status */}
              <Box width="100%">
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  Face Registration
                </Typography>
                {faceStatus ? (
                  faceStatus.registered ? (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="caption" color="success.main">
                        {faceStatus.embeddingCount} photo{faceStatus.embeddingCount !== 1 ? 's' : ''} registered
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.disabled">Not yet registered</Typography>
                  )
                ) : (
                  <Typography variant="caption" color="text.disabled">Loading…</Typography>
                )}
              </Box>

              <Divider flexItem />

              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<FaceIcon />}
                onClick={() => navigate(`/employees/${id}/register-face`)}
              >
                Register Face
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Details Card ── */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Employee Information
                </Typography>
                {!editing && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Full Name"
                    name="name"
                    fullWidth
                    value={form.name}
                    onChange={handleChange}
                    disabled={!editing}
                    variant={editing ? 'outlined' : 'filled'}
                    InputProps={{ readOnly: !editing }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Employee Code"
                    name="employeeCode"
                    fullWidth
                    value={form.employeeCode}
                    onChange={handleChange}
                    disabled={!editing}
                    variant={editing ? 'outlined' : 'filled'}
                    InputProps={{ readOnly: !editing }}
                    helperText={editing ? 'Must be unique' : ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Department"
                    name="department"
                    fullWidth
                    value={form.department}
                    onChange={handleChange}
                    disabled={!editing}
                    variant={editing ? 'outlined' : 'filled'}
                    InputProps={{ readOnly: !editing }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    fullWidth
                    value={form.email}
                    onChange={handleChange}
                    disabled={!editing}
                    variant={editing ? 'outlined' : 'filled'}
                    InputProps={{ readOnly: !editing }}
                  />
                </Grid>

                {/* Shift Schedule */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight={600}>Shift Schedule</Typography>
                  </Box>

                  {!editing ? (
                    <Typography variant="body2" color="text.secondary">
                      {shiftLabel(employee)}
                    </Typography>
                  ) : (
                    <Grid container spacing={2}>
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
                              value={form.customShiftEnd}
                              onChange={handleChange}
                              InputLabelProps={{ shrink: true }}
                              inputProps={{ step: 300 }}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {editing && (
                <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditing(false)
                      const selectValue = employee.shiftScheduleId
                        ? employee.shiftScheduleId
                        : (employee.customShiftStart ? 'CUSTOM' : '')
                      setForm({
                        name: employee.name ?? '',
                        employeeCode: employee.employeeCode ?? '',
                        department: employee.department ?? '',
                        email: employee.email ?? '',
                        shiftScheduleId: employee.shiftScheduleId ?? null,
                        customShiftStart: employee.customShiftStart?.slice(0, 5) ?? '',
                        customShiftEnd:   employee.customShiftEnd?.slice(0, 5) ?? '',
                        _shiftSelectValue: selectValue,
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={savingInfo ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    disabled={savingInfo}
                    onClick={handleSaveInfo}
                  >
                    {savingInfo ? 'Saving…' : 'Save Changes'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
