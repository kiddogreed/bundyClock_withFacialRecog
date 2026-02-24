import { useRef, useCallback, useState, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Box, Button, Stack, Typography, CircularProgress } from '@mui/material'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import ReplayIcon from '@mui/icons-material/Replay'

const VIDEO_CONSTRAINTS = {
  width: 480,
  height: 360,
  facingMode: 'user',
}

// Auto-reset delay after success or error (ms)
const AUTO_RESET_DELAY = 3000
// Countdown seconds before auto-capture fires
const AUTO_CAPTURE_SECONDS = 3

/**
 * WebcamCapture — shows live feed and lets user snap a photo.
 *
 * Props:
 *   onCapture(blob: Blob) — called with JPEG blob on capture
 *   onRetake()           — called when returning to live feed
 *   loading?: boolean
 *   status?: 'idle' | 'verifying' | 'uploading' | 'recording' | 'success' | 'error'
 *   autoCapture?: boolean — when true, shows a countdown then auto-fires capture
 */
export default function WebcamCapture({ onCapture, onRetake, loading = false, status = 'idle', autoCapture = false }) {
  const webcamRef = useRef(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [countdown, setCountdown] = useState(autoCapture ? AUTO_CAPTURE_SECONDS : null)

  // Auto-reset to live feed after success or error
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setCapturedImage(null)
        if (autoCapture) setCountdown(AUTO_CAPTURE_SECONDS)
        onRetake?.()
      }, AUTO_RESET_DELAY)
      return () => clearTimeout(timer)
    }
  }, [status, onRetake, autoCapture])

  // Countdown tick — only when live feed is showing and autoCapture is on
  useEffect(() => {
    if (!autoCapture || capturedImage || countdown === null) return
    if (status !== 'idle') return
    if (countdown <= 0) return // handled by capture effect below

    const tick = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(tick)
  }, [autoCapture, capturedImage, countdown, status])

  // Fire capture when countdown hits 0
  useEffect(() => {
    if (!autoCapture || countdown !== 0 || capturedImage) return
    doCapture()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown])

  const doCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (!imageSrc) return

    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        setCapturedImage(imageSrc)
        setCountdown(null)
        onCapture?.(blob)
      })
  }, [onCapture])

  const handleCapture = useCallback(() => {
    doCapture()
  }, [doCapture])

  const handleRetake = () => {
    setCapturedImage(null)
    if (autoCapture) setCountdown(AUTO_CAPTURE_SECONDS)
    onRetake?.()
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      {!capturedImage ? (
        <>
          {/* Live webcam feed with optional countdown overlay */}
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={VIDEO_CONSTRAINTS}
              style={{ borderRadius: 8, maxWidth: '100%', display: 'block' }}
            />
            {autoCapture && countdown !== null && countdown > 0 && (
              <Box
                sx={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 2,
                  background: 'rgba(0,0,0,0.35)',
                  pointerEvents: 'none',
                }}
              >
                <Typography
                  variant="h1"
                  sx={{ color: '#fff', fontWeight: 700, lineHeight: 1, fontSize: '6rem', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
                >
                  {countdown}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 1 }}>
                  Auto-capturing…
                </Typography>
              </Box>
            )}
          </Box>

          {/* Manual capture button — hidden when autoCapture is active */}
          {!autoCapture && (
            <>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CameraAltIcon />}
                onClick={handleCapture}
                sx={{ mt: 1 }}
                disabled={loading}
              >
                {loading ? 'Processing…' : 'Capture'}
              </Button>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Position your face in the frame, then press Capture.
              </Typography>
            </>
          )}
        </>
      ) : (
        <>
          <img
            src={capturedImage}
            alt="Captured"
            style={{ borderRadius: 8, maxWidth: '100%' }}
          />
          {/* Show retake only when not processing and not yet finished */}
          {!loading && status !== 'success' && (
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={handleRetake}
                size="small"
              >
                Retake
              </Button>
            </Stack>
          )}
          {(status === 'success' || status === 'error') && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Resetting in {AUTO_RESET_DELAY / 1000}s…
            </Typography>
          )}
        </>
      )}
    </Box>
  )
}
