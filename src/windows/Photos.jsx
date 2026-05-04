import { AlertCircle, Loader, Mail, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import WindowWrapper from "#hoc/WindowWrapper";
import WindowControls from "#components/WindowControls";
import { photosLinks } from "#constants";
import useWindowStore from "#store/window";

const Photos = () => {
  const { openWindow } = useWindowStore();
  const [galleryItems, setGalleryItems] = useState([]);
  const [activeTab, setActiveTab] = useState(photosLinks[0]?.title || "Library");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gallery");
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load gallery");
      }

      setGalleryItems(data.gallery || []);
      setError("");
    } catch (error) {
      console.error("Fetch gallery error:", error);
      setGalleryItems([]);
      setError(error instanceof Error ? error.message : "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();

    window.addEventListener("gallery:changed", fetchGallery);
    return () => {
      window.removeEventListener("gallery:changed", fetchGallery);
    };
  }, [fetchGallery]);

  const getVisibleGallery = () => {
    if (activeTab === "Library") return galleryItems;
    if (activeTab === "Memories") return galleryItems.slice(0, 8);
    if (activeTab === "Favorites") return galleryItems.slice(0, 4);
    if (activeTab === "Places") {
      return galleryItems.filter((_, index) => index % 2 === 0);
    }
    if (activeTab === "People") {
      return galleryItems.filter((_, index) => index % 2 === 1);
    }
    return galleryItems;
  };

  const visibleGallery = getVisibleGallery();

  return (
    <>
        <div id="window-header">
            <WindowControls target="photos" />

            <div className="w-full flex justify-end items-center gap-3">
                <Mail className="icon" />
                <Search className="icon" />
            </div>
        </div>

        <div className="flex w-full">
            <div className="sidebar">
                <h2>Photos</h2>
                <ul>
                    {photosLinks.map(({ id, icon, title }) => (
                        <li
                          key={id}
                          onClick={() => setActiveTab(title)}
                          className={
                            activeTab === title
                              ? "bg-blue-100 text-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }
                        >
                            <img src={icon} alt={title} />
                            <p>{title}</p>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="gallery">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-400">{activeTab}</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {visibleGallery.length} image{visibleGallery.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                {loading && (
                  <div className="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                    <div className="text-center">
                      <Loader className="mx-auto mb-3 animate-spin text-blue-500" size={24} />
                      <p className="text-sm">Loading gallery...</p>
                    </div>
                  </div>
                )}

                {!loading && error && (
                  <div className="flex h-80 items-center justify-center rounded-lg bg-red-50 text-red-500">
                    <div className="text-center">
                      <AlertCircle className="mx-auto mb-3" size={24} />
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {!loading && !error && visibleGallery.length === 0 && (
                  <div className="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                    <p className="text-sm">No images in {activeTab}.</p>
                  </div>
                )}

                {!loading && !error && visibleGallery.length > 0 && (
                  <ul>
                {visibleGallery.map(({ id, img, title }) => (
                    <li 
                    key={id}
                    onClick={() => 
                        openWindow("imgfile", {
                        id,
                        name: "Gallery image",
                        icon: "/images/image.png",
                    kind: "file",
                    fileType: "img",
                    imageUrl: img,
                    })}
                >
                    <img src={img} alt={title || `Gallery image ${id}`} />
                </li>
                ))}
            </ul>
                )}
            </div>
        </div>
    </>
  );
}
const PhotosWindow = WindowWrapper(Photos, "photos");
export default PhotosWindow;
