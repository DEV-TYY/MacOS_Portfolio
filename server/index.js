import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { query } from "./config/database.js";
import { createUsersTable, findUserByCredentials, createUser, getUserCount } from "./models/User.js";
import {
  createVideosTable,
  getAllVideos,
  createVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  getVideoCount,
} from "./models/Video.js";
import {
  createGalleryTable,
  getAllGalleryImages,
  createGalleryImage,
  getGalleryImageById,
  updateGalleryImage,
  deleteGalleryImage,
  getGalleryCount,
} from "./models/Gallery.js";
import upload from "./middleware/upload.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const videosRoot = path.resolve(process.cwd(), "public/videos");
const galleryRoot = path.resolve(process.cwd(), "public/images/gallery");
const defaultGallery = [
  { img: "/images/gal1.png", title: "Gallery image 1" },
  { img: "/images/gal2.png", title: "Gallery image 2" },
  { img: "/images/gal3.png", title: "Gallery image 3" },
  { img: "/images/gal4.png", title: "Gallery image 4" },
];

const deleteVideoAsset = async (assetUrl) => {
  if (!assetUrl || !assetUrl.startsWith("/videos/")) return;
  if (assetUrl === "/videos/thumbnails/default.png") return;

  const relativePath = assetUrl.replace(/^\/videos\//, "");
  const absolutePath = path.resolve(videosRoot, relativePath);

  if (!absolutePath.startsWith(videosRoot + path.sep)) return;

  try {
    await fs.unlink(absolutePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`Could not delete video asset: ${assetUrl}`, err.message);
    }
  }
};

const deleteGalleryAsset = async (assetUrl) => {
  if (!assetUrl || !assetUrl.startsWith("/images/gallery/")) return;

  const relativePath = assetUrl.replace(/^\/images\/gallery\//, "");
  const absolutePath = path.resolve(galleryRoot, relativePath);

  if (!absolutePath.startsWith(galleryRoot + path.sep)) return;

  try {
    await fs.unlink(absolutePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`Could not delete gallery asset: ${assetUrl}`, err.message);
    }
  }
};

const uploadAny = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({
      success: false,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Video file is too large."
          : err.message || "File upload failed",
    });
  });
};

app.use((req, res, next) => {
  req.setTimeout(0);
  res.setTimeout(0);
  next();
});

