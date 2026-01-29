#!/usr/bin/env python3

import http.server
import socketserver
import os
import json
from urllib.parse import urlparse


ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(ROOT_DIR, "images")
PORT = 8000


class GalleryRequestHandler(http.server.SimpleHTTPRequestHandler):
  """Serve the static site and expose /api/images for auto-discovery of photos."""

  def do_GET(self):
    parsed = urlparse(self.path)
    if parsed.path == "/api/images":
      self.handle_images_api()
    else:
      # Serve files from ROOT_DIR
      super().do_GET()

  def handle_images_api(self):
    # Ensure images directory exists
    if not os.path.isdir(IMAGES_DIR):
      images = []
    else:
      exts = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
      files = sorted(
        f
        for f in os.listdir(IMAGES_DIR)
        if os.path.isfile(os.path.join(IMAGES_DIR, f))
        and os.path.splitext(f.lower())[1] in exts
      )
      # Build browser paths like "images/filename.jpg"
      images = [f"images/{name}" for name in files]

    payload = json.dumps(images).encode("utf-8")
    self.send_response(200)
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Content-Length", str(len(payload)))
    self.end_headers()
    self.wfile.write(payload)


if __name__ == "__main__":
  os.chdir(ROOT_DIR)
  with socketserver.TCPServer(("", PORT), GalleryRequestHandler) as httpd:
    print(f"Serving gallery at http://localhost:{PORT}")
    httpd.serve_forever()

