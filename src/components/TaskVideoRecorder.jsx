import { useState, useRef, useEffect, useCallback } from "react";
import {
  MdClose,
  MdFlipCameraIos,
  MdRefresh,
  MdCheck,
  MdFileUpload,
  MdVideocam,
  MdWarning,
} from "react-icons/md";
import { toast } from "react-toastify";
import "./TaskVideoRecorder.css";

export default function TaskVideoRecorder({
  isOpen,
  onClose,
  onVideoRecorded,
  taskTitle = "Task Proof",
}) {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // back camera by default
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [recordedFile, setRecordedFile] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Stop current active media stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera with requested facingMode
  const startCamera = useCallback(async (mode) => {
    setCameraError(null);
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported on this device/browser");
      }

      // Stop any existing tracks first
      if (videoRef.current && videoRef.current.srcObject) {
        const currentTracks = videoRef.current.srcObject.getTracks();
        currentTracks.forEach((t) => t.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      };

      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback without strict facingMode if back camera is not available
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission denied. Please allow camera and microphone access."
          : "Unable to access camera on this device."
      );
    }
  }, []);

  // Initialize camera when opened
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(null);
      setRecordedFile(null);
      setIsRecording(false);
      setRecordDuration(0);
      startCamera(facingMode);
    } else {
      stopStream();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }

    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Flip camera between environment (back) and user (front)
  const toggleFacingMode = () => {
    if (isRecording) return;
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    stopStream();
    startCamera(nextMode);
  };

  // Start live recording
  const handleStartRecording = () => {
    if (!stream) return;
    chunksRef.current = [];

    let mimeType = "video/webm";
    if (MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
      mimeType = "video/webm;codecs=vp9,opus";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mimeType = "video/webm";
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const file = new File(
          [blob],
          `task_proof_${Date.now()}.${ext}`,
          { type: mimeType }
        );
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setRecordedFile(file);
        stopStream();
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordDuration(0);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setRecordDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      toast.error("Could not start recording: " + err.message);
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Discard preview and start camera again
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setRecordedFile(null);
    setRecordDuration(0);
    startCamera(facingMode);
  };

  // Confirm and attach recorded video
  const handleConfirmVideo = () => {
    if (recordedFile) {
      onVideoRecorded(recordedFile);
      onClose();
    }
  };

  // Fallback: Pick existing file from gallery/disk
  const handleFileFallback = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        return toast.error("Please upload a valid video file");
      }
      onVideoRecorded(file);
      onClose();
    }
  };

  // Format seconds to mm:ss
  const formatTimer = (totalSeconds) => {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="livelens_overlay" onClick={onClose}>
      <div
        className="livelens_modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="livelens_header">
          <div className="livelens_title_group">
            <span className="livelens_dot" />
            <div>
              <div className="livelens_brand">NORA</div>
              <p className="livelens_subtitle">
                {previewUrl ? "Review task video proof" : `Capture ${taskTitle}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="livelens_close_btn"
            onClick={onClose}
            title="Close Camera"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="livelens_viewfinder">
          {previewUrl ? (
            /* Recorded Preview */
            <video
              src={previewUrl}
              controls
              playsInline
              autoPlay
              className="livelens_video_feed"
            />
          ) : cameraError ? (
            /* Camera Error / Permission Screen */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                textAlign: "center",
                color: "#fff",
              }}
            >
              <MdWarning size={42} style={{ color: "#ef4444", marginBottom: 12 }} />
              <div style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 6 }}>
                Camera Unavailable
              </div>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", margin: "0 0 16px 0", maxWidth: 280 }}>
                {cameraError}
              </p>
              <label
                className="app_btn app_btn_confirm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                <MdFileUpload size={16} /> Choose Video File
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileFallback}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          ) : (
            /* Live Camera Viewfinder */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="livelens_video_feed"
              />

              {/* Four Focus Corner Brackets */}
              <div className="livelens_bracket livelens_bracket_tl" />
              <div className="livelens_bracket livelens_bracket_tr" />
              <div className="livelens_bracket livelens_bracket_bl" />
              <div className="livelens_bracket livelens_bracket_br" />

              {/* Top Badges Overlay */}
              <div className="livelens_top_badges">
                <span className="livelens_badge_quality">HD · 30 FPS</span>
                {isRecording ? (
                  <span className="livelens_badge_recording">
                    <span className="livelens_rec_dot" />
                    {formatTimer(recordDuration)}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.7)",
                      textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    Ready
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom Control Bar */}
        {previewUrl ? (
          /* Preview Actions: Retake vs Use Video */
          <div className="livelens_preview_footer">
            <button
              type="button"
              className="livelens_retake_btn"
              onClick={handleRetake}
            >
              <MdRefresh size={16} /> Retake
            </button>
            <button
              type="button"
              className="livelens_confirm_btn"
              onClick={handleConfirmVideo}
            >
              <MdCheck size={18} /> Use Video Proof
            </button>
          </div>
        ) : !cameraError ? (
          /* Live Shutter & Camera Controls */
          <div className="livelens_controls">
            {/* Flip Camera */}
            <button
              type="button"
              className="livelens_action_btn"
              onClick={toggleFacingMode}
              disabled={isRecording}
              style={{ opacity: isRecording ? 0.4 : 1 }}
              title="Flip Camera"
            >
              <MdFlipCameraIos size={20} />
            </button>

            {/* Shutter / Record Trigger */}
            <button
              type="button"
              className={`livelens_shutter_ring ${isRecording ? "livelens_shutter_recording" : ""
                }`}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              <div className="livelens_shutter_inner" />
            </button>

            {/* Gallery Upload Alternative */}
            <label
              className="livelens_action_btn"
              title="Upload existing video"
              style={{ opacity: isRecording ? 0.4 : 1, cursor: isRecording ? "default" : "pointer" }}
            >
              <MdFileUpload size={20} />
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleFileFallback}
                disabled={isRecording}
                style={{ display: "none" }}
              />
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}

