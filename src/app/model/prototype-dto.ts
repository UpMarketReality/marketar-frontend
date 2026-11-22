import { ImageDTO } from './image-dto';

export class PrototypeDTO {
  prototypeId: number;
  name: string;
  categoryId: number;
  prompt: string;
  specifications: string;
  generationStatus: string;
  error: string | null;
  createdAt: string;
  images: ImageDTO[];
}
