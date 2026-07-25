import { Camera, ImagePlus } from "lucide-react";
import { useRef, type ChangeEvent, type DragEvent } from "react";
import { eventConfig } from "../config/event";

interface UploadDropzoneProps {
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}

export default function UploadDropzone({ disabled, onFiles }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFiles(list: FileList | null) {
    if (list) onFiles(Array.from(list));
  }

  return (
    <div
      className={`upload-dropzone${disabled ? " upload-dropzone-disabled" : ""}`}
      onDragOver={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!disabled) handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept={eventConfig.upload.acceptedExtensions.join(",")}
        multiple
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <div className="dropzone-icon"><ImagePlus size={29} /></div>
      <h2>Zgjidh deri në 5 fotografi</h2>
      <p>Shtyp këtu për të hapur galerinë e telefonit.</p>
      <button className="button button-primary" type="button" disabled={disabled} onClick={() => inputRef.current?.click()}>
        <Camera size={18} /> Zgjidh fotografitë
      </button>
      <small>JPG, PNG ose WebP · maksimumi 10 MB secila</small>
    </div>
  );
}
