import express, { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: Router = express.Router();

// carpeta /uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// nombre único
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `alumno_${Date.now()}${ext || ".png"}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    if (!ok) return cb(new Error("Tipo de archivo no permitido"));
    cb(null, true);
  },
});

// POST /api/upload/photo  (form-data: field "photo")
router.post("/photo", upload.single("photo"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: "Foto requerida" });
    return;
  }
  // servida estáticamente desde /uploads
  const publicUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: publicUrl });
});

export default router;
