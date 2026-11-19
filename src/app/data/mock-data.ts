// =====================================================================
// Datos internos (mock) para probar los componentes sin backend.
// Se activan con `useMockData: true` en src/environments/environment.ts
// =====================================================================

import { QuoteRequestDTO } from '../model/quote-request-dto';
import { CategoryDTO } from '../model/category-dto';
import { ProductDTO } from '../model/product-dto';
import { PrototypeDTO } from '../model/prototype-dto';
import { PageDTO } from '../model/page-dto';

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;

export const MOCK_CATEGORIES: CategoryDTO[] = [
  { categoryId: 1, name: 'Armarios & Closets' },
  { categoryId: 2, name: 'Mesas de Noche' },
  { categoryId: 3, name: 'Sillones & Sofás' },
  { categoryId: 4, name: 'Escritorios' },
  { categoryId: 5, name: 'Comedores' },
  { categoryId: 6, name: 'Estanterías' },
];

export const MOCK_PRODUCTS: ProductDTO[] = [
  {
    productId: 1, name: 'Armario Clásico de Melamina Premium', price: 5000, stock: 8, categoryId: 1,
    material: 'Melamina', color: 'Roble', storeName: 'DomusDeco SAC', rating: 5, reviewCount: 280,
    description: 'Armario de 4 cuerpos con repisas abiertas.',
    mainImageUrl: img('photo-1595526114035-0d45ed16cfbf'),
  },
  {
    productId: 2, name: 'Velador Renacentista de Caoba', price: 1800, stock: 12, categoryId: 2,
    material: 'Caoba', color: 'Marrón', storeName: 'Maderas del Sur', rating: 4, reviewCount: 12,
    description: 'Velador tallado a mano con un cajón.',
    mainImageUrl: img('photo-1532372320572-cda25653a26d'),
  },
  {
    productId: 3, name: 'Sillón Acolchado Vintage Mustard', price: 2400, stock: 5, categoryId: 3,
    material: 'Terciopelo', color: 'Verde', storeName: 'Tapicería Lima', rating: 4.5, reviewCount: 47,
    description: 'Sofá de tres cuerpos con patas de madera.',
    mainImageUrl: img('photo-1555041469-a586c61ea9bc'),
  },
  {
    productId: 4, name: 'Estantería Minimalista para Libros', price: 980, stock: 20, categoryId: 6,
    material: 'Pino', color: 'Natural', storeName: 'Nórdika', rating: 5, reviewCount: 310,
    description: 'Estantería abierta de 5 niveles.',
    mainImageUrl: img('photo-1493663284031-b7e3aefcae8e'),
  },
  {
    productId: 5, name: 'Sillón Teal Velvet Contemporáneo', price: 1650, stock: 9, categoryId: 3,
    material: 'Terciopelo', color: 'Mostaza', storeName: 'Tapicería Lima', rating: 5, reviewCount: 142,
    description: 'Sillón individual de líneas curvas.',
    mainImageUrl: img('photo-1567538096630-e0c55bd6374c'),
  },
  {
    productId: 6, name: 'Juego de Comedor Nórdico de Abeto', price: 1390, stock: 4, categoryId: 5,
    material: 'Abeto', color: 'Verde', storeName: 'Nórdika', rating: 5, reviewCount: 88,
    description: 'Mesa para 6 personas con sillas tapizadas.',
    mainImageUrl: img('photo-1617806118233-18e1de247200'),
  },
  {
    productId: 7, name: 'Cómoda Moderna con 4 Cajones', price: 1200, stock: 7, categoryId: 1,
    material: 'MDF', color: 'Nogal', storeName: 'DomusDeco SAC', rating: 4, reviewCount: 53,
    description: 'Cómoda de cajones con correderas silenciosas.',
    mainImageUrl: img('photo-1538688525198-9b88f6f53126'),
  },
  {
    productId: 8, name: 'Cama King Size de Madera Sólida', price: 3200, stock: 3, categoryId: 2,
    material: 'Tornillo', color: 'Blanco', storeName: 'Maderas del Sur', rating: 4.5, reviewCount: 112,
    description: 'Cama con cabecero capitoné.',
    mainImageUrl: img('photo-1505693416388-ac5ce068fe85'),
  },
  {
    productId: 9, name: 'Sofá Seccional Minimalista (Gris)', price: 4100, stock: 6, categoryId: 3,
    material: 'Cuero', color: 'Coñac', storeName: 'Tapicería Lima', rating: 5, reviewCount: 89,
    description: 'Sofá de cuero de tres cuerpos.',
    mainImageUrl: img('photo-1540574163026-643ea20ade25'),
  },
  {
    productId: 10, name: 'Mesa de Centro Rústica Circular', price: 650, stock: 15, categoryId: 5,
    material: 'Roble', color: 'Natural', storeName: 'Nórdika', rating: 5, reviewCount: 204,
    description: 'Mesa de centro redonda de madera maciza.',
    mainImageUrl: img('photo-1586023492125-27b2c045efd7'),
  },
  {
    productId: 11, name: 'Mueble Flotante para TV (Nogal)', price: 890, stock: 11, categoryId: 6,
    material: 'Nogal', color: 'Nogal', storeName: 'DomusDeco SAC', rating: 4, reviewCount: 34,
    description: 'Mueble de TV flotante con repisas.',
    mainImageUrl: img('photo-1484101403633-562f891dc89a'),
  },
  {
    productId: 12, name: 'Escritorio Ejecutivo de Roble', price: 1450, stock: 10, categoryId: 4,
    material: 'Roble', color: 'Natural', storeName: 'Oficinas Pro', rating: 4.5, reviewCount: 61,
    description: 'Escritorio con cajonera lateral.',
    mainImageUrl: img('photo-1518455027359-f3f8164ba6bd'),
  },
  {
    productId: 13, name: 'Silla de Comedor Escandinava', price: 320, stock: 40, categoryId: 5,
    material: 'Haya', color: 'Natural', storeName: 'Nórdika', rating: 4, reviewCount: 95,
    description: 'Silla de madera con asiento curvo.',
    mainImageUrl: img('photo-1503602642458-232111445657'),
  },
  {
    productId: 14, name: 'Mesa de Noche Flotante Blanca', price: 420, stock: 18, categoryId: 2,
    material: 'MDF', color: 'Blanco', storeName: 'Nórdika', rating: 4, reviewCount: 27,
    description: 'Mesa de noche suspendida con cajón.',
    mainImageUrl: img('photo-1550226891-ef816aed4a98'),
  },
  {
    productId: 15, name: 'Escritorio Gamer con Repisa', price: 1100, stock: 9, categoryId: 4,
    material: 'Melamina', color: 'Negro', storeName: 'Oficinas Pro', rating: 4.5, reviewCount: 73,
    description: 'Escritorio amplio con repisa para monitor.',
    mainImageUrl: img('photo-1524758631624-e2822e304c36'),
  },
  {
    productId: 16, name: 'Closet Corredizo de 3 Puertas', price: 3800, stock: 2, categoryId: 1,
    material: 'Melamina', color: 'Blanco', storeName: 'DomusDeco SAC', rating: 5, reviewCount: 158,
    description: 'Closet con puertas corredizas y espejo.',
    mainImageUrl: img('photo-1556228453-efd6c1ff04f6'),
  },
];

