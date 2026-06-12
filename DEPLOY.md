# TrueSkill HRMS — Backend Deployment Guide

Deploys the Node/Express/MySQL API behind nginx + Let's Encrypt on an Ubuntu VPS.
Reference deployment: domain `truehr.co.in`, app on PM2 at `127.0.0.1:4000`, MySQL on
BigRock shared hosting (`sh201.bigrock.com`).

---

## 1. Prerequisites on the VPS

```bash
# Node 20 + tooling
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
sudo npm install -g pm2
```

## 2. Get the code

```bash
cd /var/www
git clone https://github.com/koustav2/trueskill-hrms.git hrms-backend
cd hrms-backend
```

## 3. Database

**Shared hosting (cPanel):** create the DB + user in cPanel, then in
cPanel → **Remote MySQL**, whitelist the VPS public IP. No SQL needed here.

**Local MySQL instead:**
```bash
sudo apt-get install -y mysql-server
sudo mysql <<'SQL'
CREATE DATABASE IF NOT EXISTS trueskill_hrms CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'trueskill'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON trueskill_hrms.* TO 'trueskill'@'localhost';
FLUSH PRIVILEGES;
SQL
```

## 4. Configure environment

```bash
cp .env.production.example .env
nano .env
```
Fill in (generate secrets with `openssl rand -hex 48` and `openssl rand -hex 32`):

| Var | Notes |
|-----|-------|
| `DB_HOST/DB_NAME/DB_USER/DB_PASSWORD` | Use EXACT cPanel names (shared prefix, e.g. `lrtecbyp_…`). Variable is `DB_PASSWORD`, not `DB_PASS`. |
| `DB_POOL_MAX` | `5` for shared hosting (lower to `3` if you hit "Too many connections"). |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | `openssl rand -hex 48` each. |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` — **exactly 64 hex chars**. |
| `APP_BASE_URL` | `https://truehr.co.in` |
| `WEB_VERIFY_URL` | `https://truehr.co.in/verify-email` |
| `CORS_ORIGINS` | real origins, not `*`. |
| `TRUST_PROXY` | **`true`** — required behind nginx, or rate-limit throws `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`. |
| `SMTP_*` | real SMTP, or OTP emails won't send (codes appear in `pm2 logs`). |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | first HR admin account. |

## 5. Install, migrate, seed, run

> `sequelize-cli` is a devDependency, so use a full `npm install` (NOT `npm ci --omit=dev`)
> on the box that runs migrations — otherwise `sequelize-cli: not found`.

```bash
npm install
npm run db:migrate
npm run db:seed
pm2 start src/server.js --name hrms-api
pm2 save
pm2 startup        # run the command it prints
curl http://127.0.0.1:4000/api/v1/health   # → {"status":"up"}
```

## 6. nginx reverse proxy

```bash
sudo tee /etc/nginx/sites-available/hrms >/dev/null <<'NGINX'
server {
    server_name truehr.co.in;
    client_max_body_size 10M;          # allow selfie/document uploads
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 7. DNS + HTTPS

1. Point an **A record** `truehr.co.in → <VPS_IP>` in DNS. Verify:
   ```bash
   dig +short truehr.co.in @8.8.8.8        # must show the VPS IP
   ```
   (If an old parking record like `127.0.0.1` is cached, wait for its TTL.)
2. Issue the cert:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d truehr.co.in --agree-tos -m you@example.com --no-eff-email
   curl https://truehr.co.in/api/v1/health
   ```

## 8. Smoke test

```bash
./scripts/smoke-test.sh https://truehr.co.in/api/v1
```

## Updating after a code change

```bash
cd /var/www/hrms-backend
git pull
npm install                 # if deps changed
npm run db:migrate          # if new migrations
pm2 restart hrms-api --update-env   # --update-env reloads .env changes
```

## Troubleshooting

- **`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`** → set `TRUST_PROXY=true` in `.env`, then `pm2 restart hrms-api --update-env`.
- **`Too many connections`** → lower `DB_POOL_MAX` (e.g. `3`); wait ~1 min for stale connections to drop; `pm2 restart hrms-api`.
- **`sequelize-cli: not found`** → run `npm install` (dev deps), not `npm ci --omit=dev`.
- **`Access denied for user`** → wrong DB creds, or VPS IP not whitelisted in cPanel Remote MySQL.
- **502 Bad Gateway right after restart** → app still connecting to the remote DB; wait a few seconds.
- **Phone can't reach domain (resolves 127.0.0.1)** → local ISP DNS cache of the old record; set device Private DNS to `dns.google` or use mobile data until the TTL expires.

## Android app

Point the app at the API and build:
```bash
cd android
./gradlew assembleRelease -PBASE_URL=https://truehr.co.in/api/v1/
```
(Default `BASE_URL` is already `https://truehr.co.in/api/v1/` in `app/build.gradle.kts`.)
