"use client"

import * as React from "react"

/** Preference order; the browser picks the first it supports. */
const CANDIDATE_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
] as const

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined

  return CANDIDATE_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

/**
 * Microphone capture for the chat composer.
 *
 * `stop()` resolves with the recording rather than firing a callback, so the
 * caller can `await` it and upload in one flow. The promise is settled from the
 * recorder's own `stop` event, because `MediaRecorder.stop()` is asynchronous —
 * the final `dataavailable` chunk arrives after it returns, and reading the
 * chunks immediately would truncate the last moment of audio.
 *
 * The stream's tracks are always stopped, which is what releases the microphone
 * and clears the browser's recording indicator. Leaving them open is the classic
 * leak here.
 */
export function useVoiceRecorder() {
  const [isRecording, setRecording] = React.useState(false)
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])

  const release = React.useCallback(() => {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop())
    recorderRef.current = null
  }, [])

  React.useEffect(() => release, [release])

  const start = React.useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = pickMimeType()

    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    )

    chunksRef.current = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    recorderRef.current = recorder
    recorder.start()
    setRecording(true)
  }, [])

  const stop = React.useCallback(async (): Promise<Blob | null> => {
    const recorder = recorderRef.current

    if (!recorder || recorder.state === "inactive") {
      setRecording(false)
      return null
    }

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(
          new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          })
        )
      }

      recorder.stop()
    })

    release()
    setRecording(false)
    chunksRef.current = []

    return blob.size > 0 ? blob : null
  }, [release])

  return { isRecording, start, stop }
}
