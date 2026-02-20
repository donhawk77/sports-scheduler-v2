import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, X } from 'lucide-react';

interface MediaCaptureOverlayProps {
    onClose: () => void;
    onSave: (videoBlob: Blob) => void;
    onAnalyze?: () => void; // New optional prop
}

export const MediaCaptureOverlay: React.FC<MediaCaptureOverlayProps> = ({ onClose, onSave, onAnalyze }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);

    // Timer effect
    useEffect(() => {
        let interval: ReturnType<typeof setTimeout>;
        if (isRecording) {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        } else {
            setTimer(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Format timer
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError("Camera access denied. Please allow permissions.");
            console.error("Error accessing camera:", err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);



    // Need to handle chunks correctly on stop. 
    // The ondataavailable fires periodically or on stop.
    // A better way is to use a ref for chunks to avoid closure staleness if we defined onstop inside startRecording,
    // OR just rely on the fact that we process chunks after stop.

    // UPDATED approach for stability:
    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Wait a tick for the last chunk
            setTimeout(() => {
                // Combine chunks
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                stopCamera(); // Stop camera stream to show preview
            }, 100);
        }
    };

    // Correcting the chunk capture logic:
    // We need to clear chunks before starting.
    const handleStartRecording = () => {
        setRecordedChunks([]); // Clear previous
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const mediaRecorder = new MediaRecorder(stream);

            const localChunks: Blob[] = []; // Local array to avoid state sync issues during recording

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    localChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(localChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setRecordedChunks(localChunks); // Sync back to state just in case
                setPreviewUrl(url);
                stopCamera();
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
        }
    };

    const handleRetake = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setRecordedChunks([]);
        startCamera();
    };

    const handleSave = () => {
        if (previewUrl) {
            // Re-create blob from chunks or fetch from URL (simpler to use chunks if available)
            // But we have the URL.
            fetch(previewUrl).then(r => r.blob()).then(blob => {
                onSave(blob);
                onClose();
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-fade-in">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-all z-50"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Main Content */}
            <div className="relative w-full h-full max-w-md bg-black md:rounded-2xl overflow-hidden shadow-2xl">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button onClick={onClose} className="px-4 py-2 bg-white/10 rounded-lg text-white">Close</button>
                    </div>
                ) : (
                    <>
                        {/* Video Feed / Preview */}
                        <div className="absolute inset-0 bg-gray-900">
                            {previewUrl ? (
                                <video
                                    src={previewUrl}
                                    className="w-full h-full object-cover"
                                    controls
                                    autoPlay
                                    loop
                                />
                            ) : (
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                                    autoPlay
                                    playsInline
                                    muted
                                />
                            )}
                        </div>

                        {/* Controls Overlay */}
                        <div className="absolute bottom-0 left-0 w-full p-8 pb-12 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">

                            {/* Recording Timer */}
                            {isRecording && (
                                <div className="mb-4 px-3 py-1 bg-red-600 rounded-full text-white font-bold text-sm animate-pulse">
                                    {formatTime(timer)}
                                </div>
                            )}

                            {/* Action Buttons */}
                            {previewUrl ? (
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleRetake}
                                        className="flex flex-col items-center gap-2 text-white opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                        <div className="p-3 rounded-full bg-white/10 backdrop-blur-md">
                                            <RefreshCw className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Retake</span>
                                    </button>

                                    {/* Analyze Button */}
                                    <button
                                        onClick={onAnalyze ? onAnalyze : handleSave}
                                        className="flex flex-col items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        <div className="p-4 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                            <CheckCircle className="w-8 h-8" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">Analyze</span>
                                    </button>

                                    <button
                                        onClick={handleSave}
                                        className="flex flex-col items-center gap-2 text-primary hover:text-white transition-colors"
                                    >
                                        <div className="p-4 rounded-full bg-primary text-black hover:bg-white transition-colors transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                            <CheckCircle className="w-8 h-8" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">Save</span>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                                    className={`relative group transition-all duration-300 ${isRecording ? 'scale-110' : 'hover:scale-105'}`}
                                >
                                    {/* Outer Ring */}
                                    <div className={`absolute inset-0 rounded-full border-4 transition-colors duration-300 ${isRecording ? 'border-red-600 animate-ping opacity-50' : 'border-white opacity-80'}`} />

                                    {/* Inner Circle / Stop Button */}
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-600 rounded-xl w-12 h-12 m-4' : 'bg-white'}`}>
                                        {isRecording ? (
                                            <div className="w-4 h-4 bg-white rounded-sm" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-red-500 border-4 border-white" />
                                        )}
                                    </div>
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
