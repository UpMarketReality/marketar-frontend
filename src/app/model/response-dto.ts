import { UsuarioDto } from './usuario-dto';

export class ResponseDto {
  jwt: string;
  roles: string[];
  expiresAt: string;
  user: UsuarioDto | null;
}
