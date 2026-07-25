import { useState } from "react";
import { eventConfig } from "../config/event";
import { photoRepository } from "../services";
import { createOptimizedImage } from "../utils/imageCompression";
import { getUploaderSessionId } from "../utils/session";

interface UploadOptions {
  files: File[];
  guestName: string;
  message: string;
}

export function useUploadPhotos() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload({ files, guestName, message }: UploadOptions) {
    setUploading(true);
    setProgress(2);
    setStage("Po përgatiten fotografitë…");

    try {
      const uploaderSessionId = getUploaderSessionId();
      const records = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setStage(`Po optimizohet fotografia ${index + 1} nga ${files.length}…`);
        const optimizedBlob = await createOptimizedImage(file);
        records.push({
          eventId: eventConfig.eventId,
          originalFileName: file.name,
          originalContentType: file.type,
          optimizedContentType: "image/jpeg" as const,
          originalSize: file.size,
          optimizedSize: optimizedBlob.size,
          guestName: guestName.trim(),
          message: message.trim(),
          uploaderSessionId,
          originalBlob: file,
          optimizedBlob,
        });
        setProgress(Math.round(((index + 1) / files.length) * 78));
      }

      setStage("Po ruhen momentet…");
      await photoRepository.addPhotos(records);
      setProgress(100);
      setStage("Fotografitë u ndanë me sukses.");
      return records.length;
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setProgress(0);
    setStage("");
  }

  return { upload, progress, stage, uploading, reset };
}
