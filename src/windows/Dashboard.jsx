import React, { useCallback, useEffect, useRef, useState } from "react";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import WindowControls from "#components/WindowControls";
import useWindowStore from "#store/window.js";
import {
  Grid,
  SlidersHorizontal,
  Sparkles,
  Play,
  Eye,
  Upload,
  Loader,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  Save,
  X,
  ImagePlus,
  Images,
} from "lucide-react";

const dashboardItems = [
  { key: "finder", label: "Portfolio", description: "Open the project explorer." },
  { key: "safari", label: "Articles", description: "Open the Safari articles window." },
  { key: "photos", label: "Gallery", description: "Open the Photo gallery." },
  { key: "music", label: "Music", description: "Open the Music player." },
  { key: "video", label: "Videos", description: "Open the Video player." },
  { key: "contact", label: "Contact", description: "Open the contact form." },
  { key: "terminal", label: "Skills", description: "Open the terminal skills window." },
];

const dashboardMenuItems = [
  { key: "overview", label: "Overview", description: "Status and quick checks", icon: Grid },
  { key: "windows", label: "Windows", description: "Open and close modules", icon: SlidersHorizontal },
  { key: "gallery-list", label: "Gallery List", description: "Review gallery images", icon: Images },
  { key: "gallery-upload", label: "Gallery Upload", description: "Add gallery images", icon: ImagePlus },
  { key: "video-list", label: "Video List", description: "Review uploaded videos", icon: Play },
  { key: "video-upload", label: "Video Upload", description: "Add video content", icon: Upload },
];

const initialVideoForm = {
  title: "",
  album: "",
  duration: "",
  description: "",
  video: null,
  thumbnail: null,
};

const initialEditForm = {
  id: null,
  title: "",
  album: "",
  duration: "",
  description: "",
  src: "",
  thumbnail: "",
  videoFile: null,
  thumbnailFile: null,
};

