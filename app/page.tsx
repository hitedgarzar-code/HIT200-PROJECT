import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Shirt, Truck, RotateCcw, Shield, ArrowRight, Star, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'edgARs — Premium Fashion Store',
  description: 'Discover premium fashion with interactive 3D visualization and AR try-on technology at edgARs.',
}

const PRODUCTS = [
  {
    name: 'Classic White T-Shirt',
    price: '$49.99',
    badge: 'Best Seller',
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    href: '/shop/spline-1',
  },
  {
    name: 'Vintage Graphic Tee',
    price: '$59.99',
    badge: 'New Arrival',
    img: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80',
    href: '/shop/spline-2',
  },
  {
    name: 'Premium Black Tee',
    price: '$54.99',
    badge: 'Premium',
    img: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&q=80',
    href: '/shop/spline-3',
  },
  {
    name: 'Summer Collection Tee',
    price: '$44.99',
    badge: 'Trending',
    img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80',
    href: '/shop/spline-4',
  },
]

const STATS = [
  { value: '2,400+', label: 'Happy Customers' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '100%', label: 'Organic Cotton' },
  { value: '3D', label: 'Try Before You Buy' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80"
            alt="edgARs Fashion Collection"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Layered overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.2_0.04_240)]/95 via-[oklch(0.2_0.04_240)]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.2_0.04_240)]/60 via-transparent to-transparent" />
        </div>

        {/* Decorative angled accent bar */}
        <div className="absolute top-0 left-0 w-2 h-full bg-accent z-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Copy */}
            <div>
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px w-12 bg-accent" />
                <span className="text-accent font-semibold text-sm uppercase tracking-[0.2em]">
                  New Collection 2026
                </span>
              </div>

              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.9] mb-8 tracking-tight">
                Wear<br />
                <span className="text-accent italic">Your</span><br />
                Story
              </h1>

              <p className="text-lg text-white/75 mb-10 max-w-md leading-relaxed">
                Premium quality clothing with interactive 3D visualization.
                Explore every stitch before you buy — fashion reimagined for the digital age.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/shop">
                  <Button size="lg"
                    className="bg-accent hover:bg-accent/90 text-primary font-bold text-base px-8 py-6 rounded-xl gap-2 shadow-lg shadow-accent/30 transition-all hover:shadow-accent/50 hover:scale-105">
                    Shop Collection
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button size="lg" variant="outline"
                    className="border-2 border-white/40 text-white hover:bg-white/10 hover:border-white text-base px-8 py-6 rounded-xl backdrop-blur-sm transition-all">
                    View 3D Models
                  </Button>
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-12 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['photo-1529626455594-4ff0802cfb7e', 'photo-1531746020798-e6953c6e8e04', 'photo-1500648767791-00dcc994a43e'].map((id, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-white/30 overflow-hidden">
                      <Image src={`https://images.unsplash.com/${id}?w=80&q=80`} alt="customer" width={36} height={36} className="object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-accent text-accent" />)}
                  </div>
                  <p className="text-white/60 text-xs">Loved by 2,400+ customers</p>
                </div>
              </div>
            </div>

            {/* Right: Hero image card */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Glow */}
                <div className="absolute -inset-8 bg-accent/15 rounded-[3rem] blur-3xl" />
                {/* Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                  <Image
                    src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&q=80"
                    alt="Premium Fashion"
                    width={560}
                    height={680}
                    className="object-cover w-full"
                    priority
                  />
                  {/* Floating badge */}
                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <div>
                        <p className="text-xs text-neutral-500 leading-none">Now with</p>
                        <p className="text-sm font-bold text-primary leading-tight">3D Try-On</p>
                      </div>
                    </div>
                  </div>
                  {/* Bottom overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Featured</p>
                    <p className="text-white font-semibold">Summer Collection 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <section className="relative z-10 -mt-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-primary rounded-2xl shadow-2xl shadow-primary/30 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {STATS.map(({ value, label }) => (
              <div key={label} className="py-6 px-6 text-center">
                <p className="text-3xl font-bold text-accent mb-1">{value}</p>
                <p className="text-white/60 text-xs uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES STRIP ────────────────────────────────────── */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shirt,    title: 'Premium Quality', sub: '100% Organic Cotton' },
              { icon: Truck,    title: 'Free Shipping',   sub: 'On orders over $50'  },
              { icon: RotateCcw, title: 'Easy Returns',   sub: '30-day return policy' },
              { icon: Shield,   title: 'Secure Payment',  sub: 'PayNow & Mobile Money' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title}
                className="group flex items-center gap-4 p-5 rounded-2xl border border-neutral-200 hover:border-primary/30 hover:bg-primary/5 transition-all">
                <div className="w-12 h-12 bg-primary/8 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary text-sm">{title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ─────────────────────────────────── */}
      <section className="py-20 px-6 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-semibold uppercase tracking-widest">Our Products</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight">
                Featured<br />Collection
              </h2>
            </div>
            <Link href="/shop">
              <Button variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl px-6 py-5 gap-2 font-semibold transition-all">
                View All Products
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {PRODUCTS.map((product, i) => (
              <Link key={product.href} href={product.href} className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-neutral-200 aspect-[3/4] mb-4">
                  <Image
                    src={product.img}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-all duration-300" />
                  {/* Badge */}
                  <div className="absolute top-3 left-3 bg-accent text-primary text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {product.badge}
                  </div>
                  {/* 3D tag */}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-primary text-xs font-semibold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    ⟳ View in 3D
                  </div>
                  {/* First product: "New" ribbon */}
                  {i === 0 && (
                    <div className="absolute top-3 right-3 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">#1</span>
                    </div>
                  )}
                </div>
                <div className="px-1">
                  <p className="font-semibold text-primary text-sm mb-1 group-hover:text-accent transition-colors line-clamp-1">
                    {product.name}
                  </p>
                  <p className="text-lg font-bold text-primary">{product.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3D EXPERIENCE SECTION ─────────────────────────────── */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">

            {/* Image side */}
            <div className="relative order-2 lg:order-1">
              {/* Background shape */}
              <div className="absolute -left-8 -top-8 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute -right-4 -bottom-4 w-48 h-48 bg-primary/8 rounded-full blur-2xl" />

              <div className="relative grid grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden shadow-xl aspect-[3/4]">
                  <Image
                    src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80"
                    alt="3D Fashion"
                    width={300}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl aspect-[3/4] mt-10">
                  <Image
                    src="https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=500&q=80"
                    alt="Fashion Detail"
                    width={300}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>

              {/* Floating stat card */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white rounded-2xl px-6 py-4 shadow-2xl shadow-primary/40 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Interactive</p>
                    <p className="font-bold text-sm">360° 3D View</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy side */}
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-semibold uppercase tracking-widest">Innovation</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
                Experience<br />Fashion in 3D
              </h2>

              <p className="text-neutral-600 text-lg mb-10 leading-relaxed">
                Our revolutionary 3D product viewer lets you explore every detail.
                Rotate, zoom, and examine the fabric texture and fit before you buy.
              </p>

              <div className="space-y-5 mb-10">
                {[
                  { title: '360° Rotation',        desc: 'Inspect every angle like holding it in your hands'  },
                  { title: 'Zoom & Detail View',   desc: 'See fabric texture, stitching, and finish up close'  },
                  { title: 'Real-time Rendering',  desc: 'True-to-life colours and materials, every time'      },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2.5 h-2.5 bg-accent rounded-full" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{title}</p>
                      <p className="text-sm text-neutral-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/shop">
                <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base rounded-xl gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105">
                  Explore the Collection
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      
      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="relative py-28 px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
            alt="Fashion Background"
            fill
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-primary/90" />
        </div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl z-0" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl z-0" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 bg-accent" />
            <span className="text-accent text-sm font-semibold uppercase tracking-widest">Limited Time</span>
            <div className="h-px w-12 bg-accent" />
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Upgrade<br />
            <span className="text-accent">Your Wardrobe?</span>
          </h2>

          <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto">
            Browse our exclusive 3D collection. Free shipping on orders over $50.
            Experience fashion like never before.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/shop">
              <Button size="lg"
                className="bg-accent hover:bg-accent/90 text-primary font-bold text-lg px-10 py-6 rounded-xl gap-2 shadow-xl shadow-accent/30 hover:scale-105 transition-all">
                Start Shopping
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline"
                className="border-2 border-white/40 text-white hover:bg-white/10 hover:border-white text-lg px-10 py-6 rounded-xl transition-all">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
