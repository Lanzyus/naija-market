"""Media storage that sends videos to Cloudinary as video and everything else
as image.

django-cloudinary-storage needs a different storage class per Cloudinary
resource type (MediaCloudinaryStorage = images, VideoMediaCloudinaryStorage =
video). ProductMedia keeps images and videos in one ``file`` field, so this
class picks the right one per file:

* on save, by file extension (the extension is still present then);
* afterwards, by the folder the file was stored in (``product_videos/``),
  because Cloudinary public ids for images/videos carry no extension.
"""
from django.core.files.storage import Storage

from cloudinary_storage.storage import (
    MediaCloudinaryStorage,
    VideoMediaCloudinaryStorage,
)

VIDEO_EXTENSIONS = {"mp4", "webm", "mov", "m4v", "avi", "mkv"}
VIDEO_FOLDER = "product_videos/"


class ProductMediaStorage(Storage):
    def __init__(self, *args, **kwargs):
        self.image_storage = MediaCloudinaryStorage()
        self.video_storage = VideoMediaCloudinaryStorage()

    # -- routing -----------------------------------------------------------
    @staticmethod
    def _is_video_upload(name):
        return name.rsplit(".", 1)[-1].lower() in VIDEO_EXTENSIONS if "." in name else False

    def _for_stored_name(self, name):
        return self.video_storage if VIDEO_FOLDER in (name or "") else self.image_storage

    # -- saving ------------------------------------------------------------
    def save(self, name, content, max_length=None):
        if self._is_video_upload(name):
            folder, _, filename = name.replace("\\", "/").rpartition("/")
            name = f"{VIDEO_FOLDER}{filename}"
            return self.video_storage.save(name, content, max_length=max_length)
        return self.image_storage.save(name, content, max_length=max_length)

    # -- everything else follows the stored name ---------------------------
    def url(self, name):
        return self._for_stored_name(name).url(name)

    def exists(self, name):
        return self._for_stored_name(name).exists(name)

    def delete(self, name):
        return self._for_stored_name(name).delete(name)

    def size(self, name):
        return self._for_stored_name(name).size(name)

    def open(self, name, mode="rb"):
        return self._for_stored_name(name).open(name, mode)

    def get_available_name(self, name, max_length=None):
        return self._for_stored_name(name).get_available_name(name, max_length=max_length)
