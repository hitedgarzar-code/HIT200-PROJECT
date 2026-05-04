# EDGARS Clothing Store - Deployment Guide

## 🚀 Deployment Options

### Option 1: Deploy to Vercel (Recommended)

Vercel is the official Next.js hosting platform and provides the best experience.

#### Steps:

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit: EDGARS clothing store"
git remote add origin https://github.com/yourusername/edgars-store
git push -u origin main
```

2. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Select "Import Git Repository"
   - Choose your GitHub repository
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel Dashboard > Settings > Environment Variables
   - Add these three variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes for deployment
   - Your app is live at `https://yourapp.vercel.app`

**Cost**: Free tier includes 100 GB bandwidth/month. Great for startups!

---

### Option 2: Self-Hosted on Your Server

#### Prerequisites:
- Node.js 18+ installed
- NPM/PNPM package manager
- PM2 or similar process manager
- Nginx or Apache for reverse proxy

#### Steps:

1. **Prepare Server**
```bash
# SSH into your server
ssh user@your-server.com

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
```

2. **Clone and Setup**
```bash
# Clone repository
git clone https://github.com/yourusername/edgars-store
cd edgars-store

# Create .env.production
cp .env.example .env.production
# Edit .env.production with Supabase credentials

# Install dependencies
npm install

# Build for production
npm run build
```

3. **Start with PM2**
```bash
# Start the app
pm2 start "npm start" --name "edgars"

# Save PM2 config
pm2 save

# Auto-restart on server reboot
pm2 startup
```

4. **Configure Nginx**
```nginx
# /etc/nginx/sites-available/edgars.com
server {
    listen 80;
    server_name edgars.com www.edgars.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Enable HTTPS (SSL)**
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d edgars.com -d www.edgars.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

**Cost**: Depends on server hosting ($5-50+/month)

---

### Option 3: Deploy to Other Platforms

#### AWS EC2
```bash
# See Option 2 (similar process)
# Plus: Use RDS for database backup
# Plus: Use CloudFront for CDN
```

#### DigitalOcean
```bash
# 1. Create Droplet (Node.js preset)
# 2. SSH into droplet
# 3. Follow Option 2 steps
# 4. Use DigitalOcean Spaces for image CDN
```

#### Netlify
- Netlify doesn't fully support Next.js backend features
- Better for static sites
- Not recommended for this project

#### Google Cloud, Azure, Heroku
- Follow similar patterns to Option 2
- Use platform-specific documentation
- May require additional configuration

---

## 🔧 Post-Deployment Setup

### 1. Configure Supabase for Production

**Email Settings:**
1. Go to Supabase Dashboard > Authentication > Email Templates
2. Customize "Confirm signup" and "Reset password" emails
3. Add your company branding

**Email Provider:**
1. Go to Settings > Email
2. Configure custom SMTP or use Supabase's built-in
3. Set sender email address

**Redirect URLs:**
1. Go to Authentication > URL Configuration
2. Add your production domain:
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com
   ```

### 2. Set Up Custom Domain

**For Vercel:**
1. Dashboard > Settings > Domains
2. Add your domain
3. Follow DNS configuration instructions

**For Self-Hosted:**
1. Point domain to your server IP in DNS
2. Configure Nginx/Apache
3. Set up SSL certificate

### 3. Enable Backups

**Supabase Backups:**
1. Go to Settings > Backups
2. Enable daily automated backups
3. Configure backup retention

**Database Backups:**
```bash
# Manual PostgreSQL backup
pg_dump dbname > backup.sql

# Backup to file
pg_dump -U username -h host > backup.sql

# Schedule with cron
0 2 * * * pg_dump ... > /backups/$(date +\%Y\%m\%d).sql
```

### 4. Monitor Performance

**Vercel Analytics:**
- Dashboard > Analytics
- Monitor Web Vitals
- Check error rates

**Server Monitoring:**
```bash
# SSH into server
pm2 monit  # Monitor PM2 processes
top        # Check CPU/Memory
df -h      # Check disk space
```

### 5. Set Up Email Notifications

**Vercel Deployments:**
1. Settings > Notifications
2. Enable email alerts for failures

**Server Alerts:**
```bash
# Install monitoring tool
sudo apt-get install monit

# Configure alerts in /etc/monit/monitrc
```

---

## 📊 Performance Optimization

### 1. Enable Caching

**Vercel:**
- Automatic caching of static assets
- ISR (Incremental Static Regeneration) for product pages

**Nginx:**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Image Optimization

