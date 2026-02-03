"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import { Search, Users, Package, Star, Mail, Phone, ShieldCheck } from 'lucide-react';
import Image from "next/image";
import axios from "axios";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://admin.lmx.ba';

/* =====================
  Animacije (isto kao SellerSettings)
===================== */
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

/* =====================
  UI Komponente (stil iz SellerSettings)
===================== */
const GlassCard = ({ children, className, ...props }) => (
  <motion.div
    variants={fadeInUp}
    className={cn(
      "relative overflow-hidden rounded-3xl",
      "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
      "border border-slate-200/60 dark:border-slate-700/60",
      "shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40",
      className
    )}
    {...props}
  >
    <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-blue-400/10 via-purple-400/5 to-transparent blur-2xl" />
    {children}
  </motion.div>
);

const CardHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="px-5 sm:px-6 pt-5 sm:pt-6 flex items-start gap-3">
    {Icon && (
      <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
    )}
    <div>
      <div className="text-base font-bold text-slate-900 dark:text-white">{title}</div>
      {subtitle && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>}
    </div>
  </div>
);

const CardBody = ({ children }) => <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4">{children}</div>;

const Spinner = ({ className }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className={cn("h-5 w-5 border-2 border-current border-t-transparent rounded-full", className)}
  />
);

const PrimaryButton = ({ children, className, isLoading, disabled, ...props }) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    disabled={disabled || isLoading}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3",
      "bg-gradient-to-r from-slate-900 to-slate-800 text-white",
      "dark:from-white dark:to-slate-100 dark:text-slate-900",
      "text-sm font-semibold shadow-lg shadow-slate-900/20 dark:shadow-white/10",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "transition-all duration-200",
      className
    )}
    {...props}
  >
    {isLoading ? <Spinner /> : children}
  </motion.button>
);

/* =====================
  Glavni Page Component
===================== */
const SviKorisniciPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/users`, {
        params: {
          page,
          per_page: 12,
          search: searchTerm || '',
          role: filterRole !== 'all' ? filterRole : '',
        },
      });

      if (response.data.success) {
        setUsers(response.data.data);
        setTotalPages(response.data.last_page);
        setCurrentPage(response.data.current_page);
        setTotalUsers(response.data.total);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Greška pri učitavanju korisnika');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, searchTerm, filterRole]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const goToUserProfile = (userId) => {
    router.push(`/seller/${userId}`);
  };

  // Loading
  if (loading && users.length === 0) {
    return (
      <Layout>
        <BreadCrumb title2="Svi korisnici" />
        <div className="container mx-auto mt-6 mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Error
  if (error && users.length === 0) {
    return (
      <Layout>
        <BreadCrumb title2="Svi korisnici" />
        <div className="container mx-auto mt-6 mb-10">
          <GlassCard className="max-w-md mx-auto text-center">
            <div className="p-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Greška</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
              <PrimaryButton onClick={() => fetchUsers(currentPage)}>
                Pokušaj ponovo
              </PrimaryButton>
            </div>
          </GlassCard>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BreadCrumb title2="Svi korisnici" />
      
      <div className="container mx-auto mt-6 mb-10 space-y-6">
        {/* Search Card */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          <GlassCard>
            <CardHeader 
              icon={Users} 
              title="Pronađi korisnike" 
              subtitle="Pretraži i povežite se sa drugim korisnicima na LMX platformi" 
            />
            <CardBody>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Pretraži po imenu ili emailu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={cn(
                        "w-full pl-12 pr-4 py-3 rounded-2xl",
                        "bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm",
                        "border border-slate-200/70 dark:border-slate-700/60",
                        "text-slate-900 dark:text-white placeholder:text-slate-400",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
                        "transition-all duration-200"
                      )}
                    />
                  </div>

                  <select
                    value={filterRole}
                    onChange={(e) => {
                      setFilterRole(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-4 py-3 rounded-2xl min-w-[160px]",
                      "bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm",
                      "border border-slate-200/70 dark:border-slate-700/60",
                      "text-slate-900 dark:text-white text-sm font-medium",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
                      "transition-all duration-200"
                    )}
                  >
                    <option value="all">Svi korisnici</option>
                    <option value="user">Obični korisnici</option>
                    <option value="admin">Administratori</option>
                  </select>

                  <PrimaryButton type="submit" isLoading={loading}>
                    Pretraži
                  </PrimaryButton>
                </div>
              </form>

              {totalUsers > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/70 dark:border-slate-700/60">
                  <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{totalUsers}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">korisnika</span>
                </div>
              )}
            </CardBody>
          </GlassCard>
        </motion.div>

        {/* Users Grid */}
        {users.length === 0 ? (
          <GlassCard className="text-center">
            <div className="p-12">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Nema rezultata</h3>
              <p className="text-slate-600 dark:text-slate-400">Pokušajte sa drugačijim parametrima pretrage</p>
            </div>
          </GlassCard>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {users.map((user) => (
              <motion.div
                key={user.id}
                variants={fadeInUp}
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => goToUserProfile(user.id)}
                className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 cursor-pointer group"
              >
                {/* Decorative gradient */}
                <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/10 via-purple-400/5 to-transparent blur-2xl" />
                
                <div className="p-6">
                  {/* User Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Avatar */}
                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-2xl border-2 border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
                        {user.avatar || user.svg_avatar ? (
                          user.svg_avatar ? (
                            <div dangerouslySetInnerHTML={{ __html: user.svg_avatar }} className="w-full h-full" />
                          ) : (
                            <Image 
                              src={user.avatar} 
                              alt={user.name} 
                              width={64}
                              height={64}
                              className="w-full h-full object-cover" 
                            />
                          )
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                            <span className="text-slate-700 dark:text-slate-200 text-xl font-bold">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name & Status */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {user.name}
                        </h3>
                        {user.is_verified && (
                          <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                        )}
                      </div>
                      
                      {user.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 mt-1">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/70 dark:border-slate-700/60 text-center">
                      <Package className="w-4 h-4 text-slate-600 dark:text-slate-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{user.total_ads || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ukupno</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-100/80 dark:bg-emerald-900/30 backdrop-blur-sm border border-emerald-200/70 dark:border-emerald-800/40 text-center">
                      <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{user.active_ads || 0}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Aktivnih</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                    user.status === 'active' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    user.status === 'suspended' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    user.status !== 'active' && user.status !== 'suspended' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    <span className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full",
                      user.status === 'active' && "bg-emerald-500",
                      user.status === 'suspended' && "bg-amber-500",
                      user.status !== 'active' && user.status !== 'suspended' && "bg-red-500"
                    )} />
                    {user.status === 'active' ? 'Aktivan' : user.status === 'suspended' ? 'Suspendovan' : 'Neaktivan'}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <GlassCard>
            <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Stranica <span className="font-semibold text-slate-900 dark:text-white">{currentPage}</span> od{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/70 dark:border-slate-700/60 text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Prethodna
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/70 dark:border-slate-700/60 text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Sljedeća
                </motion.button>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </Layout>
  );
};

export default SviKorisniciPage;