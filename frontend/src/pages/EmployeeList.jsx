import { useEffect, useState } from 'react'
import {
  Container, Grid, Typography, Button, Box,
  CircularProgress, Alert, TextField, InputAdornment, Pagination,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'
import EmployeeCard from '../components/EmployeeCard'
import { getEmployees, deleteEmployee } from '../api/employees'
import { getErrorMessage } from '../api/axiosClient'
import { useAppContext } from '../context/AppContext'

const PAGE_SIZE = 12

export default function EmployeeList() {
  const { showSnackbar } = useAppContext()
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)          // 0-based (Spring)
  const [totalPages, setTotalPages] = useState(1)

  const fetchEmployees = async (currentPage = page) => {
    setLoading(true)
    try {
      const res = await getEmployees(currentPage, PAGE_SIZE)
      const pageData = res.data.data
      setEmployees(pageData.content)
      setFiltered(pageData.content)
      setTotalPages(pageData.totalPages || 1)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load employees.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmployees(page) }, [page])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(employees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q)
    ))
  }, [search, employees])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return
    try {
      await deleteEmployee(id)
      showSnackbar('Employee deleted', 'success')
      fetchEmployees(page)
    } catch {
      showSnackbar('Delete failed', 'error')
    }
  }

  const handlePageChange = (_, value) => {
    setSearch('')
    setPage(value - 1)  // MUI Pagination is 1-based; Spring is 0-based
  }

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Employees</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/employees/register')}
        >
          Add Employee
        </Button>
      </Box>

      <TextField
        placeholder="Search by name or code on this page…"
        fullWidth
        size="small"
        sx={{ mb: 3 }}
        value={search}
        onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        {filtered.map(emp => (
          <Grid item xs={12} sm={6} md={4} key={emp.id}>
            <EmployeeCard employee={emp} onDelete={handleDelete} />
          </Grid>
        ))}
        {filtered.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" textAlign="center">No employees found.</Typography>
          </Grid>
        )}
      </Grid>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Container>
  )
}