// Favoritos iniciales en modo mock (IDs de MOCK_PRODUCTS)
export const MOCK_INITIAL_FAVORITE_IDS = [1, 2, 3, 12, 13, 14, 15, 16];

// "Vistos recientemente" iniciales en modo mock
export const MOCK_INITIAL_RECENT_IDS = [4, 5, 6, 7];

export const MOCK_PROTOTYPES: PrototypeDTO[] = [
  {
    prototypeId: 101, name: 'Escritorio Nórdico Personalizado', categoryId: 4,
    prompt: 'Escritorio blanco nórdico con cajonera y pasacables', generationSatus: 'COMPLETED',
    createdAt: '2026-11-10T10:00:00',
    images: [{ imageId: 1, url: img('photo-1524758631624-e2822e304c36'), principal: true }],
  },
  {
    prototypeId: 102, name: 'Closet Empotrado con Iluminación', categoryId: 1,
    prompt: 'Closet de piso a techo con luces LED', generationSatus: 'COMPLETED',
    createdAt: '2026-11-05T15:30:00',
    images: [{ imageId: 2, url: img('photo-1595526114035-0d45ed16cfbf'), principal: true }],
  },
  {
    prototypeId: 103, name: 'Repostero Rústico para Cocina', categoryId: 6,
    prompt: 'Repostero de madera rústica con vidrio', generationSatus: 'COMPLETED',
    createdAt: '2026-10-28T09:15:00',
    images: [{ imageId: 3, url: img('photo-1556228453-efd6c1ff04f6'), principal: true }],
  },
  {
    prototypeId: 104, name: 'Banca de Recibidor con Zapatera', categoryId: 6,
    prompt: 'Banca de madera clara con espacio para zapatos', generationSatus: 'COMPLETED',
    createdAt: '2026-10-20T18:45:00',
    images: [{ imageId: 4, url: img('photo-1503602642458-232111445657'), principal: true }],
  },
];

export const MOCK_QUOTE_REQUESTS: QuoteRequestDTO[] = [
  { requestId: 501, prototypeId: 101, prototype: 'Escritorio Nórdico Personalizado', categoryId: 4, quantity: 1, status: 'OPEN', offerCount: 2, createdAt: '2026-11-11T09:00:00' },
  { requestId: 502, prototypeId: 102, prototype: 'Closet Empotrado con Iluminación', categoryId: 1, quantity: 1, status: 'ACCEPTED', offerCount: 3, createdAt: '2026-11-06T12:00:00' },
  { requestId: 503, prototypeId: 103, prototype: 'Repostero Rústico para Cocina', categoryId: 6, quantity: 1, status: 'OPEN', offerCount: 0, createdAt: '2026-10-29T08:00:00' },
];

export function findMockProduct(productId: number): ProductDTO | undefined {
  return MOCK_PRODUCTS.find((p) => p.productId === productId);
}

// Simula GET /products con búsqueda, categoría, rango de precio y paginación
export function mockProductsPage(
  search?: string,
  categoryId?: number,
  minPrice?: number,
  maxPrice?: number,
  page: number = 0,
  size: number = 20,
): PageDTO<ProductDTO> {
  const q = (search ?? '').trim().toLowerCase();
  const filtered = MOCK_PRODUCTS.filter((p) => {
    const matchesText =
      !q ||
      [p.name, p.description, p.material, p.color, p.storeName].some((v) => v?.toLowerCase().includes(q));
    const matchesCategory = categoryId == null || p.categoryId === categoryId;
    const matchesMin = minPrice == null || (p.price ?? 0) >= minPrice;
    const matchesMax = maxPrice == null || (p.price ?? 0) <= maxPrice;
    return matchesText && matchesCategory && matchesMin && matchesMax;
  });

  const start = page * size;
  return {
    content: filtered.slice(start, start + size),
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
  };
}

export function mockPage<T>(items: T[], page: number, size: number): PageDTO<T> {
  const start = page * size;
  return {
    content: items.slice(start, start + size),
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
  };
}
