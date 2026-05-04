import React, { useEffect, useRef, useState } from "react";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import WindowControls from "#components/WindowControls";
import { Play, Pause, SkipBack, SkipForward, Volume2, Music2 } from "lucide-react";

const tracks = [
//   {
//     id: 1,
//     title: "បេះដូងបាត់គ្នា",
//     artist: "មាស សុខសោភា",
//     src: "/music/បេះដូងបាត់គ្នា.mp3",
//     image: "/images/apple_music_icon.png",
//     album: "ម៉ាយូរ ​​​អត់ដាក់ទឹកកក"
//   },
  {
    id: 1,
    title: "ចង់ដណ្តើមអូនមកវិញ",
    artist: "ឆន សុវណ្ណរាជ",
    src: "/music/ចង់ដណ្តើមអូនមកវិញ.mp3",
    image: "/music/chhorn -sovannareach.png",
    album: "ម"
  }
];

const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const Music = () => {
  const audioRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const speedIntervalRef = useRef(null);
  const volumeIntervalRef = useRef(null);

  const currentTrack = tracks[currentIndex];
  const filteredTracks = tracks.filter((track) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    return () => {
      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current);
      }
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setCurrentIndex((prev) => (prev + 1) % tracks.length);
      setIsPlaying(true);
    };

    const handleTimeUpdate = () => {
      if (!audio.duration) return;
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [currentIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  const togglePlay = () => setIsPlaying((prev) => !prev);
  const prevTrack = () => {
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };
  const nextTrack = () => {
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const selectTrack = (index) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const adjustPlaybackRate = (direction) => {
    setPlaybackRate((prev) => clamp(Number((prev + direction * 0.1).toFixed(1)), 0.5, 2));
  };

  const adjustVolume = (direction) => {
    setVolume((prev) => clamp(Number((prev + direction * 0.05).toFixed(2)), 0, 1));
  };

  const startAdjustPlaybackRate = (direction) => {
    adjustPlaybackRate(direction);
    if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
    speedIntervalRef.current = window.setInterval(() => adjustPlaybackRate(direction), 150);
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
    volumeIntervalRef.current = window.setInterval(() => adjustVolume(direction), 100);
  };

  const stopAdjustVolume = () => {
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
  };

  const openImageModal = () => setShowImageModal(true);
  const closeImageModal = () => setShowImageModal(false);

  return (
    <>
      <div className="h-full">
        <div id="window-header" className="bg-white">
          <WindowControls target="music" />
          <h2>Music</h2>
        </div>

        {showImageModal ? (
          // iOS Style Layout
          <div className="flex flex-col items-center justify-between p-6 bg-linear-to-b from-slate-900 via-slate-950 to-black border border-white/10 backdrop-blur-xl shadow-[0_40px_120px_-40px_rgba(15,23,42,0.9)] text-white h-full min-h-96">
            {/* Album Art - Large */}
            <div className="flex flex-col items-center justify-center flex-1 w-full">
              <div className={`size-88 rounded-full  {isPlaying ? 'spinning' : ''}`}>
                {currentTrack.image ? (
                  <img
                    src={currentTrack.image}
                    alt={`${currentTrack.title} album art`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Music2 size={64} className="text-cyan-300" />
                )}
              </div>

              {/* Track Info */}
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">{currentTrack.title}</h3>
                <p className="text-lg text-slate-300">{currentTrack.artist}</p>
                {/* <p className="text-sm text-slate-500 mt-2">{currentTrack.album}</p> */}
              </div>
            </div>

            {/* Progress & Time */}
            <div className="w-full space-y-3 mb-6">
              <div className="rounded-full bg-white/10 overflow-hidden border border-white/10 h-1.5">
                <div
                  className="h-1.5 rounded-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{formatTime(audioRef.current?.currentTime)}</span>
                <span>{formatTime(audioRef.current?.duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="w-full space-y-6">
              {/* Play Controls */}
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={prevTrack}
                  className="size-14 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                >
                  <SkipBack size={24} className="text-slate-100" />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="size-16 rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition flex items-center justify-center shadow-lg"
                >
                  {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                </button>
                <button
                  type="button"
                  onClick={nextTrack}
                  className="size-14 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                >
                  <SkipForward size={24} className="text-slate-100" />
                </button>

                <div className="flex gap-3 w-fit items-center relative">
                  <button
                    type="button"
                    onClick={() => setShowVolume((prev) => !prev)}
                    className="rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center shrink-0"
                  >
                    <Volume2 className="text-slate-300" size={20} />
                  </button>
                  {showVolume && (
                    <div className="flex items-center translate-x-19 absolute gap-3 w-40 px-4 py-3 bg-white/5 rounded-full border border-white/10">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeImageModal}
                className="w-full py-3 rounded-full bg-white/5 hover:bg-white/10 transition border border-white/10 text-sm text-slate-300"
              >
                Back to Playlist
              </button>
            </div>
          </div>
        ) : (
          // Default Grid Layout
          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr] p-6 bg-slate-950/95 border border-white/10 backdrop-blur-xl shadow-[0_40px_120px_-40px_rgba(15,23,42,0.9)] text-white">
              <div className="space-y-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-5">
                      <div className={`size-24 rounded-md bg-linear-to-br from-sky-500/10 via-slate-900 to-slate-800 border border-white/10 shadow-inner flex items-center justify-center overflow-hidden cursor-pointer hover:shadow-[0_20px_60px_-20px_rgba(14,165,233,0.8)] transition-all duration-300`} onClick={openImageModal}>
                        {currentTrack.image ? (
                          <img
                            src={currentTrack.image}
                            alt={`${currentTrack.title} album art`}
                            className="w-full h-full object-cover rounded-md hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Music2 size={32} className="text-cyan-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400 tracking-[0.35em]">
                          Now Playing
                        </p>
                        <h3 className="text-3xl font-semibold mt-3 text-white">
                          {currentTrack.title}
                        </h3>
                        <p className="text-sm text-slate-300 mt-1">{currentTrack.artist}</p>
                      </div>
                  </div>
                  {/* <div className="rounded-3xl bg-white/5 border border-white/10 p-4 shadow-[0_20px_50px_-30px_rgba(14,165,233,0.6)]">
                    <p className="text-xs uppercase text-slate-400 tracking-[0.3em] mb-2">Album</p>
                    <p className="text-sm text-slate-200">{currentTrack.album}</p>
                  </div> */}
                </div>

                <div className="space-y-5">
                  <div className="rounded-full bg-white/10 overflow-hidden border border-white/10">
                    <div
                      className="h-2 rounded-full bg-cyan-400 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{formatTime(audioRef.current?.currentTime)}</span>
                    <span>{formatTime(audioRef.current?.duration)}</span>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row items-center justify-center">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={prevTrack}
                        className="size-12 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                      >
                        <SkipBack size={18} className="text-slate-100" />
                      </button>
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="size-14 rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition flex items-center justify-center"
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                      <button
                        type="button"
                        onClick={nextTrack}
                        className="size-12 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                      >
                        <SkipForward size={18} className="text-slate-100" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={() => setShowVolume(!showVolume)}
                        className="size-8 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center shrink-0"
                      >
                        <Volume2 className="text-slate-300" size={16} />
                      </button>
                      <span className="text-xs text-slate-300">{Math.round(volume * 100)}%</span>
                      {showVolume && (
                          <div className="flex items-center translate-x-19 absolute gap-3 w-40 px-4 py-3 bg-white/5 rounded-full border border-white/10">
                          <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={volume}
                              onChange={(e) => setVolume(Number(e.target.value))}
                              className="w-full accent-cyan-400 transition-all duration-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className=" border border-white/10 rounded-4xl p-5 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.8)] backdrop-blur-xl">
                <div className="space-y-4 mb-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase text-slate-400 tracking-[0.3em]">Playlist</p>
                      <p className="text-sm text-slate-200 mt-1">Search by song or artist</p>
                    </div>
                    <div className="rounded-full bg-slate-900/60 px-3 py-1 text-xs text-slate-200">
                      {filteredTracks.length} / {tracks.length} songs
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-900/80 border border-white/10 px-4 py-3">
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search songs…"
                      className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>
                {filteredTracks.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center text-sm text-slate-400">
                    No songs matched your search.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {filteredTracks.map((trackItem) => {
                      const index = tracks.findIndex((track) => track.id === trackItem.id);
                      return (
                        <li
                          key={trackItem.id}
                          onClick={() => selectTrack(index)}
                          className={`rounded-3xl p-4 cursor-pointer transition border border-white/10 ${
                            index === currentIndex
                              ? "bg-cyan-500/15 shadow-[0_8px_30px_-20px_rgba(14,165,233,0.7)] ring-1 ring-cyan-400/40"
                              : "bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-md bg-slate-800/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                {trackItem.image ? (
                                  <img
                                    src={trackItem.image}
                                    alt={`${trackItem.title} album art`}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                ) : (
                                  <Music2 size={16} className="text-slate-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-100">{trackItem.title}</p>
                                <p className="text-xs text-slate-400 mt-1">{trackItem.artist}</p>
                              </div>
                            </div>
                            {index === currentIndex && (
                              <span className="text-xs text-cyan-300 font-semibold">Playing</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
          </div>
        )}

        <audio ref={audioRef} src={currentTrack.src} preload="metadata" />
      </div>
    </>
  );
};

const MusicWindow = WindowWrapper(Music, "music");
export default MusicWindow;
