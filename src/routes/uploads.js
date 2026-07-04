import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '..', '..', config.uploadDir);

const storage = multer.diskStorage({
  destination: uploadDir,
  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter(req, file, cb) {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!allowed.test(ext)) {
      cb(new AppError(400, `File type .${ext} is not allowed`));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.use(authenticate);

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    throw new AppError(400, 'No file provided');
  }
  res.status(201).json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
  });
});

export default router;
