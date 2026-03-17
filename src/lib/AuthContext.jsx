/**
 * AuthContext simplificado.
 *
 * Base44 ha sido eliminado. La autenticación/autorización debe gestionarse
 * en los flujos de n8n (p. ej., comprobando un token en la cabecera
 * Authorization de cada webhook).
 *
 * Si necesitas proteger rutas en el frontend, implementa aquí tu lógica
 * de login (JWT, sesión con cookie, etc.) y actualiza el contexto.
 */
import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // TODO: Implementa aquí tu lógica de autenticación si necesitas proteger rutas.
  // Opciones habituales con n8n:
  //   1. JWT: guarda el token en localStorage, envíalo en la cabecera
  //      Authorization: Bearer <token> dentro de src/api/base44Client.js.
  //   2. Sesión con cookie: gestiona la cookie desde el workflow de n8n.
  //   3. Sin auth: deja este contexto tal como está (app pública / intranet).
  return (
    <AuthContext.Provider value={{
      user: null,
      isAuthenticated: false,
      isLoadingAuth: false,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      logout: () => {},
      navigateToLogin: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
