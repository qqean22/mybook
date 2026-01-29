// Vercel serverless function that lists image files under /images
// and returns an array of paths like ["images/photo1.jpg", ...].

const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
  const rootDir = process.cwd();
  const imagesDir = path.join(rootDir, "images");

  let images = [];
  try {
    const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
    const files = fs
      .readdirSync(imagesDir)
      .filter((f) => {
        const full = path.join(imagesDir, f);
        const ext = path.extname(f).toLowerCase();
        return fs.statSync(full).isFile() && exts.has(ext);
      })
      .sort();

    images = files.map((name) => `images/${name}`);
  } catch (e) {
    // On error (e.g. directory missing), just return an empty list
    images = [];
  }

  res.status(200).json(images);
};

