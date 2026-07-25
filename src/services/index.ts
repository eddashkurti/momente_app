import { localPhotoRepository } from "./localPhotoRepository";
import type { PhotoRepository } from "./photoRepository";

// The AWS phase will provide an AwsPhotoRepository implementing the same interface.
export const photoRepository: PhotoRepository = localPhotoRepository;
