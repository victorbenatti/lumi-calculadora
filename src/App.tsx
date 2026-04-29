import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Analytics } from './components/Analytics';
import { CartDrawer } from './components/CartDrawer';
import { CartProvider } from './contexts/CartContext';

// Code Splitting - Carregamento preguiçoso das páginas
const Admin = lazy(() => import('./pages/Admin'));
const Catalogo = lazy(() => import('./pages/Catalogo'));
const Login = lazy(() => import('./pages/Login'));
const ProdutoDetalhe = lazy(() => import('./pages/ProdutoDetalhe'));

// Componente de fallback para carregamento
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg space-y-4">
    <div className="w-12 h-12 border-4 border-brand-brown/10 border-t-brand-brown rounded-full animate-spin"></div>
    <p className="text-brand-brown/40 text-sm font-light tracking-widest uppercase animate-pulse">Lumi Imports</p>
  </div>
);

function App() {
  return (
    <CartProvider>
      <Analytics />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/catalogo" replace />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/produto/:id" element={<ProdutoDetalhe />} />
        </Routes>
      </Suspense>
      <CartDrawer />
    </CartProvider>
  );
}

export default App;
