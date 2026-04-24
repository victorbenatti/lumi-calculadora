import { Routes, Route, Navigate } from 'react-router-dom';
import Admin from './pages/Admin';
import Catalogo from './pages/Catalogo';
import Login from './pages/Login';
import ProdutoDetalhe from './pages/ProdutoDetalhe';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
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
  );
}

export default App;
