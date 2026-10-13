import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'

// The longest side of a saved photo. Enough to read a meter or a receipt, and far below the 5 MB limit.
const MAX_SIDE = 1600

// "photo-20261013-141502.jpg"
function photoName() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)

  return `photo-${stamp}.jpg`
}

function toJpeg(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
}

// Draws a picture (a camera frame or a photo file) no larger than MAX_SIDE. -> File
async function toPhotoFile(source, width, height) {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
  const canvas = document.createElement('canvas')

  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)

  const blob = await toJpeg(canvas)

  if (!blob) throw new Error('The photo could not be saved. Try again.')

  return new File([blob], photoName(), { type: 'image/jpeg' })
}

// A phone or tablet, whose own camera app takes the picture.
function hasCameraApp() {
  return window.matchMedia('(pointer: coarse)').matches
}

/*
  "Take photo": takes a picture and hands it over as a JPG file, ready to upload.

  On a phone the phone's camera opens. On a computer the webcam is shown
  under the button with a Capture button. Either way the picture is made
  smaller first, since a phone photo is often over the 5 MB limit.

  onPhoto   called with the File
  className the button's classes, so it matches the buttons beside it
*/
function TakePhoto({ onPhoto, disabled, className }) {
  const input = useRef(null)
  const video = useRef(null)
  // The webcam while it is open, on a computer.
  const [stream, setStream] = useState(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  // The camera's light goes off when the viewfinder closes or the page is left.
  useEffect(() => {
    if (!stream) return undefined

    return () => stream.getTracks().forEach((track) => track.stop())
  }, [stream])

  async function start() {
    setError(null)

    if (hasCameraApp()) {
      input.current.click()
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot use a camera here. Attach a file instead.')
      return
    }

    setStarting(true)

    try {
      setStream(
        await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        })
      )
    } catch (cameraError) {
      setError(
        cameraError.name === 'NotAllowedError'
          ? 'The camera is blocked for this site. Allow it in the browser’s address bar, then try again.'
          : 'No camera was found on this device. Attach a file instead.'
      )
    } finally {
      setStarting(false)
    }
  }

  async function capture() {
    const frame = video.current

    if (!frame?.videoWidth) return

    try {
      const photo = await toPhotoFile(frame, frame.videoWidth, frame.videoHeight)

      setStream(null)
      onPhoto(photo)
    } catch (captureError) {
      setError(captureError.message)
    }
  }

  // A picture from the phone's camera app.
  async function handleTaken(event) {
    const file = event.target.files[0]

    event.target.value = ''

    if (!file) return

    try {
      const picture = await createImageBitmap(file)

      onPhoto(await toPhotoFile(picture, picture.width, picture.height))
      picture.close()
    } catch {
      // A picture the browser cannot redraw is sent as it is; the size limit still applies.
      onPhoto(file)
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleTaken}
        className="hidden"
      />

      <button type="button" onClick={start} disabled={disabled || starting || stream !== null} className={className}>
        <Camera size={14} />
        {starting ? 'Opening camera...' : 'Take photo'}
      </button>

      {stream ? (
        <div className="w-full basis-full">
          <video
            ref={(node) => {
              video.current = node

              if (node && node.srcObject !== stream) node.srcObject = stream
            }}
            autoPlay
            playsInline
            muted
            className="max-h-[320px] w-full max-w-[480px] rounded-[8px] border border-[var(--line)] bg-[var(--brand-panel)]"
          />

          <div className="mt-2 flex gap-[10px]">
            <button
              type="button"
              onClick={capture}
              className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[10px] text-[12px] font-bold text-white"
            >
              <Camera size={14} />
              Capture
            </button>
            <button
              type="button"
              onClick={() => setStream(null)}
              className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold"
            >
              Close camera
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="w-full basis-full text-[11px] leading-[1.5] text-[var(--danger)]">{error}</p> : null}
    </>
  )
}

export default TakePhoto
