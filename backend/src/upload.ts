import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // Limite de 20MB para arquivos (Criterios PB01)
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "manual") {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("FORMAT_INVALID_MANUAL: Apenas arquivos PDF são permitidos para o manual."));
      }
    } else if (file.fieldname === "image") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("FORMAT_INVALID_IMAGE: Apenas imagens são permitidas para a foto."));
      }
    } else {
      cb(null, true);
    }
  },
});
export default upload;