Next.js handles this automatically with `next/image`. Update ProductCard:
```typescript
import Image from 'next/image'

<Image
  src={product.image_url}
  alt={product.name}
  width={500}
  height={500}
  priority={false}
/>
```

### 3. Database Optimization

**Create Indexes:**
```sql
-- In Supabase SQL Editor
CREATE INDEX products_category_idx ON products(category);
CREATE INDEX orders_user_id_idx ON orders(user_id);
CREATE INDEX carts_user_id_idx ON carts(user_id);
```

---

## 🔒 Security Checklist

- [ ] SSL/HTTPS enabled
- [ ] Environment variables not in version control
- [ ] Supabase RLS policies configured
- [ ] Email verification enabled
- [ ] Password requirements set (Supabase > Auth > Policies)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Database backups enabled
- [ ] Admin users verified
- [ ] Error logging configured

### Security Commands

```bash
# Check .gitignore includes sensitive files
cat .gitignore | grep -E "env|secrets"

# Scan for exposed secrets
npm install -g git-secrets
git secrets --install
```

---

## 📈 Scaling Strategy

### When Traffic Increases:

**Phase 1: 1,000-10,000 users/month**
- Current setup handles fine
- Monitor Supabase usage
- Consider upgrading to Supabase Pro ($25/month)

**Phase 2: 10,000-100,000 users/month**
- Enable Supabase read replicas
- Set up CDN for images (Cloudflare, Vercel Edge)
- Implement caching layer (Redis)
- Consider Next.js Enterprise features

**Phase 3: 100,000+ users/month**
- Dedicated Supabase database
- Multi-region deployment
- Advanced analytics and monitoring
- Dedicated infrastructure

### Database Scaling
```sql
-- Enable connection pooling in Supabase
-- Settings > Database > Connection Pooling
-- Set to at least 3 for production
```

---

## 🚨 Monitoring & Alerts

### Set Up Error Tracking

**Option 1: Vercel Error Tracking**
- Built-in to Vercel
- Check Dashboard > Monitoring

**Option 2: Sentry (Free):**
```bash
npm install @sentry/nextjs

# In middleware.ts
import * as Sentry from "@sentry/nextjs"
Sentry.init({
  dsn: process.env.SENTRY_DSN,
})
```

### Monitor Database Health

```sql
-- Check connection count
SELECT count(*) FROM pg_stat_activity;

-- Check disk usage
SELECT datname, pg_size_pretty(pg_database_size(datname))
FROM pg_database;

-- Slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements
ORDER BY mean_exec_time DESC;
```

---

## 🔄 Continuous Deployment

### Automatic Deployments with Vercel

Vercel automatically deploys when you push to main:
```bash
git push origin main
# Vercel automatically builds and deploys
# Check deployment: Dashboard > Deployments
```

### Manual Deployments

```bash
# If needed, manually trigger deployment
vercel --prod

# Or through Vercel CLI
npm install -g vercel
vercel login
vercel --prod
```

---

## 📝 Deployment Checklist

**Before Going Live:**
- [ ] All environment variables configured
- [ ] Database schema created
- [ ] Sample products seeded (or real products added)
- [ ] Authentication tested (signup → email → login)
- [ ] Shopping cart tested
- [ ] Checkout flow tested
- [ ] Admin dashboard access verified
- [ ] Email configuration working
- [ ] SSL/HTTPS enabled
- [ ] Custom domain configured
- [ ] Backups enabled
- [ ] Monitoring/alerts configured

**After Going Live:**
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify email delivery
- [ ] Test payment flow (if applicable)
- [ ] Monitor database performance
- [ ] Check server logs
- [ ] Announce launch!

---

## 🆘 Troubleshooting Deployments

### "Build failed"
Check Vercel Build Logs > Errors section. Common causes:
- Missing environment variables
- TypeScript errors
- Missing dependencies

### "White screen of death"
- Check browser console for errors
- Check server logs: `pm2 logs`
- Verify Supabase URL is correct

### "Slow performance"
- Check database queries in Supabase
- Enable caching
- Optimize images
- Check server resources (CPU, memory)

### "Database connection errors"
- Verify connection string
- Check Supabase status
- Restart connection pool
- Check firewall rules

---

## 📞 Support & Help

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Nginx Docs**: https://nginx.org/en/docs/
- **Certbot**: https://certbot.eff.org/

---

**Deployment Status**: ✅ Ready to Deploy  
**Recommended Platform**: Vercel (easiest setup)  
**Alternative**: Self-hosted on DigitalOcean or AWS

Good luck launching your fashion store! 🎉
