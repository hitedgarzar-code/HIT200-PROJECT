import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-3">edg<span className="text-accent">AR</span>s</h3>
            <p className="text-white/70 text-sm">
              Premium fashion with 3D visualization and AR technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><Link href="/" className="hover:text-accent transition">Home</Link></li>
              <li><Link href="/shop" className="hover:text-accent transition">Shop</Link></li>
              <li><Link href="/cart" className="hover:text-accent transition">Cart</Link></li>
              <li><Link href="/orders" className="hover:text-accent transition">Orders</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold mb-3">Account</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><Link href="/auth/login" className="hover:text-accent transition">Sign In</Link></li>
              <li><Link href="/auth/signup" className="hover:text-accent transition">Create Account</Link></li>
              <li><a href="mailto:support@edgars.com" className="hover:text-accent transition">Support</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-6 text-center text-white/50 text-sm">
          <p>&copy; 2026 edgARs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
