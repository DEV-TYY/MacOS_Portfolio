import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dest = "public";

    if (file.fieldname.includes("thumbnail")) {
      dest = "public/videos/thumbnails";
    } else if (
      file.fieldname.includes("gallery") ||
      file.fieldname.includes("photo") ||
      file.fieldname.includes("image")
    ) {
      dest = "public/images/gallery";
    } else  {
      dest = "public/videos";
    }

    const absoluteDest = path.join(process.cwd(), dest);
    fs.mkdirSync(absoluteDest, { recursive: true });
    cb(null, absoluteDest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage: storage,
});

export default upload;
