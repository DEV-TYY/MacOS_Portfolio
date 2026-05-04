import React, { useCallback, useEffect, useRef, useState } from "react";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import WindowControls from "#components/WindowControls";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize2,
  Minimize2,
  Settings,
  AlertCircle,
  Loader,
} from "lucide-react";

const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const Video = () => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const speedIntervalRef = useRef(null);
  const volumeIntervalRef = useRef(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showVolume, setShowVolume] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/videos");
      if (!response.ok) throw new Error("Failed to fetch videos");
      const data = await response.json();
      setVideos(data.videos || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading videos");
      console.error("Fetch videos error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();

    window.addEventListener("videos:changed", fetchVideos);
    return () => {
      window.removeEventListener("videos:changed", fetchVideos);
    };
  }, [fetchVideos]);

  const currentVideo = videos[currentIndex];
  const filteredVideos = videos.filter((video) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      video.title.toLowerCase().includes(query) ||
      video.description.toLowerCase().includes(query) ||
      video.album.toLowerCase().includes(query)
    );
  });

  const videosByAlbum = filteredVideos.reduce((albums, video) => {
    const album = video.album || "Other";
    if (!albums[album]) albums[album] = [];
    albums[album].push(video);
    return albums;
  }, {});


  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    return () => {
      if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      console.log("Video can play:", currentVideo?.src);
    };

    const handleError = (e) => {
      console.error("Video error:", e);
    };

    const handleLoadStart = () => {
      console.log("Video load start:", currentVideo?.src);
    };

    const handleEnded = () => {
      // Go to next video but show play icon
      setCurrentIndex((prev) => (prev + 1) % videos.length);
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [currentVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Playback started successfully
          })
          .catch((error) => {
            console.log("Video play failed:", error);
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
    }
  }, [isPlaying, currentVideo]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Toggle play failed:", error);
      setIsPlaying(false);
    }
  };




  const prevVideo = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
    setIsPlaying(true);
  };
  const nextVideo = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
    setIsPlaying(true);
  };

  const selectVideo = (index) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  const adjustPlaybackRate = (direction) => {
    setPlaybackRate((prev) =>
      clamp(Number((prev + direction * 0.25).toFixed(2)), 0.5, 2)
    );
  };

  const adjustVolume = (direction) => {
    setVolume((prev) =>
      clamp(Number((prev + direction * 0.05).toFixed(2)), 0, 1)
    );
  };

  const startAdjustPlaybackRate = (direction) => {
    adjustPlaybackRate(direction);
    if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
    speedIntervalRef.current = window.setInterval(
      () => adjustPlaybackRate(direction),
      150
    );
  };

  const stopAdjustPlaybackRate = () => {
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = null;
    }
  };

  const startAdjustVolume = (direction) => {
    adjustVolume(direction);
    if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
    volumeIntervalRef.current = window.setInterval(
      () => adjustVolume(direction),
      100
    );
  };

  const stopAdjustVolume = () => {
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.log("Fullscreen error:", err);
    }
  };

  const handleVideoClick = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Video click play failed:", error);
    }
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = percent * videoRef.current.duration;
    }
  };




  return (
    <>
    <div
      ref={containerRef}
      className={`bg-slate-950/95 w-full shadow-2xl ring-1 ring-white/5 ${
        isFullscreen
          ? "h-screen p-0 rounded-none overflow-hidden"
          : "p-6 rounded-[2rem]"
      }`}
    >
      <div id="window-header" className={`bg-white ${isFullscreen ? "hidden" : ""}`}>
        <WindowControls target="video" />
        <h2>Videos</h2>
      </div>

      {loading && (
        <div className="flex h-96 items-center justify-center border border-white/10 rounded-4xl bg-slate-900/70 backdrop-blur-xl">
          <div className="text-center">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm text-slate-300">Loading videos...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex h-96 items-center justify-center border border-rose-500/30 rounded-4xl bg-rose-950/20 backdrop-blur-xl">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-rose-400" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
      <div
        className={`grid border border-white/10 backdrop-blur-xl shadow-[0_40px_120px_-40px_rgba(15,23,42,0.9)] text-white overflow-hidden ${
          isFullscreen ? "h-full grid-cols-1 border-0" : "gap-6 lg:grid-cols-2"
        }`}
      >
        {/* Video Player */}
        <div
          className={`flex flex-col bg-slate-950/80 border border-white/10 overflow-hidden shadow-[0_32px_80px_-40px_rgba(0,0,0,0.8)] ${
            isFullscreen ? "h-full gap-0 rounded-none border-0" : "gap-4 rounded-[2rem]"
          }`}
          onMouseMove={handleMouseMove}
        >
          {/* Video Container */}
          <div
            className={`relative w-full overflow-hidden bg-slate-950 shadow-inner shadow-black/40 group ${
              isFullscreen ? "min-h-0 flex-1 rounded-none" : "rounded-[2rem]"
            }`}
          >
            <div className={`absolute left-1/2 top-4 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-[10px] uppercase tracking-[0.35em] text-slate-400 border border-white/10 shadow-lg ${isFullscreen ? "hidden" : ""}`}>
              <span className="h-2 w-2 rounded-full bg-slate-600" />
              <span className="h-2 w-2 rounded-full bg-slate-600" />
              <span>MacBook Pro</span>
            </div>
            <video
              ref={videoRef}
              src={currentVideo?.src}
              preload="metadata"
              className={`w-full bg-black object-contain ${
                isFullscreen ? "h-full" : "h-[min(460px,calc(100vh-320px))]"
              }`}
              muted={false}
              playsInline
              onClick={handleVideoClick}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Controls Overlay */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                showControls ? "opacity-100" : "opacity-0"
              }`}
            >
              {!isPlaying && (
                <button
                  type="button"
                  onClick={handleVideoClick}
                  className="size-20 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition flex items-center justify-center shadow-2xl border border-white/30"
                >
                  <Play size={48} className="text-white fill-white" />
                </button>
              )}
            </div>
          </div>

          {/* Video Info */}
          <div className={`px-5 pb-2 ${isFullscreen ? "hidden" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-cyan-200">
                {currentVideo?.album}
              </span>
              <span className="text-xs text-slate-400">{currentVideo?.duration}</span>
            </div>
            <h3 className="text-xl font-bold text-white">{currentVideo?.title}</h3>
            <p className="text-sm text-slate-300 mt-1">{currentVideo?.description}</p>
          </div>

          {/* Progress Bar */}
          <div className={`${isFullscreen ? "px-6 pt-4 pb-2 bg-black" : "px-5 space-y-2"}`}>
            <div
              className="rounded-full bg-white/10 overflow-hidden border border-white/10 h-1.5 cursor-pointer hover:h-2 transition-all"
              onClick={handleProgressClick}
            >
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{formatTime(videoRef.current?.currentTime)}</span>
              <span>{formatTime(videoRef.current?.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className={`${isFullscreen ? "px-6 pb-6 bg-black" : "px-5 pb-5 space-y-4"}`}>
            {/* Main Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={prevVideo}
                  className="size-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                >
                  <SkipBack size={18} className="text-slate-100" />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="size-12 rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition flex items-center justify-center shadow-lg"
                >
                  {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                </button>
                <button
                  type="button"
                  onClick={nextVideo}
                  className="size-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                >
                  <SkipForward size={18} className="text-slate-100" />
                </button>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {/* Volume */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowVolume((prev) => !prev)}
                    className="size-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                  >
                    <Volume2 className="text-slate-300" size={18} />
                  </button>
                  {showVolume && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col gap-3 w-12 px-3 py-4 bg-white/10 rounded-full border border-white/20 backdrop-blur-md z-50">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-24 accent-cyan-400 appearance-none bg-transparent cursor-pointer"
                        style={{
                          writingMode: "bt-lr",
                        }}
                      />
                      <span className="text-xs text-slate-300 text-center">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Speed */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSpeed((prev) => !prev)}
                    className="size-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-xs font-semibold"
                  >
                    <Settings size={18} className="text-slate-300" />
                  </button>
                  {showSpeed && (
                    <div className="absolute bottom-12 right-0 flex flex-col gap-2 px-3 py-2 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md z-50 min-w-32">
                      {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            setPlaybackRate(rate);
                            setShowSpeed(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm transition ${
                            playbackRate === rate
                              ? "bg-cyan-400 text-slate-950 font-semibold"
                              : "bg-white/5 text-slate-200 hover:bg-white/10"
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="size-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                >
                  {isFullscreen ? (
                    <Minimize2 className="text-slate-300" size={18} />
                  ) : (
                    <Maximize2 className="text-slate-300" size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
        <div className={`bg-white/5 border border-white/10  p-4 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.8)] backdrop-blur-xl overflow-hidden flex flex-col ${isFullscreen ? "hidden" : ""}`}>
          {/* Header */}
          <div className="space-y-3 mb-4 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-slate-400 tracking-[0.3em]">
                  Playlist
                </p>
                <p className="text-sm text-slate-200 mt-1">
                  {filteredVideos.length} / {videos.length} videos
                </p>
              </div>
            </div>
            {/* Search */}
            <div className="rounded-2xl bg-slate-900/80 border border-white/10 px-3 py-2">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Videos List */}
          {filteredVideos.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs text-slate-400 flex-1 flex items-center justify-center">
              No videos matched your search.
            </div>
          ) : (
            <div className="space-y-5 overflow-y-auto flex-1 pr-2">
              {Object.entries(videosByAlbum).map(([album, albumVideos]) => (
                <div key={album} className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-slate-500">
                    <span>{album}</span>
                    <span>{albumVideos.length} videos</span>
                  </div>
                  <ul className="space-y-2">
                    {albumVideos.map((videoItem) => {
                      const index = videos.findIndex(
                        (video) => video.id === videoItem.id
                      );
                      return (
                        <li
                          key={videoItem.id}
                          onClick={() => selectVideo(index)}
                          className={`rounded-2xl p-2.5 cursor-pointer transition border border-white/10 ${
                            index === currentIndex
                              ? "bg-cyan-500/15 shadow-[0_8px_30px_-20px_rgba(14,165,233,0.7)] ring-1 ring-cyan-400/40"
                              : "bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex gap-2">
                            <div className="size-12 bg-slate-800/50 border border-white/10 flex-shrink-0 overflow-hidden rounded-2xl">
                              <img
                                src={videoItem.thumbnail}
                                alt={videoItem.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-100 text-xs line-clamp-1">
                                {videoItem.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                <span>{videoItem.duration}</span>
                                <span className="rounded-full bg-slate-800/80 px-2 py-1 text-[9px] uppercase tracking-[0.25em] text-slate-500">
                                  {videoItem.album}
                                </span>
                              </div>
                            </div>
                            {index === currentIndex && (
                              <div className="flex items-center">
                                <span className="text-xs text-cyan-300 font-semibold">
                                  ▶
                                </span>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
           
    </div>
    </>

  );
};

const VideoWindow = WindowWrapper(Video, "video");
export default VideoWindow;
