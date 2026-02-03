'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Package, Star, Mail, Phone } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://admin.lmx.ba';

export default function SviKorisniciPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
    fetchUsers(1);
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Učitavanje korisnika...</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ups!</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => fetchUsers(currentPage)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Pokušaj ponovo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Pronađi korisnike</h1>
          <p className="text-gray-600">Pretraži i povežite se sa drugim korisnicima na LMX platformi</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* SEARCH BAR */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Pretraži po imenu ili emailu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Filter */}
              <div className="flex gap-3">
                <select
                  value={filterRole}
                  onChange={(e) => {
                    setFilterRole(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white min-w-[140px]"
                >
                  <option value="all">Svi korisnici</option>
                  <option value="user">Obični korisnici</option>
                  <option value="admin">Administratori</option>
                </select>

                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  Pretraži
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* REZULTATI */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Pronađeno <span className="font-semibold text-gray-900">{users.length}</span> korisnika
          </p>
          {totalPages > 1 && (
            <p className="text-sm text-gray-500">
              Stranica {currentPage} od {totalPages}
            </p>
          )}
        </div>

        {/* USER CARDS GRID */}
        {users.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nema rezultata</h3>
            <p className="text-gray-600">Pokušajte sa drugačijim parametrima pretrage</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100 hover:border-blue-200"
              >
                {/* Card Header */}
                <div className="h-24 bg-gradient-to-br from-blue-500 to-blue-600 relative">
                  {user.role === 'admin' && (
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full shadow-sm">
                        Admin
                      </span>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative px-6 -mt-12">
                  <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                    {user.avatar || user.svg_avatar ? (
                      user.svg_avatar ? (
                        <div dangerouslySetInnerHTML={{ __html: user.svg_avatar }} className="w-full h-full" />
                      ) : (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-6 pt-4 pb-6">
                  {/* Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                    {user.name}
                  </h3>

                  {/* Email */}
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {/* Phone (if exists) */}
                  {user.phone && (
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Package className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{user.total_ads || 0}</p>
                      <p className="text-xs text-gray-500">Ukupno</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Star className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-700">{user.active_ads || 0}</p>
                      <p className="text-xs text-green-600">Aktivnih</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' :
                      user.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'active' ? '● Aktivan' :
                       user.status === 'suspended' ? '● Suspendovan' :
                       '● Neaktivan'}
                    </span>

                    {user.is_verified && (
                      <div className="flex items-center text-blue-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* View Profile Button */}
                  <button className="w-full mt-4 py-2.5 bg-gray-50 group-hover:bg-blue-600 text-gray-700 group-hover:text-white rounded-xl font-medium transition-all duration-300">
                    Pogledaj profil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl shadow-sm p-6">
            <div className="text-sm text-gray-600">
              Stranica <span className="font-semibold text-gray-900">{currentPage}</span> od{' '}
              <span className="font-semibold text-gray-900">{totalPages}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Prethodna
              </button>
              
              {/* Page Numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sljedeća →
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && users.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600">Učitavanje...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}