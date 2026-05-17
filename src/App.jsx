import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import ProductDetail from './pages/ProductDetail';
import Dashboard from './pages/Dashboard';
import Compare from './pages/Compare';
import Sellers from './pages/Sellers';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-cream">
        <Navbar />
        <main className="flex-1 pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/sellers" element={<Sellers />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <Footer />
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
