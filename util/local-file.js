const path = require("path");
import { createWriteStream } from 'fs';

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};


const uploadImageToLocal = async (image) => {
  const { createReadStream, filename, mimetype, encoding } = image;
  const stream = createReadStream();
  const uploadDir = path.join(__dirname, '../images');
  const date = new Date();
  const ext = MIME_TYPE_MAP[mimetype];
  const filePath = date.toISOString().toLowerCase().replace(/ /g, '') + `.${ext}`;

  const imagePath = `${uploadDir}/${filePath}`;

  return new Promise((resolve, reject) =>
    stream
      .pipe(createWriteStream(imagePath))
      .on('finish', () => resolve({ imagePath, filePath }))
      .on('error', reject),
  );
};

module.exports.uploadImageToLocal = uploadImageToLocal;
