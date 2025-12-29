# Deployment Guide for AWS EC2

This guide will help you deploy the CoXist AI Startup Accelerator application on AWS EC2 using Docker and Docker Compose.

## Prerequisites

- AWS EC2 instance running Ubuntu
- Docker and Docker Compose installed
- Domain name (optional, but recommended)
- Security groups configured to allow traffic on ports 3000 (frontend) and 3001 (backend)

## Step 1: Server Setup

### Install Docker and Docker Compose

```bash
# Update system packages
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run docker without sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and log back in for group changes to take effect
```

### Verify Installation

```bash
docker --version
docker-compose --version
```

## Step 2: Clone Repository

```bash
# Clone your repository
git clone <your-repo-url>
cd coxistai-startup-accelerator
```

## Step 3: Configure Environment Variables

### Backend Environment Variables

Create or edit `backend/.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://YOUR_PUBLIC_IP:3000

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT Configuration
JWT_SECRET=your-secret-key-here

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Plaid Configuration
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox
PLAID_PRODUCTS=transactions
PLAID_COUNTRY_CODES=US
PLAID_REDIRECT_URI=http://YOUR_PUBLIC_IP:3000/plaid/oauth
PLAID_ENCRYPTION_KEY=your-plaid-encryption-key

# Stripe Configuration
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# CORS Configuration
CORS_ORIGIN=http://YOUR_PUBLIC_IP:3000

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=onboarding@coxistai.com
```

**Important**: Replace `YOUR_PUBLIC_IP` with your EC2 instance's public IP address.

### Frontend Environment Variables

Create or edit `frontend/.env`:

```bash
NEXT_PUBLIC_API_URL=http://YOUR_PUBLIC_IP:3001/api/v1
```

**Important**: Replace `YOUR_PUBLIC_IP` with your EC2 instance's public IP address.

## Step 4: Configure AWS Security Groups

In your AWS EC2 console:

1. Go to **Security Groups**
2. Select your instance's security group
3. Add inbound rules:
   - **Type**: Custom TCP
   - **Port**: 3000
   - **Source**: 0.0.0.0/0 (or your specific IP for better security)
   - **Description**: Frontend HTTP
   
   - **Type**: Custom TCP
   - **Port**: 3001
   - **Source**: 0.0.0.0/0 (or your specific IP for better security)
   - **Description**: Backend API

## Step 5: Build and Start Containers

```bash
# Build the images
docker-compose build

# Start the containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check container status
docker-compose ps
```

## Step 6: Verify Deployment

### Check Backend Health

```bash
curl http://YOUR_PUBLIC_IP:3001/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": "production",
  "database": "connected",
  "version": "1.0.0"
}
```

### Check Frontend

Open your browser and navigate to:
```
http://YOUR_PUBLIC_IP:3000
```

## Step 7: Database Setup (First Time)

If this is the first deployment, you need to run database migrations:

```bash
# Enter the backend container
docker exec -it coxist-backend sh

# Run Prisma migrations
npx prisma db push

# (Optional) Seed the database
npm run db:seed

# Exit container
exit
```

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Stop Services

```bash
docker-compose down
```

### Update and Redeploy

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Troubleshooting

### Container Won't Start

1. Check logs: `docker-compose logs <service-name>`
2. Verify environment variables are set correctly
3. Check if ports are already in use: `sudo netstat -tulpn | grep :3000`

### Database Connection Issues

1. Verify `DATABASE_URL` is correct in `backend/.env`
2. Check if database is accessible from EC2 instance
3. Verify database security settings allow connections from EC2 IP

### Frontend Can't Connect to Backend

1. Verify `NEXT_PUBLIC_API_URL` in `frontend/.env` matches backend URL
2. Check CORS settings in backend
3. Verify both containers are on the same Docker network

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process if needed
sudo kill -9 <PID>
```

## Production Recommendations

### 1. Use a Reverse Proxy (Nginx)

For production, it's recommended to use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

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

### 2. Enable HTTPS

Use Let's Encrypt with Certbot for free SSL certificates:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. Set Up Auto-Restart

Docker Compose already includes `restart: unless-stopped`, but you can also set up systemd service:

```bash
sudo nano /etc/systemd/system/coxist.service
```

```ini
[Unit]
Description=CoXist AI Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/coxistai-startup-accelerator
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable coxist.service
sudo systemctl start coxist.service
```

### 4. Monitor Resources

```bash
# View container resource usage
docker stats

# View disk usage
docker system df
```

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive information
2. **Use strong JWT secrets** - Generate with: `openssl rand -base64 32`
3. **Restrict security group access** - Only allow necessary IPs
4. **Keep Docker updated** - Regularly update Docker and images
5. **Use environment-specific configs** - Different configs for dev/staging/prod
6. **Enable firewall** - Use `ufw` to restrict access

## Support

For issues or questions, check:
- Application logs: `docker-compose logs`
- System logs: `journalctl -u docker`
- Container status: `docker-compose ps`

