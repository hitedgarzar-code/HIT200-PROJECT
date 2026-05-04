'use client'

import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'

const SPLINE_PRODUCTS = [
  { id: 'spline-1', name: 'Classic White T-Shirt', price: 49.99, category: 'T-Shirts',
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', badge: 'Best Seller' },
  { id: 'spline-2', name: 'Vintage Graphic Tee', price: 59.99, category: 'T-Shirts',
    image_url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400', badge: 'New Arrival' },
  { id: 'spline-3', name: 'Premium White Tee', price: 54.99, category: 'T-Shirts',
    image_url: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400', badge: 'Premium' },
  { id: 'spline-4', name: 'Summer Collection Tee', price: 44.99, category: 'T-Shirts',
    image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400', badge: 'Trending' },
]

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="bg-gradient-to-br from-primary via-primary-dark to-primary text-white py-16 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-accent text-primary text-sm font-semibold rounded-full">Exclusive Collection</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Premium Fashion <span className="block text-accent">3D Collection</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl">
            Experience our exclusive clothing collection in stunning 3D. Rotate, zoom, and explore every detail before you buy.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-primary">Featured Products</h2>
            <p className="text-neutral-600 mt-1">Click the product image to explore the 3D model</p>
          </div>
          <Link href="/cart">
            <Button className="bg-accent hover:bg-accent/90 text-primary font-semibold gap-2">
              <ShoppingBag className="w-4 h-4" /> View Cart
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SPLINE_PRODUCTS.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}
