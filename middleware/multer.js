const fs = require('fs').promises;
const multer = require('multer');
const path = require('path');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
};

const uploadDirs = {
  profile: path.join(__dirname, '..', 'public', 'uploads', 'profiles'), 
  poster: path.join(__dirname, '..', 'public', 'uploads', 'posters'),
  cast: path.join(__dirname, '..', 'public', 'uploads', 'casts'),
  banner: path.join(__dirname, '..', 'public', 'uploads', 'banners')
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      let dir;
      if (file.fieldname === "poster") dir = uploadDirs.poster;
      else if (file.fieldname === "casts") dir = uploadDirs.cast;
      else if (file.fieldname === "banner") dir = uploadDirs.banner;
      else if (file.fieldname === "profilePic") dir = uploadDirs.profile;
      else dir = path.join(__dirname, '..', 'public', 'uploads', 'others');

      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      console.error('Failed to create directory', err);
      cb(err, null);
    }
  },

  filename: (req, file, cb) => {
    const extension = MIME_TYPES[file.mimetype];
    cb(null, Date.now() + '-' + file.fieldname + '.' + extension);
  },
});

const fileFilter = (req, file, cb) => {
  if (!MIME_TYPES[file.mimetype]) {
    cb(new Error('Only images are allowed'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
