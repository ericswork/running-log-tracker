import multer from 'multer'
import type { Request, Response, NextFunction } from 'express'
import { parseGpx, GpxParseError } from '../gpx/parse'

const MAX_GPX_BYTES = 5 * 1024 * 1024 // 5 MB

const upload = multer({
  storage: multer.memoryStorage(), // parse in memory; never write to disk
  limits: { fileSize: MAX_GPX_BYTES },
})

// 400 body in the same shape the rest of the API uses for validation errors.
function badRequest(res: Response, message: string, path = 'file'): void {
  res.status(400).json({ error: 'ValidationError', details: [{ path, message }] })
}

// Multer middleware wrapper that maps upload-level errors (e.g. the size limit)
// to a structured 400 instead of letting them hit the default error handler.
export function gpxUpload(req: Request, res: Response, next: NextFunction): void {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        badRequest(res, 'File exceeds the maximum allowed size (5 MB)')
        return
      }
      badRequest(res, 'File upload failed')
      return
    }
    next()
  })
}

// POST /api/runs/import — parse an uploaded .gpx and return the extracted run
// fields. Does not persist anything; the client saves via POST /api/runs.
export function importRun(req: Request, res: Response): void {
  const file = req.file
  if (!file) {
    badRequest(res, 'No GPX file provided (expected form field "file")')
    return
  }
  if (!file.originalname.toLowerCase().endsWith('.gpx')) {
    badRequest(res, 'Uploaded file must be a .gpx file')
    return
  }
  try {
    const parsed = parseGpx(file.buffer.toString('utf8'))
    res.json(parsed)
  } catch (e) {
    if (e instanceof GpxParseError) {
      badRequest(res, e.message)
      return
    }
    throw e
  }
}
