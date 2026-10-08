# Deploy Secure Vote Chain (Vercel + Render)

Frontend → **Vercel** · Backend (Node + DeepFace/Python) → **Render (Docker)** · Database → **MongoDB Atlas**

```
Browser → Vercel (Vite SPA)
       → Render API (Express + Python DeepFace)
                     → MongoDB Atlas
```

## Prerequisites

- GitHub repo with this project pushed
- Accounts: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), [Render](https://render.com), [Vercel](https://vercel.com)

---

## 1. MongoDB Atlas

1. Create a free **M0** cluster.
2. Database Access → create a user (save username/password).
3. Network Access → **Allow Access from Anywhere** (`0.0.0.0/0`) so Render can connect.
4. Database → Connect → Drivers → copy the URI, e.g.:

   ```
   mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/securevotechain?retryWrites=true&w=majority
   ```

---

## 2. Render (backend)

1. **New → Web Service** → connect the GitHub repo.
2. Settings:
   - **Root Directory:** `server`
   - **Runtime:** Docker
   - **Dockerfile Path:** `./Dockerfile` (relative to `server/`)
3. Environment variables:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | Atlas URI from step 1 |
   | `JWT_SECRET` | long random string |
   | `FRONTEND_ORIGIN` | `https://YOUR_APP.vercel.app` (update after Vercel deploy; include preview origins comma-separated if needed) |
   | `WEBAUTHN_RP_ID` | `YOUR_APP.vercel.app` (no `https://`) |
   | `WEBAUTHN_ORIGIN` | `https://YOUR_APP.vercel.app` |
   | `PYTHON_PATH` | `/usr/bin/python3` |

4. Deploy. First Docker build is **large and slow** (TensorFlow/DeepFace).
5. Note the service URL, e.g. `https://secure-vote-chain-api.onrender.com`.
6. Health check: `GET https://YOUR_RENDER_URL/health` → `{ "ok": true }`.

### Create admin (once)

```bash
curl -X POST https://YOUR_RENDER_URL/api/admin/setup \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"CHANGE_ME\"}"
```

---

## 3. Vercel (frontend)

1. **Add New Project** → import the same GitHub repo.
2. Framework: **Vite** (or leave auto-detect).
3. Build settings (also in `vercel.json`):
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment variable:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://YOUR_RENDER_URL/api` |

5. Deploy. Note the URL, e.g. `https://secure-vote-chain.vercel.app`.
6. Go back to **Render** and set `FRONTEND_ORIGIN`, `WEBAUTHN_RP_ID`, and `WEBAUTHN_ORIGIN` to match the Vercel URL, then **redeploy** the backend.

---

## 4. Smoke test checklist

1. Open the Vercel URL.
2. **Register** a voter (face capture; fingerprint can fail/skip on registration if no sensor).
3. **Authenticate** / login with face.
4. **Vote:** face verify → skip fingerprint if needed → cast vote → see `0x…` hash.
5. **Results** page shows tallies.
6. **Admin** login → add candidate / region.

### Known production quirks

- **Render free tier** sleeps after idle; first request can take 30–60s.
- **First face verify** may download DeepFace models (several minutes once).
- **WebAuthn** only works when `WEBAUTHN_*` matches the real HTTPS Vercel hostname.
- `VITE_API_URL` is baked in at **build** time — change it → redeploy Vercel.

---

## Local development (unchanged)

```bash
# server/.env — see server/.env.example
npm run dev
```

Frontend defaults to `http://localhost:1322/api` when `VITE_API_URL` is unset.
