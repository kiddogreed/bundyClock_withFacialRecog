/**
 * Unit tests for src/api/employees.js
 *
 * The inner axios client is mocked so that no real HTTP requests are made.
 * Each test verifies the correct endpoint, method, and payload.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadEmployeePhoto,
} from './employees'

// ── Mock the shared axios client ──────────────────────────────────────────────
vi.mock('./axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from './axiosClient'

// ── Helpers ───────────────────────────────────────────────────────────────────
const MOCK_ID = 'ae856639-b7c7-43b2-a864-bc3027517011'

const mockEmployee = {
  id: MOCK_ID,
  name: 'Alice Reyes',
  employeeCode: 'EMP-001',
  department: 'Engineering',
  email: 'alice@example.com',
}

const ok = (data) => Promise.resolve({ data: { success: true, data } })

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('employees API', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── getEmployees ─────────────────────────────────────────────────────────
  describe('getEmployees', () => {
    it('calls GET /employees', async () => {
      api.get.mockReturnValue(ok([mockEmployee]))
      await getEmployees()
      expect(api.get).toHaveBeenCalledWith('/employees')
    })

    it('returns the axios response', async () => {
      api.get.mockReturnValue(ok([mockEmployee]))
      const res = await getEmployees()
      expect(res.data.data).toEqual([mockEmployee])
    })
  })

  // ── getEmployee ──────────────────────────────────────────────────────────
  describe('getEmployee', () => {
    it('calls GET /employees/:id with the given id', async () => {
      api.get.mockReturnValue(ok(mockEmployee))
      await getEmployee(MOCK_ID)
      expect(api.get).toHaveBeenCalledWith(`/employees/${MOCK_ID}`)
    })
  })

  // ── createEmployee ───────────────────────────────────────────────────────
  describe('createEmployee', () => {
    it('calls POST /employees with the employee payload', async () => {
      const payload = { name: 'Bob', employeeCode: 'EMP-002', department: 'HR', email: 'b@b.com' }
      api.post.mockReturnValue(ok({ ...payload, id: MOCK_ID }))
      await createEmployee(payload)
      expect(api.post).toHaveBeenCalledWith('/employees', payload)
    })
  })

  // ── updateEmployee ───────────────────────────────────────────────────────
  describe('updateEmployee', () => {
    it('calls PUT /employees/:id with the update payload', async () => {
      const patch = { name: 'Alice Santos', department: 'QA' }
      api.put.mockReturnValue(ok({ ...mockEmployee, ...patch }))
      await updateEmployee(MOCK_ID, patch)
      expect(api.put).toHaveBeenCalledWith(`/employees/${MOCK_ID}`, patch)
    })
  })

  // ── deleteEmployee ───────────────────────────────────────────────────────
  describe('deleteEmployee', () => {
    it('calls DELETE /employees/:id', async () => {
      api.delete.mockReturnValue(ok(null))
      await deleteEmployee(MOCK_ID)
      expect(api.delete).toHaveBeenCalledWith(`/employees/${MOCK_ID}`)
    })
  })

  // ── uploadEmployeePhoto ──────────────────────────────────────────────────
  describe('uploadEmployeePhoto', () => {
    it('calls PATCH /employees/:id/photo', async () => {
      const blob = new Blob(['img-bytes'], { type: 'image/jpeg' })
      api.patch.mockReturnValue(ok({ ...mockEmployee, photoUrl: '/uploads/abc.jpg' }))
      await uploadEmployeePhoto(MOCK_ID, blob)
      expect(api.patch).toHaveBeenCalledWith(
        `/employees/${MOCK_ID}/photo`,
        expect.any(FormData),
        expect.objectContaining({ timeout: 30000 }),
      )
    })

    it('appends the blob as a File named photo.jpg', async () => {
      const blob = new Blob(['img'], { type: 'image/jpeg' })
      api.patch.mockReturnValue(ok({}))
      await uploadEmployeePhoto(MOCK_ID, blob)
      const formData = api.patch.mock.calls[0][1]
      const file = formData.get('photo')
      expect(file).toBeTruthy()
      expect(file.name).toBe('photo.jpg')
    })

    it('does NOT manually set Content-Type (lets axios set multipart boundary)', async () => {
      const blob = new Blob(['img'], { type: 'image/jpeg' })
      api.patch.mockReturnValue(ok({}))
      await uploadEmployeePhoto(MOCK_ID, blob)
      const config = api.patch.mock.calls[0][2]
      // If headers are present, Content-Type must NOT be manually forced
      if (config.headers) {
        expect(config.headers['Content-Type']).toBeUndefined()
      }
    })
  })
})
