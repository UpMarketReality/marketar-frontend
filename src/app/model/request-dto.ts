export class RequestDTO {
  name!: string;
  email!: string;
  password!: string;
  role!: 'COMPRADOR' | 'VENDEDOR';

  // Comprador
  documento?: string;
  address?: string;

  // Vendedor
  storeName?: string;
  ruc?: string;
  storeDescription?: string;
}
