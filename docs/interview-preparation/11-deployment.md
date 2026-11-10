# 11. Deployment & Cloud Infrastructure — Engaze

## Global Deployment Topology

Engaze utilizes a hybrid cloud architecture designed for high availability, minimal operational overhead, and low latency:
* **Frontend:** Hosted on **Vercel's Global Edge Network** (`https://www.engaze.date/`).
* **Backend:** Hosted on **Render Web Services** (`https://enagaze-com-backend.onrender.com/`).
* **Database:** Hosted on **MongoDB Atlas** (Managed M0/Dedicated Replica Set).
* **Object Storage:** Hosted on **Amazon Web Services (AWS S3)**.
* **Push Notifications:** Managed via **Google Firebase Cloud Messaging (FCM)**.

---

## 1. Frontend Deployment on Vercel

### Edge CDN & Routing Configuration (`vercel.json`)
Because Engaze is a client-side Single-Page Application (SPA) driven by React Router v6, direct URL navigation (e.g. visiting `https://www.engaze.date/chat/123` directly) must route to `index.html` rather than returning a 404 from the web server:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Build Workflow:
* **Build Command:** `npm run build`
* **Output Directory:** `build`
* **Environment Variables:**
  * `REACT_APP_API_URL`: Production backend URL (`https://enagaze-com-backend.onrender.com`).
  * `REACT_APP_GOOGLE_CLIENT_ID`: Google OAuth 2.0 Web Client ID.

---

## 2. Backend Deployment on Render

### Topology & Reverse Proxy Configuration
Render operates containerized Node.js services behind an automated Nginx/Envoy load-balancing layer that terminates TLS/SSL and maps external traffic to the internal container port.

1. **Port Binding:**
   ```javascript
   const PORT = process.env.PORT || 8000;
   server.listen(PORT, "0.0.0.0", () => { ... });
   ```
2. **Reverse Proxy Trust:**
   ```javascript
   app.set("trust proxy", 1);
   ```
   Ensures `req.ip` is extracted accurately from the first `X-Forwarded-For` header hop for rate limiting.
3. **Health & Readiness Monitoring:**
   * **Liveness Probe (`/livez`):** Returns HTTP 200 immediately to verify process responsiveness.
   * **Readiness Probe (`/api/v1/health/ready`):** Validates that MongoDB Atlas and Redis connections are active before Render routes customer traffic to the container.

---

## 3. Database Connection Pooling (`src/config/database.js`)

Engaze configures Mongoose with resilient connection pooling tuned for serverless and containerized cloud environments:

```javascript
export const getMongoConnectionOptions = () => ({
    autoIndex: process.env.NODE_ENV !== "production", // Disables index auto-creation in production
    maxPoolSize: 20,                                  // Maintains up to 20 concurrent database sockets
    minPoolSize: 5,                                   // Keeps 5 warmed connections ready
    serverSelectionTimeoutMS: 5000,                   // Fails fast (5s) if cluster unreachable
    socketTimeoutMS: 45000,                           // Closes idle sockets after 45s
    heartbeatFrequencyMS: 10000,                      // Pings MongoDB replica set every 10s
});
```

---

## 4. Environment Variables Checklist

### Backend (`backend/.env`)
| Variable Name | Required in Prod | Purpose / Example Value |
| :--- | :---: | :--- |
| `NODE_ENV` | Yes | `production` |
| `PORT` | Auto (Render) | `8000` |
| `MONGO_URI` | Yes | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/engaze?retryWrites=true&w=majority` |
| `JWT_SECRET` | Yes | Cryptographically strong string $\ge 32$ chars |
| `JWT_EXPIRES_IN` | Optional | `7d` |
| `STORAGE_PROVIDER` | Yes | `s3` |
| `STORAGE_BUCKET` | Yes | `engaze-media-production` |
| `STORAGE_REGION` | Yes | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | Yes | IAM User Access Key |
| `AWS_SECRET_ACCESS_KEY`| Yes | IAM User Secret Key |
| `STORAGE_PUBLIC_BASE_URL`| Yes | `https://engaze-media-production.s3.ap-south-1.amazonaws.com` |
| `REDIS_URL` | Optional | `redis://default:<pwd>@redis-host:6379` (Falls back to in-memory if omitted) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth Web Client ID |
| `FIREBASE_SERVICE_ACCOUNT`| Optional | Base64-encoded Firebase Admin SDK service account JSON |

### Frontend (`frontend/.env`)
| Variable Name | Purpose / Example Value |
| :--- | :--- |
| `REACT_APP_API_URL` | `https://enagaze-com-backend.onrender.com` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

---

## 5. Production Cold-Start Mitigation & Reliability

### The Render Free-Tier Sleeping Instance Problem
* **Symptom:** On Render free instances, the service spins down after 15 minutes of inactivity. When a user first opens Engaze, the cold start requires 30–50 seconds to boot the container. Standard Axios requests (which default to 5–10 seconds) fail with network timeout errors.
* **Engineering Solution:**
  1. Configured the base Axios client in `AuthContext.jsx` with an extended timeout:
     ```javascript
     const api = axios.create({
         baseURL: `${server}/api/v1`,
         timeout: 60000, // 60-second window accommodates cloud cold starts
     });
     ```
  2. The liveness endpoint `GET /` is lightweight, allowing warming pings without loading database models.
