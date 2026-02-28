# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Running the project (frontend + backend)

This repository contains two parts:

- Frontend: a React app in `frontend/` (Vite).
- Backend: a Flask API in `backend.py` (Python).

Recommended workflow during development:

1) Run the React frontend (dev server):

```powershell
cd frontend
npm install
npm run dev
```

By default Vite serves the React app on http://localhost:5173 (or another free port). The React app can be configured to call the backend API endpoints.

2) Run the Flask backend API:

```powershell
# from the project root
python -m pip install -r requirements.txt  # if you don't have dependencies installed
python backend.py
```

The backend exposes API endpoints under the `/api/` prefix, for example `GET /api/products` and `POST /api/login`.

Notes:
- CORS is already enabled in `backend.py`, so the React dev server can call the API.
- The previous FastAPI implementation was archived to `archive/fastapi_main.py` in case you want to recover or port parts of it.

If you want, I can:

- Move the root HTML files into an `archive/static_site/` directory so they don't clutter the project root.
- Add a small `requirements.txt` with the Python dependencies (Flask, Flask-CORS, etc.) and optionally a small `Procfile` or `run.py` to standardize starting the server.
