const admin = require("firebase-admin");
const uuid = require("uuid-v4");
const serviceAccount = require("../serviceAccountKey.json");
const localFile = require("../util/local-file");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://society-management-syste-6584a.appspot.com/",
});

const metadata = {
  metadata: {
    firebaseStorageDownloadTokens: uuid(),
  },
  contentType: "image/png",
  cacheControl: "public, max-age=31536000",
};

const bucket = admin.storage().bucket();

const bucketUrl = `https://storage.googleapis.com/${bucket.name}/`;

const uploadImageToCloud = async (image, category) => {
  let path;
  try {
    path = await localFile.uploadImageToLocal(image);
    const res = await bucket.upload(path.imagePath, {
      destination: `${category}/${path.filePath}`,
      gzip: true,
      metadata: metadata,
    });
  } catch (err) {
    console.log(err);
    return false;
  }

  const imageUrl = bucketUrl + `${category}/${path.filePath}`;

  // console.log({ imageUrl: imageUrl });
  return imageUrl;
};

const deleteImageToCloud = async (imageUrl) => {
  const imageName = imageUrl.replace(bucketUrl, "");
  try {
    const res = await bucket.file(imageName).delete();
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports.uploadImageToCloud = uploadImageToCloud;
module.exports.deleteImageFromCloud = deleteImageToCloud;
