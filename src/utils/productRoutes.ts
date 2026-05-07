import type { Database } from '../types/supabase';

type ProductRouteData = Pick<Database['public']['Tables']['produtos']['Row'], 'id' | 'slug'>;

export function getProductPath(product: ProductRouteData) {
  return `/produto/${product.slug || product.id}`;
}

export function isProductIdParam(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
