import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router } from 'react-router-dom';
import customTheme from './theme/theme';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <ChakraProvider theme={customTheme}>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main style={{ flex: 1 }}>
            <AppRoutes />
          </main>
          <Footer />
        </div>
      </Router>
    </ChakraProvider>
  );
}

export default App;