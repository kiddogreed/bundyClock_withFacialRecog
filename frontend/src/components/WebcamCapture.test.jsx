/**
 * Unit tests for WebcamCapture component.
 *
 * react-webcam is mocked to avoid requiring real camera hardware.
 * Tests cover rendering, countdown display, error / success state handling,
 * and the auto-capture prop behaviour.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WebcamCapture from './WebcamCapture'

// ── Mock react-webcam (no real camera in JSDOM) ────────────────────────────────
vi.mock('react-webcam', () => ({
  default: vi.fn(({ ref: _ref, ...props }) => (
    <video data-testid="webcam-video" {...props} />
  )),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderCapture(props = {}) {
  return render(
    <WebcamCapture
      onCapture={vi.fn()}
      onRetake={vi.fn()}
      status="idle"
      loading={false}
      autoCapture={false}
      {...props}
    />
  )
}

describe('WebcamCapture', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  // ── Basic rendering ────────────────────────────────────────────────────────
  describe('rendering', () => {
    it('renders the webcam element', () => {
      renderCapture()
      expect(screen.getByTestId('webcam-video')).toBeInTheDocument()
    })

    it('shows the manual Capture button when autoCapture is false', () => {
      renderCapture({ autoCapture: false })
      expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument()
    })

    it('does not show a countdown when autoCapture is false', () => {
      renderCapture({ autoCapture: false })
      expect(screen.queryByText(/auto capture in/i)).not.toBeInTheDocument()
    })

    it('shows a loading spinner when loading prop is true', () => {
      renderCapture({ loading: true })
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  // ── Auto-capture countdown ─────────────────────────────────────────────────
  describe('autoCapture countdown', () => {
    it('shows countdown starting value when autoCapture is true', () => {
      renderCapture({ autoCapture: true, status: 'idle' })
      // Initial countdown is 3
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('counts down each second', () => {
      renderCapture({ autoCapture: true, status: 'idle' })
      act(() => { vi.advanceTimersByTime(1000) })
      expect(screen.getByText('2')).toBeInTheDocument()
      act(() => { vi.advanceTimersByTime(1000) })
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('stops countdown when autoCapture becomes false', () => {
      const { rerender } = renderCapture({ autoCapture: true, status: 'idle' })
      act(() => { vi.advanceTimersByTime(1000) })    // now at 2
      rerender(
        <WebcamCapture
          onCapture={vi.fn()}
          status="idle"
          autoCapture={false}
        />
      )
      // Countdown should be cleared — no number visible
      expect(screen.queryByText('2')).not.toBeInTheDocument()
      expect(screen.queryByText('1')).not.toBeInTheDocument()
    })
  })

  // ── Error / success state ──────────────────────────────────────────────────
  describe('status states', () => {
    it('does NOT show "Resetting" caption on error when autoCapture is false', () => {
      renderCapture({ autoCapture: false, status: 'error' })
      expect(screen.queryByText(/resetting/i)).not.toBeInTheDocument()
    })

    it('does NOT show "Resetting" caption on success when autoCapture is false', () => {
      renderCapture({ autoCapture: false, status: 'success' })
      expect(screen.queryByText(/resetting/i)).not.toBeInTheDocument()
    })

    it('shows manual Capture button on error when autoCapture is false', () => {
      // Camera should stay frozen — Capture button still visible
      renderCapture({ autoCapture: false, status: 'error' })
      expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument()
    })

    it('hides manual Capture button when autoCapture is true', () => {
      // Countdown overlay replaces the manual button
      renderCapture({ autoCapture: true, status: 'idle' })
      expect(screen.queryByRole('button', { name: /capture/i })).not.toBeInTheDocument()
    })
  })
})
