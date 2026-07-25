import { awsPhotoRepository } from "./awsPhotoRepository";
import { localPhotoRepository } from "./localPhotoRepository";
import type { PhotoRepository } from "./photoRepository";

export const photoRepository: PhotoRepository =
  import.meta.env.VITE_STORAGE_MODE === "aws" ? awsPhotoRepository : localPhotoRepository;