const initialGalleryEditForm = {
  id: null,
  title: "",
  img: "",
  imageFile: null,
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return "";
  const totalSeconds = Math.round(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const Dashboard = () => {
  const { windows, openWindow, closeWindow, minimizedWindows } = useWindowStore();
  const uploadFormRef = useRef(null);
  const galleryFormRef = useRef(null);
  const [videoForm, setVideoForm] = useState(initialVideoForm);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [activeMenu, setActiveMenu] = useState("video-list");
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryMessage, setGalleryMessage] = useState("");
  const [galleryUploadError, setGalleryUploadError] = useState("");
  const [galleryEditForm, setGalleryEditForm] = useState(initialGalleryEditForm);
  const [savingGalleryEdit, setSavingGalleryEdit] = useState(false);
  const [galleryDeleteTarget, setGalleryDeleteTarget] = useState(null);
  const [deletingGalleryId, setDeletingGalleryId] = useState(null);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState("");
  const [editForm, setEditForm] = useState(initialEditForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const appKeys = dashboardItems.map((item) => item.key);
  const openCount = appKeys.filter(
    (key) => windows[key]?.isOpen && !windows[key]?.isMinimized
  ).length;
  const minimizedCount = minimizedWindows.length;
  const closedCount = appKeys.length - openCount;

  const handleToggle = (key) => {
    const win = windows[key];
    if (!win) return;
    if (win.isOpen && !win.isMinimized) {
      closeWindow(key);
    } else {
      openWindow(key);
    }
  };

  const closeAll = () => {
    appKeys.forEach((key) => {
      if (windows[key]?.isOpen) {
        closeWindow(key);
      }
    });
  };

  const fetchVideos = useCallback(async () => {
    try {
      setVideosLoading(true);
      const response = await fetch("/api/videos");
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load videos");
      }

      setVideos(data.videos || []);
      setVideosError("");
    } catch (error) {
      setVideosError(error instanceof Error ? error.message : "Failed to load videos");
    } finally {
      setVideosLoading(false);
    }
  }, []);

  const fetchGallery = useCallback(async () => {
    try {
      setGalleryLoading(true);
      const response = await fetch("/api/gallery");
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load gallery");
      }

      setGalleryItems(data.gallery || []);
      setGalleryError("");
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : "Failed to load gallery");
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
    fetchGallery();

    window.addEventListener("videos:changed", fetchVideos);
    window.addEventListener("gallery:changed", fetchGallery);
    return () => {
      window.removeEventListener("videos:changed", fetchVideos);
      window.removeEventListener("gallery:changed", fetchGallery);
    };
  }, [fetchGallery, fetchVideos]);

  const handleGalleryUpload = async (event) => {
    event.preventDefault();
    setGalleryMessage("");
    setGalleryUploadError("");

    if (galleryFiles.length === 0) {
      setGalleryUploadError("Please choose at least one image.");
      return;
    }

    const formData = new FormData();
    galleryFiles.forEach((file) => {
      formData.append("gallery", file);
    });

    try {
      setUploadingGallery(true);
      const token = sessionStorage.getItem("dashboardToken");
      const response = await fetch("/api/gallery", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gallery upload failed");
      }

      setGalleryFiles([]);
      galleryFormRef.current?.reset();
      setGalleryMessage("Gallery images uploaded successfully.");
      await fetchGallery();
      setActiveMenu("gallery-list");
      openWindow("photos");
      window.dispatchEvent(new CustomEvent("gallery:changed"));
    } catch (error) {
      setGalleryUploadError(
        error instanceof Error ? error.message : "Gallery upload failed"
      );
    } finally {
      setUploadingGallery(false);
    }
  };

  const startEditGallery = (item) => {
    setGalleryMessage("");
    setGalleryUploadError("");
    setGalleryDeleteTarget(null);
    setGalleryEditForm({
      id: item.id,
      title: item.title || "Gallery image",
      img: item.img,
      imageFile: null,
    });
  };

  const cancelEditGallery = () => {
    setGalleryEditForm(initialGalleryEditForm);
  };

  const updateGalleryEditForm = (field, value) => {
    setGalleryEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGalleryUpdate = async (event) => {
    event.preventDefault();
    if (!galleryEditForm.id) return;

    const formData = new FormData();
    formData.append("title", galleryEditForm.title.trim() || "Gallery image");

    if (galleryEditForm.imageFile) {
      formData.append("gallery", galleryEditForm.imageFile);
    }

    try {
      setSavingGalleryEdit(true);
      setGalleryMessage("");
      setGalleryUploadError("");
      const token = sessionStorage.getItem("dashboardToken");
      const response = await fetch(`/api/gallery/${galleryEditForm.id}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gallery update failed");
      }

      setGalleryMessage("Gallery image updated successfully.");
      setGalleryEditForm(initialGalleryEditForm);
      await fetchGallery();
      window.dispatchEvent(new CustomEvent("gallery:changed"));
    } catch (error) {
      setGalleryUploadError(
        error instanceof Error ? error.message : "Gallery update failed"
      );
    } finally {
      setSavingGalleryEdit(false);
    }
  };

  const requestDeleteGallery = (item) => {
    setGalleryMessage("");
    setGalleryUploadError("");
    setGalleryEditForm(initialGalleryEditForm);
    setGalleryDeleteTarget(item);
  };

  const cancelDeleteGallery = () => {
    setGalleryDeleteTarget(null);
  };

  const confirmDeleteGallery = async () => {
    if (!galleryDeleteTarget) return;

    try {
      setDeletingGalleryId(galleryDeleteTarget.id);
      setGalleryMessage("");
      setGalleryUploadError("");
      const token = sessionStorage.getItem("dashboardToken");
      const response = await fetch(`/api/gallery/${galleryDeleteTarget.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gallery delete failed");
      }

      setGalleryMessage("Gallery image deleted successfully.");
      setGalleryDeleteTarget(null);
      await fetchGallery();
      window.dispatchEvent(new CustomEvent("gallery:changed"));
    } catch (error) {
      setGalleryUploadError(
        error instanceof Error ? error.message : "Gallery delete failed"
      );
    } finally {
      setDeletingGalleryId(null);
    }
  };

  const updateVideoForm = (field, value) => {
    setVideoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleVideoFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    updateVideoForm("video", file);
    setUploadError("");

    if (!file) return;

    const previewVideo = document.createElement("video");
    previewVideo.preload = "metadata";
    previewVideo.onloadedmetadata = () => {
      window.URL.revokeObjectURL(previewVideo.src);
      setVideoForm((prev) => ({
        ...prev,
        duration: prev.duration || formatDuration(previewVideo.duration),
      }));
    };
    previewVideo.src = URL.createObjectURL(file);
  };

  const handleVideoUpload = async (event) => {
    event.preventDefault();
    setUploadMessage("");
    setUploadError("");

    if (!videoForm.video) {
      setUploadError("Please choose a video file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", videoForm.title.trim());
    formData.append("album", videoForm.album.trim());
    formData.append("duration", videoForm.duration.trim());
    formData.append("description", videoForm.description.trim());
    formData.append("video", videoForm.video);

    if (videoForm.thumbnail) {
      formData.append("thumbnail", videoForm.thumbnail);
    }

    try {
      setUploadingVideo(true);
      const token = sessionStorage.getItem("dashboardToken");
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Video upload failed");
      }

      setVideoForm(initialVideoForm);
      uploadFormRef.current?.reset();
      setUploadMessage("Video uploaded successfully.");
      await fetchVideos();
      setActiveMenu("video-list");
      openWindow("video");
      window.dispatchEvent(new CustomEvent("videos:changed"));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Video upload failed");
    } finally {
      setUploadingVideo(false);
    }
  };

  const startEditVideo = (video) => {
    setUploadMessage("");
    setUploadError("");
    setEditForm({
      id: video.id,
      title: video.title || "",
      album: video.album || "",
      duration: video.duration || "",
      description: video.description || "",
      src: video.src || "",
      thumbnail: video.thumbnail || "",
      videoFile: null,
      thumbnailFile: null,
    });
  };

  const updateEditForm = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditVideoFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    updateEditForm("videoFile", file);
    setUploadError("");

    if (!file) return;

    const previewVideo = document.createElement("video");
    previewVideo.preload = "metadata";
    previewVideo.onloadedmetadata = () => {
      window.URL.revokeObjectURL(previewVideo.src);
      setEditForm((prev) => ({
        ...prev,
        duration: formatDuration(previewVideo.duration) || prev.duration,
      }));
    };
    previewVideo.src = URL.createObjectURL(file);
  };

  const cancelEditVideo = () => {
    setEditForm(initialEditForm);
  };

  const handleVideoUpdate = async (event) => {
    event.preventDefault();
    if (!editForm.id) return;

    try {
      setSavingEdit(true);
      setUploadMessage("");
      setUploadError("");
      const token = sessionStorage.getItem("dashboardToken");
      const formData = new FormData();
      formData.append("title", editForm.title.trim());
      formData.append("album", editForm.album.trim());
      formData.append("duration", editForm.duration.trim());
      formData.append("description", editForm.description.trim());
      formData.append("existingSrc", editForm.src);
      formData.append("existingThumbnail", editForm.thumbnail);

      if (editForm.videoFile) {
        formData.append("video", editForm.videoFile);
      }

      if (editForm.thumbnailFile) {
        formData.append("thumbnail", editForm.thumbnailFile);
      }

      const response = await fetch(`/api/videos/${editForm.id}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Video update failed");
      }

      setUploadMessage("Video updated successfully.");
      setEditForm(initialEditForm);
      await fetchVideos();
      window.dispatchEvent(new CustomEvent("videos:changed"));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Video update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleVideoDelete = async (video) => {
    const confirmed = window.confirm(`Delete "${video.title}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(video.id);
      setUploadMessage("");
      setUploadError("");
      const token = sessionStorage.getItem("dashboardToken");
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Video delete failed");
      }

      if (editForm.id === video.id) {
        setEditForm(initialEditForm);
      }

      setUploadMessage("Video deleted successfully.");
      await fetchVideos();
      window.dispatchEvent(new CustomEvent("videos:changed"));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Video delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-slate-950/95 p-6 h-full w-full overflow-y-auto">
      <div id="window-header" className="bg-white">
        <WindowControls target="dashboard" />
        <h2>Dashboard</h2>
      </div>

      <div className="grid min-h-[640px] gap-6 border border-white/10 bg-slate-900/60 text-white shadow-[0_40px_120px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex flex-col overflow-hidden border-r border-white/10 bg-white/5 p-4">
          <div className="mb-4 border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Dashboard
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Control menu
            </h3>
          </div>

          <div className="space-y-2">
            {dashboardMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveMenu(item.key)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? "border-cyan-400/40 bg-cyan-500/15 text-white shadow-[0_8px_30px_-20px_rgba(14,165,233,0.7)]"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-10 items-center justify-center rounded-2xl ${
                        isActive ? "bg-cyan-400 text-slate-950" : "bg-slate-950/80 text-slate-400"
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {item.description}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                Open panels
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{openCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                Minimized
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{minimizedCount}</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 overflow-y-auto p-6">
          {activeMenu === "overview" && (
            <div>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    Control Panel
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Website dashboard
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-slate-400">
                    Use this dashboard to open and close app windows, track active panels,
                    and manage the portfolio experience from one place.
                  </p>
                </div>
                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-cyan-200 shadow-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles size={18} />
                    Live control
                  </div>
                </div>
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Open panels</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{openCount}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Minimized</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{minimizedCount}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Closed</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{closedCount}</p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Next action</p>
                      <p className="mt-2 text-sm text-white">Open the Video player and review new uploads.</p>
                    </div>
                    <Play className="text-cyan-400" />
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Website health</p>
                      <p className="mt-2 text-sm text-white">All portfolio windows are ready for interaction.</p>
                    </div>
                    <Eye className="text-emerald-400" />
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Settings</p>
                      <p className="mt-2 text-sm text-white">Control window visibility from this dashboard.</p>
                    </div>
                    <SlidersHorizontal className="text-cyan-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "windows" && (
            <div>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    Modules
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Window manager
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeAll}
                  className="rounded-3xl bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Close all windows
                </button>
              </div>

              <div className="space-y-4">
                {dashboardItems.map((item) => {
                  const win = windows[item.key];
                  const isActive = win?.isOpen && !win?.isMinimized;
                  return (
                    <div
                      key={item.key}
                      className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                            {isActive ? "Open" : win?.isMinimized ? "Minimized" : "Closed"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggle(item.key)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              isActive
                                ? "bg-red-500 text-white hover:bg-red-400"
                                : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                            }`}
                          >
                            {isActive ? "Close" : "Open"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeMenu === "gallery-list" && (
            <div>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    Gallery
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Gallery images
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {galleryItems.length} images are available in the Gallery window.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMenu("gallery-upload")}
                  className="flex items-center justify-center gap-2 rounded-3xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  <ImagePlus size={16} />
                  Add images
                </button>
              </div>

              {galleryMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  <CheckCircle2 size={16} />
                  {galleryMessage}
                </div>
              )}

              {galleryUploadError && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  <AlertCircle size={16} />
                  {galleryUploadError}
                </div>
              )}

              {galleryDeleteTarget && (
                <div className="mb-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-4">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 flex-none overflow-hidden rounded-2xl border border-white/10 bg-slate-800">
                      <img
                        src={galleryDeleteTarget.img}
                        alt={galleryDeleteTarget.title || "Gallery image"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">Delete gallery image?</p>
                      <p className="mt-1 text-xs text-rose-100">
                        This removes the record and deletes the uploaded image file when it is inside public/images/gallery.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={cancelDeleteGallery}
                          className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={confirmDeleteGallery}
                          disabled={deletingGalleryId === galleryDeleteTarget.id}
                          className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                        >
                          {deletingGalleryId === galleryDeleteTarget.id ? (
                            <Loader className="animate-spin" size={14} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {galleryEditForm.id && (
                <form
                  onSubmit={handleGalleryUpdate}
                  className="mb-6 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
                        Edit gallery
                      </p>
                      <p className="mt-2 text-sm text-white">{galleryEditForm.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={cancelEditGallery}
                      className="flex size-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-white/20"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
                    <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-slate-800">
                      <img
                        src={galleryEditForm.img}
                        alt={galleryEditForm.title || "Gallery image"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-300">Title</span>
                        <input
                          type="text"
                          value={galleryEditForm.title}
                          onChange={(event) =>
                            updateGalleryEditForm("title", event.target.value)
                          }
                          required
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-300">Replace image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            updateGalleryEditForm(
                              "imageFile",
                              event.target.files?.[0] || null
                            )
                          }
                          className="w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-400 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingGalleryEdit}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                  >
                    {savingGalleryEdit ? (
                      <>
                        <Loader className="animate-spin" size={16} />
                        Saving
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save gallery
                      </>
                    )}
                  </button>
                </form>
              )}

              {galleryLoading && (
                <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
                  <div className="text-center text-slate-300">
                    <Loader className="mx-auto mb-3 animate-spin text-cyan-400" size={28} />
                    <p className="text-sm">Loading gallery...</p>
                  </div>
                </div>
              )}

              {!galleryLoading && galleryError && (
                <div className="flex min-h-72 items-center justify-center rounded-3xl border border-rose-400/20 bg-rose-500/10">
                  <div className="text-center text-rose-200">
                    <AlertCircle className="mx-auto mb-3" size={28} />
                    <p className="text-sm">{galleryError}</p>
                  </div>
                </div>
              )}

              {!galleryLoading && !galleryError && galleryItems.length === 0 && (
                <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
                  <div className="text-center text-slate-300">
                    <Images className="mx-auto mb-3 text-cyan-400" size={28} />
                    <p className="text-sm">No gallery images yet.</p>
                  </div>
                </div>
              )}

              {!galleryLoading && !galleryError && galleryItems.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {galleryItems.map((item) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 text-left transition hover:border-cyan-400/40 hover:bg-white/10"
                    >
                      <div className="aspect-square bg-slate-800">
                        <img
                          src={item.img}
                          alt={item.title || "Gallery image"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-3 p-3">
                        <p className="truncate text-sm font-semibold text-white">
                          {item.title || "Gallery image"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openWindow("imgfile", {
                                id: item.id,
                                name: item.title || "Gallery image",
                                icon: "/images/image.png",
                                kind: "file",
                                fileType: "img",
                                imageUrl: item.img,
                              })
                            }
                            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditGallery(item)}
                            className="flex items-center gap-1 rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteGallery(item)}
                            className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-400"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMenu === "gallery-upload" && (
            <div>
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
                    Gallery upload
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Add gallery images
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Upload one or more images for the Gallery window.
                  </p>
                </div>
                <ImagePlus className="text-cyan-300" size={22} />
              </div>

              <form
                ref={galleryFormRef}
                onSubmit={handleGalleryUpload}
                className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5"
              >
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-300">Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setGalleryFiles(Array.from(event.target.files || []))
                    }
                    required
                    className="w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-400 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950"
                  />
                </label>

                {galleryFiles.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                    {galleryFiles.length} image{galleryFiles.length > 1 ? "s" : ""} selected
                  </div>
                )}

                {galleryMessage && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    <CheckCircle2 size={16} />
                    {galleryMessage}
                  </div>
                )}

                {galleryUploadError && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    <AlertCircle size={16} />
                    {galleryUploadError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploadingGallery}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                >
                  {uploadingGallery ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      Uploading
                    </>
                  ) : (
                    <>
                      <ImagePlus size={16} />
                      Add to gallery
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {activeMenu === "video-list" && (
            <div>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    Videos
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Video CRUD manager
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Create, read, update, and delete videos for the Video player.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMenu("video-upload")}
                  className="flex items-center justify-center gap-2 rounded-3xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  <Upload size={16} />
                  Add video
                </button>
              </div>

              {uploadMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  <CheckCircle2 size={16} />
                  {uploadMessage}
                </div>
              )}

              {uploadError && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  <AlertCircle size={16} />
                  {uploadError}
                </div>
              )}

              {editForm.id && (
                <form
                  onSubmit={handleVideoUpdate}
                  className="mb-6 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
                        Edit video
                      </p>
                      <p className="mt-2 text-sm text-white">{editForm.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={cancelEditVideo}
                      className="flex size-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-white/20"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-300">Title</span>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(event) => updateEditForm("title", event.target.value)}
                        required
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-300">Album</span>
                        <input
                          type="text"
                          value={editForm.album}
                          onChange={(event) => updateEditForm("album", event.target.value)}
                          required
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-300">Duration</span>
                        <input
                          type="text"
                          value={editForm.duration}
                          onChange={(event) => updateEditForm("duration", event.target.value)}
                          required
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-300">Description</span>
                      <textarea
                        value={editForm.description}
                        onChange={(event) => updateEditForm("description", event.target.value)}
                        required
                        rows={3}
                        className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-300">Replace video</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleEditVideoFileChange}
                          className="w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-400 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-300">Replace thumbnail</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            updateEditForm("thumbnailFile", event.target.files?.[0] || null)
                          }
                          className="w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                  >
                    {savingEdit ? (
                      <>
                        <Loader className="animate-spin" size={16} />
                        Saving
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save changes
                      </>
                    )}
                  </button>
                </form>
              )}

              {videosLoading && (
                <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
                  <div className="text-center text-slate-300">
                    <Loader className="mx-auto mb-3 animate-spin text-cyan-400" size={28} />
                    <p className="text-sm">Loading videos...</p>
                  </div>
                </div>
              )}

              {!videosLoading && videosError && (
                <div className="flex min-h-72 items-center justify-center rounded-3xl border border-rose-400/20 bg-rose-500/10">
                  <div className="text-center text-rose-200">
                    <AlertCircle className="mx-auto mb-3" size={28} />
                    <p className="text-sm">{videosError}</p>
                  </div>
                </div>
              )}

              {!videosLoading && !videosError && videos.length === 0 && (
                <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
                  <div className="text-center text-slate-300">
                    <Play className="mx-auto mb-3 text-cyan-400" size={28} />
                    <p className="text-sm">No videos uploaded yet.</p>
                  </div>
                </div>
              )}

              {!videosLoading && !videosError && videos.length > 0 && (
                <div className="grid gap-4 xl:grid-cols-2">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="rounded-3xl border border-white/10 bg-slate-950/80 p-3 text-left transition hover:border-cyan-400/40 hover:bg-white/10"
                    >
                      <div className="flex gap-3">
                        <div className="h-20 w-28 flex-none overflow-hidden rounded-2xl border border-white/10 bg-slate-800">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-white">
                              {video.title}
                            </p>
                            <span className="flex-none rounded-full bg-slate-800/80 px-2 py-1 text-[10px] text-slate-400">
                              {video.duration}
                            </span>
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-cyan-200">
                            {video.album}
                          </p>
                          <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                            {video.description}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openWindow("video")}
                              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditVideo(video)}
                              className="flex items-center gap-1 rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
                            >
                              <Pencil size={13} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVideoDelete(video)}
                              disabled={deletingId === video.id}
                              className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                            >
                              {deletingId === video.id ? (
                                <Loader className="animate-spin" size={13} />
                              ) : (
                                <Trash2 size={13} />
                              )}
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMenu === "video-upload" && (
            <div>
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
                    Video upload
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Add a video
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Upload a video file with metadata for the Video player playlist.
                  </p>
                </div>
                <Upload className="text-cyan-300" size={22} />
              </div>

              <form
                ref={uploadFormRef}
                onSubmit={handleVideoUpload}
                className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5"
              >
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-slate-300">Title</span>
                    <input
                      type="text"
                      value={videoForm.title}
                      onChange={(event) => updateVideoForm("title", event.target.value)}
                      required
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                      placeholder="My video title"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-300">Album</span>
                      <input
                        type="text"
                        value={videoForm.album}
                        onChange={(event) => updateVideoForm("album", event.target.value)}
                        required
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                        placeholder="Short Films"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-300">Duration</span>
                      <input
                        type="text"
                        value={videoForm.duration}
                        onChange={(event) => updateVideoForm("duration", event.target.value)}
                        required
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                        placeholder="0:30"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-slate-300">Description</span>
                    <textarea
                      value={videoForm.description}
                      onChange={(event) => updateVideoForm("description", event.target.value)}
                      required
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                      placeholder="Short description for the video player"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-slate-300">Video file</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      required
                      className="w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-400 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-slate-300">Thumbnail</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        updateVideoForm("thumbnail", event.target.files?.[0] || null)
                      }
                      className="w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />
                  </label>
                </div>

                {uploadMessage && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    <CheckCircle2 size={16} />
                    {uploadMessage}
                  </div>
                )}

                {uploadError && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    <AlertCircle size={16} />
                    {uploadError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploadingVideo}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                >
                  {uploadingVideo ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      Uploading
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Add video
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const DashboardWindow = WindowWrapper(Dashboard, "dashboard");
export default DashboardWindow;
