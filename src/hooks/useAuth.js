import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Cria o nosso hook personalizado
export const useAuth = () => {
  // O useContext vai "buscar" os dados compartilhados pelo AuthContext
  const context = useContext(AuthContext);

  // Se o hook for usado fora do Provedor, lançamos um erro para nos avisar
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  // Retorna os dados do contexto (user, isLoading, signInWithGoogle, etc.)
  return context;
};

