import { ImageDTO } from './image-dto';

export class PrototypeDTO {
  prototypeId?: number;
  name?: string;
  categoryId?: number;
  prompt?: string;
  specifications?:string;
  generationSatus?:string;
  error?: string;
  createdAt?: string;
  images?: Array<ImageDTO>;
}
