'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ShoppingCart, Heart, Star, Truck, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { addToCart } from '@/components/ProductCard'
import VirtualTryOn from '@/components/VirtualTryOn'

const SPLINE_PRODUCTS: Record<string, any> = {
  'spline-1': {
    id: 'spline-1', name: 'Classic White T-Shirt',
    description: 'Essential premium cotton t-shirt with a relaxed fit. Perfect foundation for any outfit, crafted from 100% organic cotton.',
    price: 49.99, category: 'T-Shirts', color: 'White',
    sceneUrl: 'https://prod.spline.design/ZCEBo2rgShJiweq7/scene.splinecode',
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    stock: { S: 10, M: 15, L: 12, XL: 8 }, badge: 'Best Seller', rating: 4.8, reviews: 324,
  },
  'spline-2': {
    id: 'spline-2', name: 'Vintage Graphic Tee',
    description: 'Stylish graphic t-shirt with unique vintage-inspired print. Made from soft cotton blend for all-day comfort.',
    price: 59.99, category: 'T-Shirts', color: 'Mixed',
    sceneUrl: 'https://prod.spline.design/iy9I58VsJjswpfIV/scene.splinecode',
    image_url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',
    stock: { S: 8, M: 12, L: 10, XL: 6 }, badge: 'New Arrival', rating: 4.9, reviews: 189,
  },
  'spline-3': {
    id: 'spline-3', name: 'Premium White Tee',
    description: 'Sleek white t-shirt with premium finishing. A wardrobe staple that pairs perfectly with anything.',
    price: 54.99, category: 'T-Shirts', color: 'White',
    sceneUrl: 'https://prod.spline.design/KwOExQ1TsFMSlh-4/scene.splinecode',
    image_url: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400',
    stock: { S: 12, M: 18, L: 14, XL: 10 }, badge: 'Premium', rating: 5.0, reviews: 267,
  },
  'spline-4': {
    id: 'spline-4', name: 'Summer Collection Tee',
    description: 'Lightweight summer t-shirt in a refreshing colour. Perfect for warm days and casual outings.',
    price: 44.99, category: 'T-Shirts', color: 'Pastel',
    sceneUrl: 'https://prod.spline.design/JaRDSrI0JF-X3QRK/scene.splinecode',
    image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400',
    stock: { S: 15, M: 20, L: 16, XL: 12 }, badge: 'Trending', rating: 4.7, reviews: 456,
  },
}

interface Product {
  id: string; name: string; price: number; description: string; category: string
  stock: Record<string, number>; badge?: string; rating?: number; reviews?: number
  color?: string; sceneUrl?: string; image_url?: string
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId }               = use(params)
  const [product, setProduct]           = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity]         = useState(1)
  const [loading, setLoading]           = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (SPLINE_PRODUCTS[productId]) {
          const p = SPLINE_PRODUCTS[productId]
          setProduct(p)
          const sizes = Object.keys(p.stock || {})
          if (sizes.length) setSelectedSize(sizes[0])
        } else {
          const { data, error } = await supabase.from('products').select('*').eq('id', productId).maybeSingle()
          if (error) console.error('[ProductPage] fetch:', error)
          if (data) {
            const p: Product = {
              id: data.id, name: data.name, price: data.price,
              description: data.description || `Premium ${data.category} from edgARs.`,
              category: data.category, stock: data.stock || { S: 10, M: 15, L: 12, XL: 8 },
              badge: data.badge, rating: data.rating || 4.5, reviews: data.reviews || 100,
              color: data.color, sceneUrl: data.scene_url, image_url: data.image_url,
            }
            setProduct(p)
            const sizes = Object.keys(p.stock || {})
            if (sizes.length) setSelectedSize(sizes[0])
          }
        }
      } catch (err) {
        console.error('[ProductPage] unexpected:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error('Please select a size'); return }
    setAddingToCart(true)
    addToCart({
      product_id: product!.id,
      name:       product!.name,
      price:      product!.price,
      size:       selectedSize,
      quantity,
      image_url:  product!.image_url || '',
    })
    toast.success(`${product!.name} (Size ${selectedSize}) added to cart!`, {
      description: `Quantity: ${quantity}`,
      action: { label: 'View Cart', onClick: () => router.push('/cart') },
    })
    setTimeout(() => setAddingToCart(false), 400)
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    </div>
  )

  if (!product) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground text-lg mb-4">Product not found</p>
        <Link href="/shop"><Button className="bg-primary text-white">Back to Shop</Button></Link>
      </div>
    </div>
  )

  const sizes           = Object.keys(product.stock || {})
  const productImageUrl = product.image_url || ''

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Link href="/shop" className="flex items-center gap-2 text-primary hover:text-accent transition">
          <ChevronLeft className="w-5 h-5" /> Back to Shop
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 mt-8">

         {/* ── LEFT: Product image / Spline 3D ── */}
