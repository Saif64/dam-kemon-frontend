import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import CompareBar from './components/CompareBar';
import { AuthProvider } from './auth/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

// Eager: the landing page + search are the hot path.
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';

// Lazy-load everything else so the initial bundle stays slim.
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Browse = lazy(() => import('./pages/Browse'));
const Compare = lazy(() => import('./pages/Compare'));
const Sellers = lazy(() => import('./pages/Sellers'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SubmitShop = lazy(() => import('./pages/SubmitShop'));
const SignIn = lazy(() => import('./pages/SignIn'));
const Account = lazy(() => import('./pages/Account'));
const FcommerceSignup = lazy(() => import('./pages/FcommerceSignup'));
const Saathi = lazy(() => import('./pages/Saathi'));
const SaathiSignup = lazy(() => import('./pages/SaathiSignup'));
const SaathiDashboard = lazy(() => import('./pages/SaathiDashboard'));
const SaathiProfile = lazy(() => import('./pages/SaathiProfile'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminIndexer = lazy(() => import('./pages/admin/AdminIndexer'));
const AdminShops = lazy(() => import('./pages/admin/AdminShops'));
const AdminPendingShops = lazy(() => import('./pages/admin/AdminPendingShops'));
const AdminAuditLog = lazy(() => import('./pages/admin/AdminAuditLog'));
const AdminStats = lazy(() => import('./pages/admin/AdminStats'));
const AdminCatalog = lazy(() => import('./pages/admin/AdminCatalog'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminSearchLog = lazy(() => import('./pages/admin/AdminSearchLog'));
const AdminCache = lazy(() => import('./pages/admin/AdminCache'));
const AdminJobs = lazy(() => import('./pages/admin/AdminJobs'));

function PageFallback() {
  return (
    <div className="container-tight py-16">
      <LoadingSpinner text="Loading…" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-cream">
          <Navbar />
          <main className="flex-1 pb-20 md:pb-0">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/sellers" element={<Sellers />} />
                <Route path="/submit-shop" element={<SubmitShop />} />
                <Route path="/fcommerce/signup" element={<FcommerceSignup />} />
                <Route path="/saathi" element={<Saathi />} />
                <Route path="/saathi/signup" element={<SaathiSignup />} />
                <Route path="/saathi/dashboard" element={<SaathiDashboard />} />
                <Route path="/p/:slug" element={<SaathiProfile />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/account" element={<Account />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminIndexer />} />
                  <Route path="indexer" element={<AdminIndexer />} />
                  <Route path="shops" element={<AdminShops />} />
                  <Route path="pending-shops" element={<AdminPendingShops />} />
                  <Route path="catalog" element={<AdminCatalog />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="search-log" element={<AdminSearchLog />} />
                  <Route path="stats" element={<AdminStats />} />
                  <Route path="cache" element={<AdminCache />} />
                  <Route path="jobs" element={<AdminJobs />} />
                  <Route path="audit" element={<AdminAuditLog />} />
                </Route>
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <BottomNav />
          <CompareBar />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
