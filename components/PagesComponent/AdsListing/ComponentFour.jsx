import React, { useState, useRef } from 'react';
import { IoInformationCircleOutline } from "react-icons/io5";
import { HiOutlineUpload } from "react-icons/hi";
import { MdClose } from "react-icons/md";
import { FaPlay, FaPause } from "react-icons/fa";
import { toast } from "sonner";
import { t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";

const ComponentFour = ({
  uploadedImages,
  setUploadedImages,
  otherImages,
  setOtherImages,
  uploadedVideo,
  setUploadedVideo,
  setStep,
  handleGoBack,
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingOther, setIsDraggingOther] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(false);
  const videoRef = useRef(null);

  // Video compression function using Canvas API
  const compressVideo = async (file) => {
    return new Promise((resolve, reject) => {
      setIsCompressing(true);
      setCompressionProgress(0);

      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        video.currentTime = 0;
      };

      video.onseeked = async () => {
        // Set canvas dimensions (max 720p)
        const scale = Math.min(1, 1280 / video.videoWidth, 720 / video.videoHeight);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        const chunks = [];
        const stream = canvas.captureStream(30); // 30 fps
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: 2000000 // 2 Mbps
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
            type: 'video/webm',
            lastModified: Date.now()
          });
          
          setIsCompressing(false);
          setCompressionProgress(100);
          resolve(compressedFile);
        };

        mediaRecorder.start();

        // Draw frames
        const fps = 30;
        const frameDuration = 1000 / fps;
        let currentTime = 0;
        const duration = video.duration;

        const drawFrame = () => {
          if (currentTime >= duration) {
            mediaRecorder.stop();
            URL.revokeObjectURL(video.src);
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          currentTime += frameDuration / 1000;
          video.currentTime = currentTime;
          
          const progress = (currentTime / duration) * 100;
          setCompressionProgress(Math.min(progress, 99));
        };

        video.onseeked = drawFrame;
        drawFrame();
      };

      video.onerror = () => {
        setIsCompressing(false);
        reject(new Error('Video compression failed'));
      };
    });
  };

  // Handle video drop
  const handleVideoDrop = async (e) => {
    e.preventDefault();
    setIsDraggingVideo(false);

    const file = e.dataTransfer?.files[0] || e.target?.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error(t('wrongFile'));
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file too large (max 100MB)');
      return;
    }

    try {
      toast.info('Compressing video...');
      const compressedVideo = await compressVideo(file);
      setUploadedVideo(compressedVideo);
      toast.success('Video compressed successfully!');
    } catch (error) {
      toast.error('Failed to compress video');
      console.error(error);
    }
  };

  // Handle main image drop
  const handleMainImageDrop = (e) => {
    e.preventDefault();
    setIsDraggingMain(false);

    const file = e.dataTransfer?.files[0] || e.target?.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('wrongFile'));
      return;
    }

    setUploadedImages([file]);
  };

  // Handle other images drop
  const handleOtherImagesDrop = (e) => {
    e.preventDefault();
    setIsDraggingOther(false);

    const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast.error(t('wrongFile'));
      return;
    }

    const remainingSlots = 5 - otherImages.length;
    
    if (remainingSlots === 0) {
      toast.error(t("imageLimitExceeded"));
      return;
    }

    if (imageFiles.length > remainingSlots) {
      toast.error(t("youCanUpload") + " " + remainingSlots + " " + t("moreImages"));
      return;
    }

    setOtherImages(prev => [...prev, ...imageFiles]);
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (playingVideo) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlayingVideo(!playingVideo);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }

        .animate-pulse-border {
          animation: pulse 2s infinite;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .hover-scale {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-scale:hover {
          transform: scale(1.02);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .gradient-border {
          position: relative;
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(135deg, #667eea 0%, #764ba2 100%) border-box;
          border: 2px solid transparent;
        }

        .shimmer-bg {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        .progress-bar {
          transition: width 0.3s ease;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }
      `}</style>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeInUp">
        {/* Main Image Upload */}
        <div className="flex flex-col gap-3">
          <label className="requiredInputLabel text-sm font-semibold flex items-center gap-2">
            {t("mainPicture")}
            <span className="text-primary">*</span>
          </label>
          
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingMain(true); }}
            onDragLeave={() => setIsDraggingMain(false)}
            onDrop={handleMainImageDrop}
            className="relative"
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleMainImageDrop}
              className="hidden"
              id="main-image-input"
            />
            
            {uploadedImages.length === 0 ? (
              <label
                htmlFor="main-image-input"
                className={`block border-2 border-dashed rounded-2xl p-8 min-h-[280px] cursor-pointer hover-scale transition-all duration-300 ${
                  isDraggingMain
                    ? 'border-primary bg-primary/5 animate-pulse-border glass-effect'
                    : 'border-gray-300 glass-effect hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className={`transition-transform duration-300 ${isDraggingMain ? 'scale-110' : ''}`}>
                    <HiOutlineUpload size={48} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2 font-medium">
                      {isDraggingMain ? t("dropFiles") : t("dragFiles")}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">{t("or")}</p>
                    <span className="text-primary font-semibold">{t("upload")}</span>
                  </div>
                  <p className="text-xs text-gray-400">JPG, PNG up to 10MB</p>
                </div>
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden shadow-xl group animate-scaleIn">
                <CustomImage
                  width={591}
                  height={280}
                  className="rounded-2xl object-cover aspect-[591/280] w-full"
                  src={URL.createObjectURL(uploadedImages[0])}
                  alt={uploadedImages[0].name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-3 left-3 text-white text-sm">
                    <p className="font-medium">{uploadedImages[0].name}</p>
                    <p className="text-xs">{Math.round(uploadedImages[0].size / 1024)} KB</p>
                  </div>
                  <button
                    onClick={() => setUploadedImages([])}
                    className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover-lift"
                  >
                    <MdClose size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Upload */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold flex items-center gap-2">
            {t("video")} ({t("optional")})
            <div className="relative group">
              <IoInformationCircleOutline size={18} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                Auto-compressed to 720p
              </div>
            </div>
          </label>
          
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingVideo(true); }}
            onDragLeave={() => setIsDraggingVideo(false)}
            onDrop={handleVideoDrop}
            className="relative"
          >
            <input
              type="file"
              accept="video/mp4,video/mov,video/avi,video/webm"
              onChange={handleVideoDrop}
              className="hidden"
              id="video-input"
              disabled={isCompressing}
            />
            
            {!uploadedVideo ? (
              <label
                htmlFor="video-input"
                className={`block border-2 border-dashed rounded-2xl p-8 min-h-[280px] cursor-pointer hover-scale transition-all duration-300 ${
                  isDraggingVideo
                    ? 'border-purple-500 bg-purple-50 animate-pulse-border glass-effect'
                    : 'border-gray-300 glass-effect hover:border-purple-400'
                } ${isCompressing ? 'pointer-events-none opacity-50' : ''}`}
              >
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className={`transition-transform duration-300 ${isDraggingVideo ? 'scale-110' : ''}`}>
                    <HiOutlineUpload size={48} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2 font-medium">
                      {isDraggingVideo ? t("dropFiles") : t("dragFiles")}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">{t("or")}</p>
                    <span className="text-purple-600 font-semibold">{t("upload")}</span>
                  </div>
                  <p className="text-xs text-gray-400">MP4, MOV, AVI up to 100MB</p>
                </div>
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden shadow-xl group animate-scaleIn">
                <video
                  ref={videoRef}
                  src={URL.createObjectURL(uploadedVideo)}
                  className="w-full h-[280px] object-cover cursor-pointer"
                  onClick={toggleVideoPlay}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVideoPlay(); }}
                    className="bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-2xl hover-lift pointer-events-auto"
                  >
                    {playingVideo ? (
                      <FaPause size={24} className="text-gray-800" />
                    ) : (
                      <FaPlay size={24} className="text-gray-800 ml-1" />
                    )}
                  </button>
                </div>
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                  {uploadedVideo.name}
                </div>
                <button
                  onClick={() => setUploadedVideo(null)}
                  className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover-lift"
                >
                  <MdClose size={18} />
                </button>
              </div>
            )}

            {/* Compression Progress Overlay */}
            {isCompressing && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center gap-4 z-10 animate-scaleIn">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-lg">Compressing video...</p>
                  <p className="text-sm text-gray-600 mt-1">{Math.round(compressionProgress)}%</p>
                </div>
                <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full progress-bar"
                    style={{ width: `${compressionProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Other Images Section */}
      <div className="flex flex-col gap-3 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <label className="flex items-center gap-2 font-semibold text-sm">
          {t("otherPicture")}
          <div className="relative group">
            <IoInformationCircleOutline size={20} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {t("maxOtherImages")}
            </div>
          </div>
        </label>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOther(true); }}
          onDragLeave={() => setIsDraggingOther(false)}
          onDrop={handleOtherImagesDrop}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            multiple
            onChange={handleOtherImagesDrop}
            className="hidden"
            id="other-images-input"
          />

          {otherImages.length < 5 && (
            <label
              htmlFor="other-images-input"
              className={`block border-2 border-dashed rounded-2xl p-6 cursor-pointer mb-6 hover-scale transition-all duration-300 ${
                isDraggingOther
                  ? 'border-primary bg-primary/5 animate-pulse-border glass-effect'
                  : 'border-gray-300 glass-effect hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-center gap-3 text-center">
                <HiOutlineUpload size={24} className="text-primary" />
                <span className="text-gray-600 font-medium">
                  {isDraggingOther ? t("dropFiles") : t("dragFiles")} ({otherImages.length}/5)
                </span>
              </div>
            </label>
          )}

          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {otherImages.map((file, index) => (
              <div
                key={index}
                className="relative rounded-xl overflow-hidden shadow-lg group aspect-square hover-lift animate-scaleIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CustomImage
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-2 left-2 text-white text-xs">
                    <p className="font-medium truncate max-w-[140px]">{file.name}</p>
                    <p>{Math.round(file.size / 1024)} KB</p>
                  </div>
                  <button
                    onClick={() => setOtherImages(prev => prev.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:scale-110 hover:rotate-90 transition-all duration-200"
                  >
                    <MdClose size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
        <button
          className="bg-gray-800 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover-lift transition-all duration-200 hover:bg-gray-900"
          onClick={handleGoBack}
        >
          {t("back")}
        </button>
        <button
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover-lift transition-all duration-200 hover:shadow-xl"
          onClick={() => setStep(5)}
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
};

export default ComponentFour;