<div className="space-y-4">
  <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
    <div className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
      {product.sceneUrl ? (
        <iframe
          src={product.sceneUrl.replace('.splinecode', '')}
          frameBorder="0"
          width="100%"
          height="100%"
          style={{ minHeight: '400px' }}
          title={product.name}
          allow="autoplay"
        />
      ) : productImageUrl ? (
        <img
          src={productImageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <p className="text-neutral-500">No preview available</p>
      )}
    </div>
  </div>
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
    <RotateCcw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
    <div>
      <p className="font-semibold text-blue-900 text-sm">
        {product.sceneUrl ? '3D Interactive Preview' : 'Product Preview'}
      </p>
      <p className="text-xs text-blue-700 mt-1">
        {product.sceneUrl ? 'Drag to rotate • Scroll to zoom' : 'High quality product image'}
      </p>
    </div>
  </div>
</div>

          {/* ── RIGHT: Product details ── */}
          <div className="space-y-8">
            <div>
              {product.badge && (
                <span className="inline-block px-3 py-1 bg-accent text-primary text-xs font-bold rounded-full mb-3">{product.badge}</span>
              )}
              <h1 className="text-4xl font-bold text-primary mb-3">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating || 0) ? 'fill-accent text-accent' : 'text-neutral-300'}`} />
                  ))}
                </div>
                <span className="text-sm text-neutral-600">{product.rating} ({product.reviews} reviews)</span>
              </div>
              <p className="text-neutral-700 text-lg leading-relaxed">{product.description}</p>
            </div>

            <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-6">
              <p className="text-white/70 text-sm mb-2">Price</p>
              <p className="text-5xl font-bold">${product.price.toFixed(2)}</p>
            </div>

            {product.color && (
              <div>
                <h3 className="text-lg font-semibold text-primary mb-3">Colour</h3>
                <p className="text-neutral-700 px-4 py-2 bg-neutral-100 rounded-lg inline-block font-medium">{product.color}</p>
              </div>
            )}

            {/* Size selector */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">Select Size</h3>
                {selectedSize && <span className="text-sm text-accent font-semibold">Selected: {selectedSize}</span>}
              </div>
              <div className="flex flex-wrap gap-3">
                {sizes.map(size => {
                  const inStock = (product.stock[size] || 0) > 0
                  return (
                    <button key={size} onClick={() => inStock && setSelectedSize(size)} disabled={!inStock}
                      className={`px-6 py-3 border-2 rounded-lg font-semibold transition ${
                        !inStock ? 'border-neutral-200 text-neutral-400 cursor-not-allowed line-through'
                        : selectedSize === size ? 'bg-primary text-white border-primary shadow-lg'
                        : 'border-neutral-300 text-foreground hover:border-primary hover:shadow-md'
                      }`}>
                      {size}
                      {inStock && <span className="text-xs ml-1">({product.stock[size]})</span>}
                      {!inStock && <span className="text-xs ml-1">(Out)</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4">Quantity</h3>
              <div className="flex items-center gap-4 w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 border-2 border-neutral-300 rounded-lg hover:border-primary flex items-center justify-center text-xl font-bold">−</button>
                <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 border-2 border-neutral-300 rounded-lg hover:border-primary flex items-center justify-center text-xl font-bold">+</button>
              </div>
            </div>

            {/* Virtual Try-On */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">Virtual Try-On</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upload your photo and see how this item looks on you — with EU, UK, and US sizing.
              </p>
              <VirtualTryOn
                productName={product.name}
                productImage={productImageUrl}
                productCategory={product.category}
              />
            </div>

            {/* Add to cart */}
            <div className="flex gap-4 pt-2">
              <Button
                onClick={handleAddToCart}
                disabled={addingToCart || !selectedSize}
                className="flex-1 bg-primary hover:bg-primary/90 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
              <Button variant="outline" className="px-6 py-6 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl transition-all">
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            <div className="border-t border-neutral-200 pt-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Free Shipping</p>
                <p className="text-sm text-muted-foreground">On orders over $50</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
