import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Analytics } from './components/Analytics';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { CartProvider } from './contexts/CartContext';

// Code Splitting - Carregamento preguiçoso das páginas
const Admin = lazy(() => import('./pages/Admin'));
const Catalogo = lazy(() => import('./pages/Catalogo'));
const DiaDasMaes = lazy(() => import('./pages/DiaDasMaes'));
const Login = lazy(() => import('./pages/Login'));
const ProdutoDetalhe = lazy(() => import('./pages/ProdutoDetalhe'));

// Componente de fallback para carregamento
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg space-y-4">
    <div className="w-12 h-12 border-4 border-brand-brown/10 border-t-brand-brown rounded-full animate-spin"></div>
    <p className="text-brand-brown/40 text-sm font-light tracking-widest uppercase animate-pulse">Lumi Imports</p>
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function App() {
  const location = useLocation();
  const showFooter = !location.pathname.startsWith('/admin') && location.pathname !== '/login';

  return (
    <CartProvider>
      <ScrollToTop />
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
          <Route path="/dia-das-maes" element={<DiaDasMaes />} />
          <Route path="/produto/:id" element={<ProdutoDetalhe />} />
        </Routes>
      </Suspense>
      {showFooter && <Footer />}
      <CartDrawer />
    </CartProvider>
  );
}

export default App;
