/** Types shared between server queries and client components. */

export interface ProductSummary {
  id: string;
  sku: string;
  name: string;
  slug: string;
  mrp: number;
  selling_price: number;
  discount_percent: number;
  stock_quantity: number;
  rating_average: number;
  rating_count: number;
  is_featured: number;
  is_bestseller: number;
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  primary_image: string | null;
}

export interface CartLine {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  image: string | null;
  brandName: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
  variant?: { type: string; value: string; priceDelta: number } | null;
}

export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  depth: number;
  icon: string | null;
  description: string | null;
  product_count: number;
  children?: CategoryNode[];
}

export interface BrandRow {
  id: string;
  slug: string;
  name: string;
  tier: string;
  tagline: string | null;
  parent_company: string | null;
  is_featured: number;
  product_count: number;
}
