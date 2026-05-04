'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Eye, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const CART_KEY = 'guest_cart'

export interface CartItem {
  product_id: string
  name:       string
  price:      number
  size:       string
  quantity:   number
  image_url:  string
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]') }
  catch { return [] }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('cart-updated'))
}

export function addToCart(item: CartItem) {
  const cart = getCart()
  const idx  = cart.findIndex(i => i.product_id === item.product_id && i.size === item.size)
  if (idx > -1) cart[idx].quantity += item.quantity
  else cart.push(item)
  saveCart(cart)
}

const CATEGORY_IMAGES: Record<string, string> = {
  'T-Shirts': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
  'Tops':     'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
  'Blazers':  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400',
  'Pants':    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400',
  'Dresses':  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
  'Coats':    'https://images.unsplash.com/photo-1539533018447-63fcce2678e4?w=400',
  'Jackets':  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
  'Skirts':   'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400',
  'Sweaters': 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400',
}

interface Product {
  id: string; name: string; price: number
  image_url: string; category: string; badge?: string
}

function getImg(p: Product) {
  if (p.image_url?.startsWith('http')) return p.image_url
  return CATEGORY_IMAGES[p.category] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400'
}

export default function ProductCard({ product }: { product: Product }) {
  const imageUrl = getImg(product)
  const [adding, setAdding] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)

    addToCart({ product_id: product.id, name: product.name, price: product.price, size: 'M', quantity: 1, image_url: imageUrl })

    toast.success(`${product.name} added to cart!`, {
      description: 'Default size M — open the product to choose a different size',
      action: { label: 'View Cart', onClick: () => { window.location.href = '/cart' } },
    })

    setTimeout(() => setAdding(false), 400)
  }

  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col border border-neutral-200 hover:border-accent">
      <Link href={`/shop/${product.id}`} className="block">
        <div className="relative overflow-hidden bg-neutral-100 aspect-square">
          <img src={imageUrl} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <Eye className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          {product.badge && (
            <div className="absolute top-3 right-3 bg-accent text-primary px-3 py-1 rounded-full text-xs font-bold shadow-md">
              {product.badge}
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-primary px-2 py-1 rounded-full text-xs font-semibold">
            ⟳ 360° View
          </div>
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        <Link href={`/shop/${product.id}`} className="flex-1 block">
          <p className="text-xs text-accent uppercase tracking-wider font-semibold mb-2">{product.category}</p>
          <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-2xl font-bold text-primary mt-auto mb-4">
            ${parseFloat(String(product.price)).toFixed(2)}
          </p>
        </Link>
        <div className="flex gap-2 mt-2">
          <Button onClick={handleAddToCart} disabled={adding}
            className="flex-1 bg-primary hover:bg-accent hover:text-primary text-white font-semibold transition-all duration-300 gap-2">
            <ShoppingCart className="w-4 h-4" />
            {adding ? 'Adding...' : 'Add to Cart'}
          </Button>
          <Link href={`/shop/${product.id}`}>
            <Button variant="outline" className="px-3 border-primary text-primary hover:bg-primary hover:text-white transition-all" title="View Details">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
