"use client";
 
import { useState, useRef, useCallback, useEffect } from "react";
import { t } from "@/utils";
 
// Icons
const VideoIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="m22 8-6 4 6 4V8Z"/>
    <rect width="14" height="12" x="2" y="6" rx="2"/>
  </svg>
);
 
const PlayIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);
 
const TrashIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);
 
const UploadIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" x2="12" y1="3" y2="15"/>
  </svg>
);
 
// Helpers
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
 
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
 
const VideoUpload = ({
  video,
  onVideoChange,
  maxDuration = 30,
  maxSize = 50,
  acceptedFormats = ["video/mp4", "video/quicktime", "video/webm"],
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef(null);
  const videoRef = useRef(null);
 
  useEffect(() => {
    if (video instanceof File) {
      const url = URL.createObjectURL(video);
      setPreview(url);
      
      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      tempVideo.onloadedmetadata = () => {
        setVideoInfo({
          duration: tempVideo.duration,
          width: tempVideo.videoWidth,
          height: tempVideo.videoHeight,
          size: video.size,
          name: video.name,
        });
        URL.revokeObjectURL(tempVideo.src);
      };
      tempVideo.src = url;
      
      return () => URL.revokeObjectURL(url);
    } else if (typeof video === "string" && video) {
      setPreview(video);
      setVideoInfo({ name: "Existing video", isExisting: true });
    } else {
      setPreview(null);
      setVideoInfo(null);
    }
  }, [video]);
 
  const validateVideo = useCallback(async (file) => {
    setError(null);
    setIsLoading(true);
 
    if (!acceptedFormats.includes(file.type)) {
      setError("Format nije podržan. Koristite MP4, MOV ili WebM.");
      setIsLoading(false);
      return false;
    }
 
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`Video je prevelik. Maksimalna veličina je ${maxSize}MB.`);
      setIsLoading(false);
      return false;
    }
 
    return new Promise((resolve) => {
      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      
      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(tempVideo.src);
        if (tempVideo.duration > maxDuration) {
          setError(`Video je predug. Maksimalno trajanje je ${maxDuration} sekundi.`);
          setIsLoading(false);
          resolve(false);
        } else {
          setIsLoading(false);
          resolve(true);
        }
      };
      
      tempVideo.onerror = () => {
        setError("Nije moguće učitati video.");
        setIsLoading(false);
        resolve(false);
      };
      
      tempVideo.src = URL.createObjectURL(file);
    });
  }, [acceptedFormats, maxSize, maxDuration]);
 
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;
    const isValid = await validateVideo(file);
    if (isValid) onVideoChange(file);
  }, [validateVideo, onVideoChange]);
 
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };
 
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };
 
  const handleRemove = () => {
    onVideoChange(null);
    setPreview(null);
    setVideoInfo(null);
    setError(null);
    setIsPlaying(false);
    if (inputRef.current) inputRef.current.value = "";
  };
 
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };
 
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <VideoIcon className="w-4 h-4 text-gray-500" />
          {"Video" || "Video"} 
          <span className="text-gray-400 font-normal">({"Opcionalno" || "opciono"})</span>
        </label>
        <span className="text-xs text-gray-400">Max {maxDuration}s, {maxSize}MB</span>
      </div>
 
      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`
            relative cursor-pointer border-2 border-dashed rounded-xl transition-all duration-200
            ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
            ${error ? "border-red-300 bg-red-50/50" : ""}
          `}
        >
          <input ref={inputRef} type="file" accept={acceptedFormats.join(",")} onChange={handleInputChange} className="hidden" />
          
          <div className="flex flex-col items-center justify-center py-8 px-4">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Obrada...</span>
              </div>
            ) : (
              <>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${isDragging ? "bg-primary/10" : "bg-gray-100"}`}>
                  <UploadIcon className={`w-7 h-7 ${isDragging ? "text-primary" : "text-gray-400"}`} />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {isDragging ? "Pustite video ovdje" : "Dodajte video"}
                </p>
                <p className="text-xs text-gray-400">Prevucite ili kliknite za odabir</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">MP4</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">MOV</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">WebM</span>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video group">
          <video ref={videoRef} src={preview} className="w-full h-full object-contain" onEnded={() => setIsPlaying(false)} playsInline muted />
          
          <div onClick={togglePlay} className={`absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity ${isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"}`}>
            <div className={`w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform ${isPlaying ? "scale-75" : "scale-100 hover:scale-110"}`}>
              {isPlaying ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-6 bg-gray-800 rounded-full" />
                  <div className="w-1.5 h-6 bg-gray-800 rounded-full" />
                </div>
              ) : (
                <PlayIcon className="w-8 h-8 text-gray-800 ml-1" />
              )}
            </div>
          </div>
          
          {videoInfo && !videoInfo.isExisting && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="px-2 py-1 bg-black/70 text-white text-xs font-medium rounded-lg">{formatDuration(videoInfo.duration)}</span>
              <span className="px-2 py-1 bg-black/70 text-white text-xs font-medium rounded-lg">{formatFileSize(videoInfo.size)}</span>
            </div>
          )}
          
          <button onClick={handleRemove} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110 transition-all">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
 
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">⚠️ {error}</p>
        </div>
      )}
 
      {!preview && !error && (
        <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
          <p className="text-xs text-blue-700">💡 <strong>Savjet:</strong> Kratki video (15-30s) povećava šanse za prodaju do 50%!</p>
        </div>
      )}
    </div>
  );
};
 
export default VideoUpload;