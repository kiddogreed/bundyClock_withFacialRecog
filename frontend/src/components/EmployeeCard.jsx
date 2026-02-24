import {
  Card, CardContent, CardActions,
  Typography, Button, Chip, Avatar, Box,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import FaceIcon from '@mui/icons-material/Face'
import { useNavigate } from 'react-router-dom'

/**
 * EmployeeCard — displays a summary of an employee.
 *
 * Props:
 *   employee: { id, name, employeeCode, department, email }
 *   onDelete?(id: string): void
 */
export default function EmployeeCard({ employee, onDelete }) {
  const navigate = useNavigate()

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" lineHeight={1.2}>{employee.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {employee.employeeCode}
            </Typography>
          </Box>
        </Box>
        {employee.department && (
          <Chip label={employee.department} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
        )}
        {employee.email && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {employee.email}
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => navigate(`/employees/${employee.id}`)}>
          View
        </Button>
        <Button
          size="small"
          color="primary"
          startIcon={<FaceIcon />}
          onClick={() => navigate(`/employees/${employee.id}/register-face`)}
        >
          Register Face
        </Button>
        {onDelete && (
          <Button size="small" color="error" onClick={() => onDelete(employee.id)}>
            Delete
          </Button>
        )}
      </CardActions>
    </Card>
  )
}