app.use("/videos", express.static("public/videos"));
app.use("/images", express.static("public/images"));

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Test database connection and initialize tables
const initializeDatabase = async () => {
  try {
    // Test connection
    await query("SELECT 1");

    // Create tables
    await createUsersTable();
    await createVideosTable();
    await createGalleryTable();

    // Initialize default data if empty
    const userCount = await getUserCount();
    if (userCount === 0) {
      await createUser("admin", "admin1234");
      console.log("✓ Default user created");
    }

    const videoCount = await getVideoCount();

    const galleryCount = await getGalleryCount();
    if (galleryCount === 0) {
      for (const image of defaultGallery) {
        await createGalleryImage(image);
      }
      try {
        await fs.mkdir(galleryRoot, { recursive: true });
        const uploadedFiles = await fs.readdir(galleryRoot);
        for (const file of uploadedFiles) {
          if (/\.(png|jpe?g|gif|webp|avif)$/i.test(file)) {
            await createGalleryImage({
              img: `/images/gallery/${file}`,
              title: "Gallery image",
            });
          }
        }
      } catch (err) {
        console.warn("Could not import uploaded gallery images:", err.message);
      }
      console.log("✓ Default gallery images created");
    }

    console.log("✓ MySQL database initialized");
  } catch (err) {
    console.error("✗ Database initialization failed:", err.message);
    process.exit(1);
  }
};

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await findUserByCredentials(username, password);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    return res.json({ success: true, token: "dashboard-token" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== VIDEO CRUD ROUTES ====================

// ==================== GALLERY ROUTES ====================

app.get("/api/gallery", async (req, res) => {
  try {
    const gallery = await getAllGalleryImages();
    res.json({ success: true, gallery });
  } catch (err) {
    console.error("Fetch gallery error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/gallery", uploadAny, async (req, res) => {
  try {
    const files = req.files || [];
    const imageFiles = files.filter((file) => file.mimetype.startsWith("image/"));

    if (imageFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image file",
      });
    }

    const uploaded = [];
    for (const file of imageFiles) {
      const img = `/images/gallery/${file.filename}`;
      const id = await createGalleryImage({ img });
      uploaded.push({ id, img, title: "Gallery image" });
    }

    res.status(201).json({
      success: true,
      message: "Gallery images uploaded successfully",
      gallery: uploaded,
    });
  } catch (err) {
    console.error("Gallery upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/gallery/:id", uploadAny, async (req, res) => {
  try {
    const { id } = req.params;
    const existingImage = await getGalleryImageById(id);

    if (!existingImage) {
      return res.status(404).json({ success: false, message: "Gallery image not found" });
    }

    const files = req.files || [];
    const imageFile = files.find((file) => file.mimetype.startsWith("image/"));

    const updatedImage = {
      img: imageFile ? `/images/gallery/${imageFile.filename}` : existingImage.img,
      title: req.body.title || existingImage.title,
    };

    const affectedRows = await updateGalleryImage(id, updatedImage);

    if (affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Gallery image not found" });
    }

    if (imageFile) {
      await deleteGalleryAsset(existingImage.img);
    }

    res.json({
      success: true,
      message: "Gallery image updated successfully",
      galleryImage: { id: Number(id), ...updatedImage },
    });
  } catch (err) {
    console.error("Gallery update error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/gallery/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existingImage = await getGalleryImageById(id);

    if (!existingImage) {
      return res.status(404).json({ success: false, message: "Gallery image not found" });
    }

    const affectedRows = await deleteGalleryImage(id);

    if (affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Gallery image not found" });
    }

    await deleteGalleryAsset(existingImage.img);

    res.json({ success: true, message: "Gallery image deleted successfully" });
  } catch (err) {
    console.error("Gallery delete error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all videos
app.get("/api/videos", async (req, res) => {
  try {
    const videos = await getAllVideos();
    res.json({ success: true, videos });
  } catch (err) {
    console.error("Fetch videos error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create new video with file upload (video + optional thumbnail)
// ==================== VIDEO UPLOAD (TEMPORARY DEBUG) ====================
app.post("/api/videos", uploadAny, async (req, res) => {   // ← upload.any() accepts any field name
  try {
    console.log("🔍 Files received:", req.files ? req.files.map(f => f.fieldname) : "No files");
    console.log("📝 Body received:", req.body);

    const { title, album, duration, description } = req.body;

    if (!title || !album || !duration || !description) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, album, duration, and description are required" 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No video file uploaded",
        receivedFields: req.files ? req.files.map(f => f.fieldname) : []
      });
    }

    // Find the video file (whatever field name it is)
    const videoFile = req.files.find(file => 
      file.fieldname.includes("video") || 
      file.mimetype.startsWith("video/")
    );

    if (!videoFile) {
      return res.status(400).json({ 
        success: false, 
        message: "Video file not found" 
      });
    }

    if (!videoFile.mimetype.startsWith("video/")) {
      return res.status(400).json({
        success: false,
        message: "Only video files allowed",
      });
    }

    const thumbnailFile = req.files.find(file =>
        file.fieldname.includes("thumbnail") ||
        file.mimetype.startsWith("image/")
    );

    if (thumbnailFile && !thumbnailFile.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only images allowed for thumbnails",
      });
    }

    const videoPath = `/videos/${videoFile.filename}`;

    const thumbnailPath = thumbnailFile
        ? `/videos/thumbnails/${thumbnailFile.filename}`
        : "";

    const videoId = await createVideo({
      title,
      album,
      duration,
      src: videoPath,
      thumbnail: thumbnailPath,
      description: description || "",
    });

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      videoId,
      videoUrl: videoPath
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single video by ID
app.get("/api/videos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM videos WHERE id = ?";
    const result = await query(sql, [id]);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    res.json({ success: true, video: result[0] });
  } catch (err) {
    console.error("Get video error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update video metadata and optionally replace video/thumbnail files
app.put("/api/videos/:id", uploadAny, async (req, res) => {
  try {
    const { id } = req.params;
    const existingVideo = await getVideoById(id);

    if (!existingVideo) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const files = req.files || [];
    const videoFile = files.find(file =>
      file.fieldname.includes("video") ||
      file.mimetype.startsWith("video/")
    );
    const thumbnailFile = files.find(file =>
      file.fieldname.includes("thumbnail") ||
      file.mimetype.startsWith("image/")
    );

    if (videoFile && !videoFile.mimetype.startsWith("video/")) {
      return res.status(400).json({
        success: false,
        message: "Only video files allowed",
      });
    }

    if (thumbnailFile && !thumbnailFile.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only images allowed for thumbnails",
      });
    }

    const updatedVideo = {
      title: req.body.title || existingVideo.title,
      album: req.body.album || existingVideo.album,
      duration: req.body.duration || existingVideo.duration,
      src: videoFile
        ? `/videos/${videoFile.filename}`
        : req.body.existingSrc || existingVideo.src,
      thumbnail: thumbnailFile
        ? `/videos/thumbnails/${thumbnailFile.filename}`
        : req.body.existingThumbnail || existingVideo.thumbnail,
      description: req.body.description || existingVideo.description,
    };

    const affectedRows = await updateVideo(id, updatedVideo);

    if (affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    res.json({ success: true, message: "Video updated successfully" });
  } catch (err) {
    console.error("Update video error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete video
app.delete("/api/videos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existingVideo = await getVideoById(id);

    if (!existingVideo) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const affectedRows = await deleteVideo(id);

    if (affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    await Promise.all([
      deleteVideoAsset(existingVideo.src),
      deleteVideoAsset(existingVideo.thumbnail),
    ]);

    res.json({ success: true, message: "Video deleted successfully" });
  } catch (err) {
    console.error("Delete video error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// Get dashboard status
app.get("/api/dashboard/status", async (req, res) => {
  try {
    const authHeader = req.header("authorization");
    if (authHeader !== "Bearer dashboard-token") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    res.json({ success: true, message: "Dashboard is available" });
  } catch (err) {
    console.error("Dashboard status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Start server
const server = app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`🗄️  MySQL Database: ${process.env.DB_NAME}`);
  console.log(`👤 MySQL User: ${process.env.DB_USER}\n`);
});

server.requestTimeout = 0;
server.headersTimeout = 0;
