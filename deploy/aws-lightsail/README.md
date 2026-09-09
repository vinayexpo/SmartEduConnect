# AWS Lightsail Deployment

This project is safest on Lightsail with split origins:

- frontend SPA: `https://app.example.com`
- Laravel API: `https://api.example.com`

The backend API currently uses root paths like `/auth`, `/gallery`, `/fees`, so putting frontend and backend on the same hostname will create route collisions with the SPA.

## 1. Frontend server

Optional server bootstrap:

```bash
sudo bash deploy/aws-lightsail/bootstrap-server.sh
```

Build on the app server:

```bash
npm install
npm run build
```

Deploy the `dist/` folder to `/var/www/smarteduconnect-frontend/dist`.

Use the sample config:

- `deploy/aws-lightsail/frontend-nginx.conf`

## 2. Backend server

Deploy Laravel to `/var/www/smarteduconnect-api/backend`.

Install dependencies:

```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Use the sample config:

- `deploy/aws-lightsail/backend-nginx.conf`
- `deploy/aws-lightsail/deploy-app.sh`

## 3. Environment values

Frontend `.env` (build-time — rebuild after changing):

```env
VITE_API_BASE_URL=https://api.example.com
VITE_REVERB_APP_KEY=production-app-key
VITE_REVERB_HOST=ws.example.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

Backend `.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
FRONTEND_URL=https://app.example.com
ALLOWED_ORIGINS=https://app.example.com
FILESYSTEM_DISK=s3
QUEUE_CONNECTION=database
SESSION_SECURE_COOKIE=true
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=production-app-id
REVERB_APP_KEY=production-app-key
REVERB_APP_SECRET=production-app-secret
REVERB_HOST="0.0.0.0"
REVERB_PORT=6001
REVERB_SCHEME=http
```

If you need an extra preview origin, add it to:

```env
ALLOWED_ORIGINS=https://preview.example.com
```

## S3 storage configuration

This app is already refactored to use the active Laravel filesystem disk for the main upload flows. With `FILESYSTEM_DISK=s3`, new uploads are stored in S3 instead of local server storage.

Set these backend env values:

```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=ap-south-2
AWS_BUCKET=schoolwebapp1
AWS_URL=
AWS_ENDPOINT=
AWS_USE_PATH_STYLE_ENDPOINT=false
```

What goes to S3 after deployment:

- gallery images
- message attachments
- receipt logos
- profile photos
- teacher photos
- student photos
- homework attachments
- leave documents
- certificate documents

How uploaded files are linked:

- the backend stores the returned file path on the active disk
- the app builds the public file URL from the active disk configuration
- for S3, new `image_url`, `attachment_url`, `photo_url`, and `logo_url` values should resolve to S3-based URLs instead of `/uploads/...`

Important:

- old files that already exist on local disk are not moved automatically
- only new uploads go to S3 unless you separately migrate older files
- if `AWS_URL` is blank, the app will use the bucket/region-based S3 URL format

How to verify S3 is actually working:

1. Deploy the app with the S3 env values above
2. Run:
   `cd /var/www/smarteduconnect-api/backend && php artisan config:clear && php artisan cache:clear && php artisan config:cache`
3. Upload one file from a real module such as Gallery or Receipt Logo
4. Confirm the saved file URL is an S3 URL, not `/uploads/...`
5. Confirm the uploaded object appears in bucket `schoolwebapp1`

If uploads fail, check:

- AWS credentials
- bucket name and region
- bucket/object permissions
- S3 CORS policy if browser access is blocked
- Laravel logs in `backend/storage/logs/laravel.log`

## 4. Required writable paths

Make these writable by the web user:

```bash
sudo chown -R www-data:www-data /var/www/smarteduconnect-api/backend/storage
sudo chown -R www-data:www-data /var/www/smarteduconnect-api/backend/bootstrap/cache
sudo chmod -R 775 /var/www/smarteduconnect-api/backend/storage
sudo chmod -R 775 /var/www/smarteduconnect-api/backend/bootstrap/cache
```

## 5. Queue worker

Run notifications/jobs with systemd:

```bash
sudo cp deploy/aws-lightsail/laravel-queue.service /etc/systemd/system/smarteduconnect-queue.service
sudo systemctl daemon-reload
sudo systemctl enable --now smarteduconnect-queue.service
```

## 6. Realtime (Reverb WebSocket)

```bash
sudo cp deploy/aws-lightsail/laravel-reverb.service /etc/systemd/system/smarteduconnect-reverb.service
sudo cp deploy/aws-lightsail/reverb-nginx.conf /etc/nginx/sites-available/smarteduconnect-reverb
sudo ln -s /etc/nginx/sites-available/smarteduconnect-reverb /etc/nginx/sites-enabled/smarteduconnect-reverb
sudo systemctl daemon-reload
sudo systemctl enable --now smarteduconnect-reverb.service
sudo nginx -t
sudo systemctl reload nginx
```

Verify the socket accepts connections: `sudo systemctl status smarteduconnect-reverb`
should show active, and `/var/log/smarteduconnect-reverb.log` should show
`Starting server on 0.0.0.0:6001`. If a message send ever fails because the
socket server is down, the backend logs a warning and still stores the
message — chat degrades to refresh-on-focus instead of breaking.

## 7. SSL

Point DNS:

- `app.example.com` -> frontend instance/static distribution
- `api.example.com` -> Lightsail instance
- `ws.example.com` -> Lightsail instance (Reverb)

Then issue TLS certificates with Certbot (including `ws.example.com`) and
uncomment the certificate lines in the sample Nginx configs.

## 8. Post-deploy checks

1. Open `https://app.example.com`
2. Confirm login requests go to `https://api.example.com/auth/...`
3. Upload one file and confirm the stored URL is S3-based
4. Confirm notifications and messaging API calls are not blocked by CORS
5. Open the browser devtools Network tab, filter `WS`, send a chat message
   from a second account — a `wss://ws.example.com` frame with
   `message.sent` should arrive without any `/messaging/messages` polling

## Quick deploy flow

After copying the repo to the server:

```bash
cd /var/www/smarteduconnect-api
bash deploy/aws-lightsail/deploy-app.sh
```

Then:

```bash
sudo cp deploy/aws-lightsail/frontend-nginx.conf /etc/nginx/sites-available/smarteduconnect-frontend
sudo cp deploy/aws-lightsail/backend-nginx.conf /etc/nginx/sites-available/smarteduconnect-backend
sudo ln -s /etc/nginx/sites-available/smarteduconnect-frontend /etc/nginx/sites-enabled/smarteduconnect-frontend
sudo ln -s /etc/nginx/sites-available/smarteduconnect-backend /etc/nginx/sites-enabled/smarteduconnect-backend
sudo nginx -t
sudo systemctl reload nginx
sudo cp deploy/aws-lightsail/laravel-queue.service /etc/systemd/system/smarteduconnect-queue.service
sudo systemctl daemon-reload
sudo systemctl enable --now smarteduconnect-queue.service
```
