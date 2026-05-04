'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  LayoutDashboard, Package, CreditCard, LogOut,
  Plus, Pencil, Trash2, Search, RefreshCw, Save,
  ShoppingBag, UserCheck, AlertCircle,
  Shield, CheckCircle2, Clock, XCircle, Menu, ImageIcon,
  BarChart2, DollarSign, Eye, X, Star, ExternalLink
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Product {
  id: string; name: string; description: string; price: number
  category: string; image_url: string; stock: Record<string, number>
  badge?: string; color?: string; created_at: string; rating?: number; reviews?: number
}
interface UserProfile {
  id: string; email: string; created_at: string; full_name?: string
  role?: string; last_sign_in_at?: string
  user_metadata?: { full_name?: string; is_admin?: boolean }
}
interface Order {
  id: string; user_id: string; total?: number; total_amount?: number
  status: string; payment_method?: string; created_at: string
  order_items?: any[]; items?: any[]; payment_status?: string
}
interface Stats {
  total_orders: number; total_revenue: number; total_users: number
  pending_orders: number; total_products: number; paid_orders: number
}
type Tab = 'overview' | 'products' | 'users' | 'orders' | 'payments'

const CATEGORIES = ['T-Shirts','Hoodies','Jackets','Pants','Shorts','Dresses','Accessories','Shoes']
const SIZES = ['XS','S','M','L','XL','XXL']
const EMPTY_PRODUCT = {
  name:'', description:'', price:0, category:'T-Shirts',
  image_url:'', badge:'', color:'Black', rating:4.5, reviews:0,
  stock:{ XS:5, S:10, M:15, L:12, XL:8, XXL:5 }
}
const PIE_COLORS = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#ec4899']

/** Handles both 'total' and 'total_amount' column names across schema versions */
const getTotal = (o: Order): number => o.total_amount ?? o.total ?? 0

function buildRevenue(orders: Order[]) {
  const map: Record<string,number> = {}
  for (let i=6;i>=0;i--) {
    const d=new Date(); d.setDate(d.getDate()-i)
    map[d.toLocaleDateString('en-US',{weekday:'short'})] = 0
  }
  orders.forEach(o=>{
    const k=new Date(o.created_at).toLocaleDateString('en-US',{weekday:'short'})
    if (k in map) map[k]+=getTotal(o)
  })
  return Object.entries(map).map(([day,revenue])=>({day,revenue:+revenue.toFixed(2)}))
}
function buildCategories(products: Product[]) {
  const c: Record<string,number>={}
  products.forEach(p=>{ c[p.category]=(c[p.category]||0)+1 })
  return Object.entries(c).map(([name,value])=>({name,value}))
}

