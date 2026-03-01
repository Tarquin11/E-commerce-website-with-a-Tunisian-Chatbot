# GoatShop E-commerce

I Created an ecommerce website that sells football jerseys , with a chatbot that understands 4 languages (Tunisian Arabic, french, english and swedish ), he assists the user/client in guiding him through the and provide him with the best jersey recommendation based on his BMI , with personalization (your name and desired number) 
available

## Stack

- React 19, React Router, Axios
- Flask, SQLAlchemy, Flask-Migrate, JWT
- Flask-Mail (order confirmation), deep-translator (locales/translation)

## Project Structure

```text
.
|-- app/                # Flask app (auth, products, cart, orders, chat)
|-- frontend/           # React app
|-- migrations/         # Database migrations
|-- run.py              # Backend entrypoint
|-- requirements.txt    # Python dependencies
`-- ecommerce.db        # Local SQLite DB (fallback when DATABASE_URL is not set)
```

## Quick Start

### 1. Backend (Flask)

From project root:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

Backend runs on `http://127.0.0.1:5000`.

### 2. Frontend (Vite)

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api/*` to `http://127.0.0.1:5000`.

## Environment Variables

Create a `.env` at project root (backend):

```env
SECRET_KEY=change-me
JWT_SECRET_KEY=change-me
DATABASE_URL=

MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@example.com
```

Frontend can use `frontend/.env` for client-side keys (for example chatbot integrations).

## Main API Routes

All backend routes are under `/api`.

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/profile`
- Products: `/api/products`, `/api/products/:id`, `/api/products/search`
- Clubs: `/api/clubs`, `/api/clubs/:clubId/products`
- Cart: `/api/cart`, `/api/cart/add`, `/api/cart/update/:productId`, `/api/cart/remove/:productId`
- Orders: `/api/orders`
- Chat: `/api/chat/search_jersey`, `/api/chat/local_reco`
- Translation: `/api/translate`, `/api/translate/batch`

## Database Notes

- If `DATABASE_URL` is not set, the app uses local SQLite (`ecommerce.db`).
- Tables are created on startup.
- Migrations folder is available if you want managed schema changes.

## Common Commands

```powershell
# Backend
python run.py

# Frontend
cd frontend
npm run dev

# Build frontend
npm run build
```

## Troubleshooting

- `401 Unauthorized` on cart/profile: login again and make sure JWT token is stored in localStorage.
- Frontend cannot reach API: confirm backend is running on port `5000`.
- Mail errors: check SMTP app password and `.env` values.

love u <3
