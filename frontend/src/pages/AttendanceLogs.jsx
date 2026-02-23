import { useEffect, useState } from 'react'
import {
  Container, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip,
  CircularProgress, Alert, TextField, Select, MenuItem,
  FormControl, InputLabel, Stack, Button,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { getAllLogs } from '../api/attendance'

const TYPE_COLOR = { TIME_IN: 'success', TIME_OUT: 'error' }

export default function AttendanceLogs() {
  const [logs, setLogs] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await getAllLogs()
      setLogs(res.data.data)
    } catch {
      setError('Failed to load attendance logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  useEffect(() => {
    let result = [...logs]
    if (typeFilter !== 'ALL') {
      result = result.filter(l => l.type === typeFilter)
    }
    if (dateFilter) {
      result = result.filter(l =>
        new Date(l.timestamp).toLocaleDateString() === new Date(dateFilter).toLocaleDateString()
      )
    }
    setFiltered(result)
  }, [logs, typeFilter, dateFilter])

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Attendance Logs</Typography>
        <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchLogs}>
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Stack direction="row" spacing={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="TIME_IN">Time In</MenuItem>
            <MenuItem value="TIME_OUT">Time Out</MenuItem>
          </Select>
        </FormControl>
        <TextField
          type="date"
          size="small"
          label="Date"
          InputLabelProps={{ shrink: true }}
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Employee ID</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Timestamp</strong></TableCell>
              <TableCell><strong>Confidence</strong></TableCell>
              <TableCell><strong>Verified</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(log => (
              <TableRow key={log.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {log.employeeId}
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.type}
                    color={TYPE_COLOR[log.type] ?? 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  {log.confidenceScore != null
                    ? `${(log.confidenceScore * 100).toFixed(1)}%`
                    : '—'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.verified ? 'Yes' : 'No'}
                    color={log.verified ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No records found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  )
}