export default function AdminDashboard() {
  const [loading, setLoading]         = useState(true)
  const [isAdmin, setIsAdmin]         = useState(false)
  const [activeTab, setActiveTab]     = useState<Tab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminEmail, setAdminEmail]   = useState('')
  const [saving, setSaving]           = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers]       = useState<UserProfile[]>([])
  const [orders, setOrders]     = useState<Order[]>([])
  const [stats, setStats]       = useState<Stats>({
    total_orders:0, total_revenue:0, total_users:0,
    pending_orders:0, total_products:0, paid_orders:0
  })

  const [productModal, setProductModal] = useState(false)
  const [userModal, setUserModal]       = useState(false)
  const [deleteModal, setDeleteModal]   = useState<{type:string;id:string;name:string}|null>(null)
  const [viewOrder, setViewOrder]       = useState<Order|null>(null)
  const [imgPreview, setImgPreview]     = useState<string|null>(null)

  const [editingProduct, setEditingProduct] = useState<Product|null>(null)
  const [editingUser, setEditingUser]       = useState<UserProfile|null>(null)
  const [pf, setPf] = useState<typeof EMPTY_PRODUCT>(EMPTY_PRODUCT)
  const [uf, setUf] = useState({ email:'', password:'', full_name:'', role:'user' })

  const [productSearch, setProductSearch]         = useState('')
  const [userSearch, setUserSearch]               = useState('')
  const [orderSearch, setOrderSearch]             = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [catFilter, setCatFilter]                 = useState('all')

  const supabase = createClient()
  const router   = useRouter()

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    ;(async()=>{
      const { data:{user} } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data:profile } = await supabase.from('profiles').select('role').eq('id',user.id).single()
      const ok = profile?.role==='admin' || user.email==='admin@edgars.com' || user.user_metadata?.is_admin===true
      if (!ok) { router.push('/'); return }
      setAdminEmail(user.email??'')
      setIsAdmin(true)
      await loadAll()
      setLoading(false)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  // ── Data loaders ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async()=>{
    await Promise.all([loadProducts(),loadUsers(),loadOrders()])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const loadProducts = async()=>{
    const { data,error } = await supabase.from('products').select('*').order('created_at',{ascending:false})
    if (error) { toast.error('Products: '+error.message); return }
    if (data) { setProducts(data); setStats(s=>({...s,total_products:data.length})) }
  }

  const loadUsers = async()=>{
    const { data } = await supabase.from('profiles').select('*').order('created_at',{ascending:false})
    if (data&&data.length>0) { setUsers(data); setStats(s=>({...s,total_users:data.length})); return }
    try {
      const { data:{users:au} } = await supabase.auth.admin.listUsers()
      if (au) {
        const mapped = au.map((u:any)=>({
          id:u.id, email:u.email, created_at:u.created_at,
          full_name:u.user_metadata?.full_name||'',
          role:u.user_metadata?.is_admin?'admin':'user',
          last_sign_in_at:u.last_sign_in_at,
        }))
        setUsers(mapped); setStats(s=>({...s,total_users:mapped.length}))
      }
    } catch { toast.info('Add service role key for full user management') }
  }

  const loadOrders = async()=>{
    const { data,error } = await supabase
      .from('orders').select('*, order_items(*)')
      .order('created_at',{ascending:false}).limit(500)
    if (error) { toast.error('Orders: '+error.message); return }
    if (data) {
      setOrders(data)
      const revenue = data.reduce((s:number,o:any)=>s+getTotal(o),0)
      const pending = data.filter((o:any)=>['pending','pending_payment'].includes(o.status)).length
      const paid    = data.filter((o:any)=>['paid','completed'].includes(o.status)).length
      setStats(s=>({...s,total_orders:data.length,total_revenue:revenue,pending_orders:pending,paid_orders:paid}))
    }
  }

  // ── Product CRUD ─────────────────────────────────────────────────────────────
  const openAdd  = ()=>{ setEditingProduct(null); setPf(EMPTY_PRODUCT); setProductModal(true) }
  const openEdit = (p:Product)=>{
    setEditingProduct(p)
    setPf({ name:p.name, description:p.description||'', price:p.price, category:p.category,
      image_url:p.image_url||'', badge:p.badge||'', color:p.color||'Black',
      rating:p.rating||4.5, reviews:p.reviews||0,
      stock:p.stock||{XS:5,S:10,M:15,L:12,XL:8,XXL:5} })
    setProductModal(true)
  }

  const saveProduct = async()=>{
    if (!pf.name.trim()) { toast.error('Name is required'); return }
    if (!pf.price||pf.price<=0) { toast.error('Valid price is required'); return }
    setSaving(true)
    try {
      const payload = {
        name:pf.name.trim(), description:pf.description.trim(), price:pf.price,
        category:pf.category, image_url:pf.image_url.trim(),
        badge:pf.badge.trim()||null, color:pf.color, stock:pf.stock,
        rating:pf.rating, reviews:pf.reviews,
      }
      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id',editingProduct.id)
        if (error) throw error; toast.success('Product updated!')
      } else {
        const { error } = await supabase.from('products').insert([payload])
        if (error) throw error; toast.success('Product added!')
      }
      setProductModal(false); await loadProducts()
    } catch(e:any){ toast.error(e.message) }
    finally{ setSaving(false) }
  }

  const delProduct = async(id:string)=>{
    const { error } = await supabase.from('products').delete().eq('id',id)
    if (error) { toast.error(error.message); return }
    toast.success('Product deleted'); setDeleteModal(null); await loadProducts()
  }

  // ── User CRUD ─────────────────────────────────────────────────────────────────
  const openAddUser  = ()=>{ setEditingUser(null); setUf({email:'',password:'',full_name:'',role:'user'}); setUserModal(true) }
  const openEditUser = (u:UserProfile)=>{
    setEditingUser(u)
    setUf({ email:u.email, password:'', full_name:u.full_name||u.user_metadata?.full_name||'', role:u.role||(u.user_metadata?.is_admin?'admin':'user') })
    setUserModal(true)
  }

  const saveUser = async()=>{
    if (!uf.email.trim()) { toast.error('Email is required'); return }
    setSaving(true)
    try {
      if (editingUser) {
        await supabase.from('profiles').update({ full_name:uf.full_name, role:uf.role, email:uf.email }).eq('id',editingUser.id)
        try {
          await supabase.auth.admin.updateUserById(editingUser.id,{
            email:uf.email,
            user_metadata:{ full_name:uf.full_name, is_admin:uf.role==='admin' },
            ...(uf.password?{password:uf.password}:{})
          })
        } catch{}
        toast.success('User updated!')
      } else {
        if (!uf.password) { toast.error('Password required'); setSaving(false); return }
        const { error } = await supabase.auth.admin.createUser({
          email:uf.email, password:uf.password,
          user_metadata:{ full_name:uf.full_name, is_admin:uf.role==='admin' },
          email_confirm:true
        })
        if (error) throw error; toast.success('User created!')
      }
      setUserModal(false); await loadUsers()
    } catch(e:any){ toast.error(e.message) }
    finally{ setSaving(false) }
  }

  const delUser = async(id:string)=>{
    try { await supabase.auth.admin.deleteUser(id) }
    catch { await supabase.from('profiles').update({role:'deleted'}).eq('id',id) }
    toast.success('User removed'); setDeleteModal(null); await loadUsers()
  }

  // ── Order status update ───────────────────────────────────────────────────────
  const updateStatus = async(id:string,status:string)=>{
    const { error } = await supabase.from('orders').update({status,payment_status:status==='paid'?'paid':undefined}).eq('id',id)
    if (error) {
      toast.error(`Update failed: ${error.message}`)
      return
    }
    toast.success(`Order marked as ${status}`)
    await loadOrders()
    setViewOrder(v => v?.id===id ? {...v,status} : v)
  }

  // ── Filtered data ─────────────────────────────────────────────────────────────
  const fp = products.filter(p=>
    (catFilter==='all'||p.category===catFilter)&&
    (p.name.toLowerCase().includes(productSearch.toLowerCase())||p.category.toLowerCase().includes(productSearch.toLowerCase()))
  )
  const fu = users.filter(u=>
    (u.email||'').toLowerCase().includes(userSearch.toLowerCase())||
    (u.full_name||'').toLowerCase().includes(userSearch.toLowerCase())
  )
  const fo = orders.filter(o=>
    (orderStatusFilter==='all'||o.status===orderStatusFilter)&&
    o.id.toLowerCase().includes(orderSearch.toLowerCase())
  )

  const revData = buildRevenue(orders)
  const catData = buildCategories(products)
  const logout  = async()=>{ await supabase.auth.signOut(); router.push('/auth/login') }

  // ── Loading / access denied ───────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"/>
        <p className="text-neutral-400">Loading admin panel…</p>
      </div>
    </div>
  )
  if (!isAdmin) return null

  const NAV: {id:Tab;label:string;icon:any;count?:number}[] = [
    {id:'overview', label:'Overview',  icon:LayoutDashboard},
    {id:'products', label:'Products',  icon:Package,    count:products.length},
    {id:'users',    label:'Users',     icon:UsersIcon,  count:users.length},
    {id:'orders',   label:'Orders',    icon:ShoppingBag,count:orders.length},
    {id:'payments', label:'Payments',  icon:CreditCard},
  ]

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-transform duration-300 ${sidebarOpen?'translate-x-0':'-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-neutral-950"/>
            </div>
            <div>
              <h1 className="text-white font-bold text-base">edgARs Admin</h1>
              <p className="text-neutral-500 text-xs truncate max-w-[130px]">{adminEmail}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({id,label,icon:Icon,count})=>(
            <button key={id} onClick={()=>{setActiveTab(id);setSidebarOpen(false)}}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab===id?'bg-amber-500/15 text-amber-400 border border-amber-500/30':'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
              <span className="flex items-center gap-3"><Icon className="w-4 h-4"/>{label}</span>
              {count!==undefined&&<span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">{count}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-800 space-y-1">
          <a href="/shop" target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-neutral-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all text-sm font-medium">
            <ExternalLink className="w-4 h-4"/>View Storefront
          </a>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
            <LogOut className="w-4 h-4"/>Logout
          </button>
        </div>
      </aside>
      {sidebarOpen&&<div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={()=>setSidebarOpen(false)}/>}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-xl hover:bg-neutral-800 transition"><Menu className="w-5 h-5"/></button>
            <div>
              <h2 className="text-white font-bold text-lg capitalize">{activeTab}</h2>
              <p className="text-neutral-500 text-xs">edgARs Fashion Store</p>
            </div>
          </div>
          <button onClick={loadAll} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition" title="Refresh">
            <RefreshCw className="w-4 h-4"/>
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">

          {/* ── OVERVIEW ── */}
          {activeTab==='overview'&&(
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {label:'Revenue',  value:`$${stats.total_revenue.toFixed(2)}`, icon:DollarSign, color:'green'},
                  {label:'Orders',   value:stats.total_orders,                   icon:ShoppingBag,color:'blue'},
                  {label:'Users',    value:stats.total_users,                    icon:UsersIcon,  color:'purple'},
                  {label:'Products', value:stats.total_products,                 icon:Package,    color:'amber'},
                  {label:'Pending',  value:stats.pending_orders,                 icon:Clock,      color:'red'},
                ].map(({label,value,icon:Icon,color})=>{
                  const c={green:'text-green-400 bg-green-500/10 border-green-500/20',blue:'text-blue-400 bg-blue-500/10 border-blue-500/20',purple:'text-purple-400 bg-purple-500/10 border-purple-500/20',amber:'text-amber-400 bg-amber-500/10 border-amber-500/20',red:'text-red-400 bg-red-500/10 border-red-500/20'}[color]
                  return (
                    <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
                        <div className={`p-2 rounded-lg border ${c}`}><Icon className="w-4 h-4"/></div>
                      </div>
                      <p className="text-2xl font-bold text-white">{value}</p>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-amber-400"/>Revenue — Last 7 Days</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={revData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626"/>
                      <XAxis dataKey="day" stroke="#525252" tick={{fontSize:11}}/>
                      <YAxis stroke="#525252" tick={{fontSize:11}}/>
                      <Tooltip contentStyle={{backgroundColor:'#171717',border:'1px solid #404040',borderRadius:8}} formatter={(v:any)=>[`$${Number(v).toFixed(2)}`,'Revenue']}/>
                      <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={{fill:'#f59e0b',r:4}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-amber-400"/>By Category</h3>
                  {catData.length>0?(
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                            {catData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor:'#171717',border:'1px solid #404040',borderRadius:8}}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-3 space-y-1">
                        {catData.slice(0,5).map((d,i)=>(
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{backgroundColor:PIE_COLORS[i%PIE_COLORS.length]}}/>
                              <span className="text-neutral-400">{d.name}</span>
                            </div>
                            <span className="text-white font-medium">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ):<EmptyState icon={Package} text="No products yet"/>}
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                  <h3 className="text-white font-semibold">Recent Orders</h3>
                  <button onClick={()=>setActiveTab('orders')} className="text-xs text-amber-400 hover:underline">View all →</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-neutral-800">{['Order ID','Amount','Method','Status','Date'].map(h=><th key={h} className="text-left px-6 py-3 text-xs text-neutral-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-neutral-800">
                      {orders.slice(0,5).map(o=>(
                        <tr key={o.id} className="hover:bg-neutral-800/40 transition-colors cursor-pointer" onClick={()=>setViewOrder(o)}>
                          <td className="px-6 py-3 font-mono text-xs text-amber-400">{o.id.slice(0,12).toUpperCase()}</td>
                          <td className="px-6 py-3 font-semibold text-white">${getTotal(o).toFixed(2)}</td>
                          <td className="px-6 py-3 text-neutral-400 capitalize">{o.payment_method||'—'}</td>
                          <td className="px-6 py-3"><StatusBadge status={o.status}/></td>
                          <td className="px-6 py-3 text-neutral-500 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length===0&&<EmptyState icon={ShoppingBag} text="No orders yet"/>}
                </div>
              </div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {activeTab==='products'&&(
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"/>
                  <Input value={productSearch} onChange={e=>setProductSearch(e.target.value)} placeholder="Search products…" className="pl-9 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"/>
                </div>
                <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm">
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <Button onClick={openAdd} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold gap-2"><Plus className="w-4 h-4"/>Add Product</Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {fp.map(p=>(
                  <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden group hover:border-amber-500/40 transition-all">
                    <div className="relative aspect-square bg-neutral-800 overflow-hidden">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e=>{(e.target as HTMLImageElement).src='/placeholder.jpg'}}/>
                        : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-neutral-600"/></div>
                      }
                      {p.badge&&<span className="absolute top-2 left-2 text-xs bg-amber-500 text-neutral-950 px-2 py-0.5 rounded-full font-semibold">{p.badge}</span>}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {p.image_url&&<button onClick={()=>setImgPreview(p.image_url)} className="p-1.5 bg-black/70 rounded-lg text-white hover:bg-black transition"><Eye className="w-3.5 h-3.5"/></button>}
                        <button onClick={()=>openEdit(p)} className="p-1.5 bg-black/70 rounded-lg text-white hover:bg-amber-500 hover:text-neutral-950 transition"><Pencil className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>setDeleteModal({type:'product',id:p.id,name:p.name})} className="p-1.5 bg-black/70 rounded-lg text-white hover:bg-red-500 transition"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-white font-semibold text-sm truncate">{p.name}</p>
                      <p className="text-neutral-500 text-xs mt-0.5">{p.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-amber-400 font-bold">${p.price.toFixed(2)}</span>
                        {p.rating&&<span className="flex items-center gap-1 text-xs text-neutral-400"><Star className="w-3 h-3 fill-amber-400 text-amber-400"/>{p.rating}</span>}
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {Object.entries(p.stock||{}).map(([s,q])=>(
                          <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${(q as number)>0?'bg-green-500/15 text-green-400':'bg-red-500/15 text-red-400'}`}>{s}:{q}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {fp.length===0&&(
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl py-16 flex flex-col items-center gap-4">
                  <Package className="w-14 h-14 text-neutral-700"/>
                  <p className="text-neutral-500">No products found</p>
                  <Button onClick={openAdd} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold gap-2"><Plus className="w-4 h-4"/>Add first product</Button>
                </div>
              )}
              <p className="text-xs text-neutral-600">{fp.length} of {products.length} products</p>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab==='users'&&(
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"/>
                  <Input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search users…" className="pl-9 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"/>
                </div>
                <Button onClick={openAddUser} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold gap-2"><Plus className="w-4 h-4"/>Add User</Button>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-neutral-800">{['User','Role','Last Sign In','Joined','Actions'].map(h=><th key={h} className="text-left px-6 py-4 text-xs text-neutral-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-neutral-800">
                      {fu.map(u=>(
                        <tr key={u.id} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-600/30 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                                {((u.full_name||u.email||'U')[0]).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{u.full_name||u.user_metadata?.full_name||'—'}</p>
                                <p className="text-neutral-500 text-xs">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${u.role==='admin'||u.user_metadata?.is_admin?'bg-amber-500/20 text-amber-400':'bg-neutral-800 text-neutral-400'}`}>
                              {u.role==='admin'||u.user_metadata?.is_admin?<><Shield className="w-3 h-3"/>Admin</>:<><UserCheck className="w-3 h-3"/>Customer</>}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-neutral-500 text-xs">{u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleDateString():'—'}</td>
                          <td className="px-6 py-4 text-neutral-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={()=>openEditUser(u)} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"><Pencil className="w-3.5 h-3.5"/></button>
                              <button onClick={()=>setDeleteModal({type:'user',id:u.id,name:u.email})} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {fu.length===0&&<EmptyState icon={UsersIcon} text="No users found"/>}
                </div>
                <div className="px-6 py-3 border-t border-neutral-800 text-xs text-neutral-600">{fu.length} of {users.length} users</div>
              </div>
            </div>
          )}

          {/* ── ORDERS ── */}
          {activeTab==='orders'&&(
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"/>
                  <Input value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} placeholder="Search order ID…" className="pl-9 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"/>
                </div>
                <select value={orderStatusFilter} onChange={e=>setOrderStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm">
                  {['all','pending','pending_payment','paid','completed','cancelled'].map(s=>(
                    <option key={s} value={s}>{s==='all'?'All Statuses':s.replace('_',' ').replace(/^\w/,c=>c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {label:'Total',     count:orders.length},
                  {label:'Pending',   count:orders.filter(o=>['pending','pending_payment'].includes(o.status)).length},
                  {label:'Paid',      count:orders.filter(o=>['paid','completed'].includes(o.status)).length},
                  {label:'Cancelled', count:orders.filter(o=>o.status==='cancelled').length},
                ].map(({label,count})=>(
                  <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-neutral-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-neutral-800">{['Order ID','Amount','Items','Method','Status','Date','Actions'].map(h=><th key={h} className="text-left px-6 py-4 text-xs text-neutral-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-neutral-800">
                      {fo.map(o=>(
                        <tr key={o.id} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-amber-400">{o.id.slice(0,12).toUpperCase()}</td>
                          <td className="px-6 py-4 font-semibold text-white">${getTotal(o).toFixed(2)}</td>
                          <td className="px-6 py-4 text-neutral-400">{o.order_items?.length||(o.items as any)?.length||0}</td>
                          <td className="px-6 py-4 text-neutral-400 capitalize">{o.payment_method||'—'}</td>
                          <td className="px-6 py-4"><StatusBadge status={o.status}/></td>
                          <td className="px-6 py-4 text-neutral-500 text-xs whitespace-nowrap">{new Date(o.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={()=>setViewOrder(o)} className="text-xs px-2 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition">View</button>
                              {['pending','pending_payment'].includes(o.status)&&<button onClick={()=>updateStatus(o.id,'paid')} className="text-xs px-2 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition">Paid</button>}
                              {!['cancelled','completed'].includes(o.status)&&<button onClick={()=>updateStatus(o.id,'cancelled')} className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">Cancel</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {fo.length===0&&<EmptyState icon={ShoppingBag} text="No orders found"/>}
                </div>
                <div className="px-6 py-3 border-t border-neutral-800 text-xs text-neutral-600">{fo.length} of {orders.length} orders</div>
              </div>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {activeTab==='payments'&&(
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {label:'Total Revenue', value:`$${stats.total_revenue.toFixed(2)}`,color:'green'},
                  {label:'Paid Orders',   value:stats.paid_orders,                  color:'blue'},
                  {label:'Pending',       value:stats.pending_orders,               color:'amber'},
                ].map(({label,value,color})=>(
                  <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">{label}</p>
                    <p className={`text-3xl font-bold ${color==='green'?'text-green-400':color==='blue'?'text-blue-400':'text-amber-400'}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Daily Revenue (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626"/>
                    <XAxis dataKey="day" stroke="#525252" tick={{fontSize:11}}/>
                    <YAxis stroke="#525252" tick={{fontSize:11}}/>
                    <Tooltip contentStyle={{backgroundColor:'#171717',border:'1px solid #404040',borderRadius:8}} formatter={(v:any)=>[`$${Number(v).toFixed(2)}`,'Revenue']}/>
                    <Bar dataKey="revenue" fill="#f59e0b" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-neutral-800">{['Transaction ID','Amount','Method','Status','Date & Time'].map(h=><th key={h} className="text-left px-6 py-4 text-xs text-neutral-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-neutral-800">
                      {orders.map(o=>(
                        <tr key={o.id} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-amber-400">{o.id.slice(0,14).toUpperCase()}</td>
                          <td className="px-6 py-4 font-bold text-white">${getTotal(o).toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${o.payment_method==='paynow'?'bg-blue-500/20 text-blue-400':o.payment_method==='cod'?'bg-green-500/20 text-green-400':'bg-purple-500/20 text-purple-400'}`}>
                              {o.payment_method==='paynow'?'PayNow':o.payment_method==='cod'?'Cash on Delivery':o.payment_method||'Pay Later'}
                            </span>
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={o.status}/></td>
                          <td className="px-6 py-4 text-neutral-500 text-xs whitespace-nowrap">{new Date(o.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length===0&&<EmptyState icon={CreditCard} text="No payment records"/>}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODALS ── */}

      {/* Product modal */}
      <Dialog open={productModal} onOpenChange={v=>{if(!saving)setProductModal(v)}}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white text-lg">{editingProduct?'Edit Product':'Add New Product'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {pf.image_url&&(
              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-neutral-800">
                <img src={pf.image_url} alt="Preview" className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Product Name *</label><Input value={pf.name} onChange={e=>setPf(p=>({...p,name:e.target.value}))} placeholder="e.g. Classic White T-Shirt" className="bg-neutral-800 border-neutral-700 text-white"/></div>
              <div><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Price (USD) *</label><Input type="number" min="0" step="0.01" value={pf.price} onChange={e=>setPf(p=>({...p,price:parseFloat(e.target.value)||0}))} className="bg-neutral-800 border-neutral-700 text-white"/></div>
              <div><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Category</label><select value={pf.category} onChange={e=>setPf(p=>({...p,category:e.target.value}))} className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm">{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Color</label><Input value={pf.color} onChange={e=>setPf(p=>({...p,color:e.target.value}))} placeholder="Black, White…" className="bg-neutral-800 border-neutral-700 text-white"/></div>
              <div><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Badge (optional)</label><Input value={pf.badge} onChange={e=>setPf(p=>({...p,badge:e.target.value}))} placeholder="New Arrival, Sale…" className="bg-neutral-800 border-neutral-700 text-white"/></div>
              <div className="col-span-2"><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Image URL</label><Input value={pf.image_url} onChange={e=>setPf(p=>({...p,image_url:e.target.value}))} placeholder="https://…" className="bg-neutral-800 border-neutral-700 text-white"/></div>
              <div className="col-span-2"><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Description</label><textarea value={pf.description} onChange={e=>setPf(p=>({...p,description:e.target.value}))} rows={3} placeholder="Product description…" className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm resize-none focus:outline-none focus:border-amber-500"/></div>
              <div className="col-span-2">
                <label className="text-xs text-neutral-400 mb-2 block font-medium">Stock per Size</label>
                <div className="grid grid-cols-6 gap-2">
                  {SIZES.map(s=>(
                    <div key={s} className="text-center">
                      <p className="text-xs text-neutral-500 mb-1">{s}</p>
                      <Input type="number" min="0" value={pf.stock[s]??0} onChange={e=>setPf(p=>({...p,stock:{...p.stock,[s]:parseInt(e.target.value)||0}}))} className="bg-neutral-800 border-neutral-700 text-white text-center px-1 text-sm"/>
                    </div>
                  ))}
                </div>
              </div>
              <div><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Rating (0–5)</label><Input type="number" min="0" max="5" step="0.1" value={pf.rating} onChange={e=>setPf(p=>({...p,rating:parseFloat(e.target.value)||0}))} className="bg-neutral-800 border-neutral-700 text-white"/></div>
              <div><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Review Count</label><Input type="number" min="0" value={pf.reviews} onChange={e=>setPf(p=>({...p,reviews:parseInt(e.target.value)||0}))} className="bg-neutral-800 border-neutral-700 text-white"/></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={()=>setProductModal(false)} className="text-neutral-400 hover:text-white" disabled={saving}>Cancel</Button>
            <Button onClick={saveProduct} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold gap-2" disabled={saving}>
              {saving?<div className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin"/>:<Save className="w-4 h-4"/>}
              {editingProduct?'Update':'Add'} Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User modal */}
      <Dialog open={userModal} onOpenChange={v=>{if(!saving)setUserModal(v)}}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editingUser?'Edit User':'Add New User'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Full Name</label><Input value={uf.full_name} onChange={e=>setUf(u=>({...u,full_name:e.target.value}))} placeholder="John Doe" className="bg-neutral-800 border-neutral-700 text-white"/></div>
            <div><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Email *</label><Input type="email" value={uf.email} onChange={e=>setUf(u=>({...u,email:e.target.value}))} placeholder="user@example.com" className="bg-neutral-800 border-neutral-700 text-white"/></div>
            <div><label className="text-xs text-neutral-400 mb-1.5 block font-medium">Password {editingUser?'(blank = keep current)':'*'}</label><Input type="password" value={uf.password} onChange={e=>setUf(u=>({...u,password:e.target.value}))} placeholder={editingUser?'Leave blank to keep current':'Min 6 characters'} className="bg-neutral-800 border-neutral-700 text-white"/></div>
            <div>
              <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Role</label>
              <select value={uf.role} onChange={e=>setUf(u=>({...u,role:e.target.value}))} className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm">
                <option value="user">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {uf.role==='admin'&&(
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0"/>
                <p className="text-xs text-amber-300">Admin users have full access to this dashboard.</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={()=>setUserModal(false)} className="text-neutral-400 hover:text-white" disabled={saving}>Cancel</Button>
            <Button onClick={saveUser} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold gap-2" disabled={saving}>
              {saving?<div className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin"/>:<Save className="w-4 h-4"/>}
              {editingUser?'Update':'Create'} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete modal */}
      <Dialog open={!!deleteModal} onOpenChange={()=>setDeleteModal(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-sm">
          <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400"/>Confirm Delete</DialogTitle></DialogHeader>
          <p className="text-neutral-400 text-sm py-2">Are you sure you want to delete <span className="text-white font-medium">&quot;{deleteModal?.name}&quot;</span>? This cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={()=>setDeleteModal(null)} className="text-neutral-400 hover:text-white">Cancel</Button>
            <Button onClick={()=>deleteModal?.type==='product'?delProduct(deleteModal.id):delUser(deleteModal!.id)} className="bg-red-600 hover:bg-red-500 text-white font-semibold gap-2"><Trash2 className="w-4 h-4"/>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order detail modal */}
      <Dialog open={!!viewOrder} onOpenChange={()=>setViewOrder(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">Order Details</DialogTitle></DialogHeader>
          {viewOrder&&(
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-neutral-500 text-xs mb-1">Order ID</p><p className="text-amber-400 font-mono text-xs">{viewOrder.id.slice(0,16).toUpperCase()}</p></div>
                <div><p className="text-neutral-500 text-xs mb-1">Status</p><StatusBadge status={viewOrder.status}/></div>
                <div><p className="text-neutral-500 text-xs mb-1">Total</p><p className="text-white font-bold">${getTotal(viewOrder).toFixed(2)}</p></div>
                <div><p className="text-neutral-500 text-xs mb-1">Payment</p><p className="text-white capitalize">{viewOrder.payment_method||'—'}</p></div>
                <div className="col-span-2"><p className="text-neutral-500 text-xs mb-1">Date</p><p className="text-white">{new Date(viewOrder.created_at).toLocaleString()}</p></div>
              </div>
              {(viewOrder.order_items||viewOrder.items)&&(
                <div>
                  <p className="text-neutral-500 text-xs mb-2">Items</p>
                  <div className="space-y-2">
                    {(viewOrder.order_items||(viewOrder.items as any[])||[]).map((item:any,i:number)=>(
                      <div key={i} className="flex items-center justify-between bg-neutral-800 rounded-lg px-3 py-2 text-sm">
                        <span className="text-white">{item.name||item.product_name||`Item ${i+1}`}{item.size?` (${item.size})`:''}</span>
                        <span className="text-neutral-400">×{item.quantity||1} · ${((item.price||0)*(item.quantity||1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {['pending','pending_payment'].includes(viewOrder.status)&&<Button onClick={()=>{updateStatus(viewOrder.id,'paid');setViewOrder(null)}} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm">Mark as Paid</Button>}
                {!['cancelled','completed'].includes(viewOrder.status)&&<Button onClick={()=>{updateStatus(viewOrder.id,'cancelled');setViewOrder(null)}} variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm">Cancel Order</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image preview */}
      {imgPreview&&(
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={()=>setImgPreview(null)}>
          <div className="relative max-w-xl w-full" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setImgPreview(null)} className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-white hover:bg-neutral-700"><X className="w-4 h-4"/></button>
            <img src={imgPreview} alt="Preview" className="w-full rounded-2xl shadow-2xl"/>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusBadge({status}:{status:string}) {
  const m:Record<string,{c:string;i:any}> = {
    paid:            {c:'bg-green-500/20 text-green-400',  i:CheckCircle2},
    completed:       {c:'bg-green-500/20 text-green-400',  i:CheckCircle2},
    pending:         {c:'bg-amber-500/20 text-amber-400',  i:Clock},
    pending_payment: {c:'bg-amber-500/20 text-amber-400',  i:Clock},
    cancelled:       {c:'bg-red-500/20   text-red-400',    i:XCircle},
    failed:          {c:'bg-red-500/20   text-red-400',    i:XCircle},
  }
  const s = m[status] || {c:'bg-neutral-700 text-neutral-400', i:Clock}
  const Icon = s.i
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${s.c}`}>
      <Icon className="w-3 h-3"/>{status.replace(/_/g,' ')}
    </span>
  )
}

function EmptyState({icon:Icon,text}:{icon:any;text:string}) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-neutral-600">
      <Icon className="w-10 h-10"/><p className="text-sm">{text}</p>
    </div>
  )
}

// Inline icon to avoid name collision with lucide Users import used in NAV type
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
