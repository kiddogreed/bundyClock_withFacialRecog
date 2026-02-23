import { useRef, useCallback, useState } from 'react'
import Webcam from 'react-webcam'
import { Box, Button, Stack, Typography, CircularProgress } from '@mui/material'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import ReplayIcon from '@mui/icons-material/Replay'

const VIDEO_CONSTRAINTS = {
  width: 480,
  height: 360,
  facingMode: 'user',
}

/**
 * WebcamCapture — shows live feed and lets user snap a photo.
 *
 * Props:
 *   onCapture(blob: Blob) — called with JPEG blob on capture
 *   loading?: boolean
 */
export default function WebcamCapture({ onCapture, loading = false }) {
  const webcamRef = useRef(null)
  const [capturedImage, setCapturedImage] = useState(null)

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (!imageSrc) return

    // Convert base64 to Blob
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        setCapturedImage(imageSrc)
        onCapture?.(blob)
      })
  }, [onCapture])

  const handleRetake = () => setCapturedImage(null)

  return (
    <Box sx={{ textAlign: 'center' }}>
      {!capturedImage ? (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={VIDEO_CONSTRAINTS}
            style={{ borderRadius: 8, maxWidth: '100%' }}
          />
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CameraAltIcon />}
            onClick={handleCapture}
            sx={{ mt: 1 }}
            disabled={loading}
          >
            {loading ? 'Processing…' : 'Capture'}
          </Button>
        </>
      ) : (
        <>
          <img
            src={capturedImage}
            alt="Captured"
            style={{ borderRadius: 8, maxWidth: '100%' }}
          />
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ReplayIcon />}
              onClick={handleRetake}
            >
              Retake
            </Button>
          </Stack>
        </>
      )}
      {!capturedImage && (
        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
          Position your face in the frame, then press Capture.
        </Typography>
      )}
    </Box>
  )
}
