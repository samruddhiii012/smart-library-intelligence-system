import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BookOpen, Search, Clock, BookMarked, Layers, 
  CheckCircle2, AlertCircle, RotateCcw, Sparkles, X,
  User, LogOut, KeyRound, Mail, UserPlus, LogIn, ShieldCheck
} from 'lucide-react';

function App() {
  const [books, setBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semanticSearching, setSemanticSearching] = useState(false);
  const [activeActionId, setActiveActionId] = useState(null);
  const [message, setMessage] = useState(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('library_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // AI Modal States
  const [selectedBookForAI, setSelectedBookForAI] = useState(null);
  const [aiSummary, setAiSummary] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchUserBorrows(currentUser.id);
    } else {
      setBorrowedBooks([]);
    }
  }, [currentUser]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/books');
      if (res.data.success) {
        setBooks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBorrows = async (uid) => {
    try {
      const res = await axios.get(`/api/borrow/user/${uid}`);
      if (res.data.success) {
        setBorrowedBooks(res.data.data || []);
      }
    } catch (err) {
      console.log('No active borrows found:', err);
    }
  };

  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthSubmitting(true);
    const endpoint = authMode === 'login' ? 'login' : 'register';
    try {
      const res = await axios.post(`/api/auth/${endpoint}`, authForm);
      if (res.data.success) {
        localStorage.setItem('library_token', res.data.token);
        localStorage.setItem('library_user', JSON.stringify(res.data.user));
        setCurrentUser(res.data.user);
        setShowAuthModal(false);
        setAuthForm({ name: '', email: '', password: '', role: 'STUDENT' });
        setMessage({ type: 'success', text: `Welcome, ${res.data.user.name}!` });
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Authentication failed.' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Authentication error. Please verify input.'
      });
    } finally {
      setAuthSubmitting(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
    setCurrentUser(null);
    setBorrowedBooks([]);
    setShowProfileDropdown(false);
    setMessage({ type: 'success', text: 'Logged out successfully.' });
    setTimeout(() => setMessage(null), 3000);
  };

  // Semantic AI Search Handler
  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) {
      fetchBooks();
      return;
    }
    try {
      setSemanticSearching(true);
      const res = await axios.post('/api/ai/semantic-search', {
        query: search
      });
      if (res.data.success) {
        setBooks(res.data.books);
      }
    } catch (err) {
      console.error('Semantic search error:', err);
    } finally {
      setSemanticSearching(false);
    }
  };

  // AI 3-Bullet Summary Fetcher
  const handleOpenAISummary = async (book) => {
    setSelectedBookForAI(book);
    setAiLoading(true);
    setAiSummary([]);
    try {
      const res = await axios.post('/api/ai/summary', {
        title: book.title,
        author: book.author,
        category: book.category
      });
      if (res.data.success) {
        setAiSummary(res.data.summary);
      }
    } catch (err) {
      setAiSummary([
        'Error retrieving AI summary.',
        'Please verify connection with library intelligence layer.'
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleBorrow = async (bookId) => {
    if (!currentUser) {
      setMessage({ type: 'error', text: 'Please sign in or register to borrow books!' });
      setShowAuthModal(true);
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    try {
      setActiveActionId(bookId);
      setMessage(null);
      const res = await axios.post('/api/borrow', {
        userId: currentUser.id,
        bookId
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Book borrowed successfully!' });
        fetchBooks();
        fetchUserBorrows(currentUser.id);
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Unable to borrow book.' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Server error while borrowing.'
      });
    } finally {
      setActiveActionId(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleReturn = async (borrowRecordId) => {
    try {
      setActiveActionId(borrowRecordId);
      setMessage(null);
      const res = await axios.post('/api/borrow/return', {
        borrowRecord: borrowRecordId
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Book returned successfully!' });
        fetchBooks();
        if (currentUser?.id) fetchUserBorrows(currentUser.id);
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Unable to return book.' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Server error while returning.'
      });
    } finally {
      setActiveActionId(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Smart Library Intelligence
              <span className="text-xs bg-indigo-950 border border-indigo-700/60 text-indigo-300 px-2 py-0.5 rounded-full font-mono font-normal">
                AI Enabled
              </span>
            </h1>
            <p className="text-sm text-slate-400">Autonomous Inventory & Semantic Retrieval System</p>
          </div>
        </div>

        {/* Right Section: Search & Auth Profile */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Search Bar */}
          <form onSubmit={handleSemanticSearch} className="flex items-center gap-2 w-full md:w-80">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search topic or book..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={semanticSearching}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow"
              title="Semantic AI Search"
            >
              {semanticSearching ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>AI Search</span>
            </button>
          </form>

          {/* User Profile / Auth Button */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-white leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-indigo-400 leading-tight">{currentUser.role}</p>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-base text-white">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">{currentUser.name}</h4>
                      <p className="text-xs text-slate-400 break-all">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  <div className="py-3 text-xs text-slate-400 space-y-1">
                    <p>Active Borrows: <span className="font-semibold text-white">{borrowedBooks.length}</span></p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full mt-2 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-2 transition"
            >
              <LogIn className="w-4 h-4 text-indigo-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Notifications */}
      {message && (
        <div className="max-w-6xl mx-auto mt-4">
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' 
              : 'bg-rose-950/80 border border-rose-800 text-rose-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto mt-8 space-y-12">
        {/* Active Borrows */}
        {borrowedBooks.length > 0 && (
          <section className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-base font-semibold text-indigo-300 flex items-center gap-2 mb-4">
              <RotateCcw className="w-4 h-4" />
              Your Active Borrowed Books ({borrowedBooks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {borrowedBooks.map((item) => (
                <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm text-white">{item.book?.title}</h4>
                    <p className="text-xs text-slate-400">Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'In 14 days'}</p>
                  </div>
                  <button
                    onClick={() => handleReturn(item.id)}
                    disabled={activeActionId === item.id}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg transition"
                  >
                    {activeActionId === item.id ? 'Returning...' : 'Return'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Catalog */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
              <BookMarked className="w-5 h-5 text-indigo-400" />
              Catalog Overview ({books.length})
            </h2>
            <button 
              onClick={() => { setSearch(''); fetchBooks(); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
            >
              Reset / Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
              <Clock className="w-7 h-7 animate-spin text-indigo-500" />
              <p className="text-sm">Connecting with database...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium">No books matched your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div 
                  key={book.id} 
                  className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col justify-between shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium mb-3">
                      <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/40 px-2.5 py-1 rounded-md">
                        {book.category}
                      </span>
                      <button
                        onClick={() => handleOpenAISummary(book)}
                        className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded-full transition"
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Summary
                      </button>
                    </div>

                    <h3 className="font-semibold text-lg text-white line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">By {book.author}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-slate-400">Available: </span>
                      <span className={`font-semibold ${book.availableCopies > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {book.availableCopies} / {book.totalCopies}
                      </span>
                    </div>

                    <button 
                      onClick={() => handleBorrow(book.id)}
                      disabled={book.availableCopies <= 0 || activeActionId === book.id}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition shadow flex items-center gap-1.5"
                    >
                      {activeActionId === book.id ? (
                        <>
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Borrowing...</span>
                        </>
                      ) : book.availableCopies > 0 ? (
                        'Borrow Book'
                      ) : (
                        'Out of Stock'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* AI Summary Modal */}
      {selectedBookForAI && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedBookForAI(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Gemini AI Technical Insights
            </div>
            <h3 className="text-lg font-bold text-white">{selectedBookForAI.title}</h3>
            <p className="text-xs text-slate-400 mb-5">By {selectedBookForAI.author}</p>

            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                <Clock className="w-6 h-6 animate-spin text-amber-400" />
                <p className="text-xs">Synthesizing key technical takeaways...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiSummary.map((point, index) => (
                  <div key={index} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="w-5 h-5 bg-indigo-950 text-indigo-300 font-bold rounded-full flex items-center justify-center flex-shrink-0 text-[10px]">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authentication Modal (Sign In / Register) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-2">
              <ShieldCheck className="w-5 h-5" />
              {authMode === 'login' ? 'Account Login' : 'Student Registration'}
            </div>
            <p className="text-xs text-slate-400 mb-6">
              {authMode === 'login' 
                ? 'Sign in to access your personal borrowed shelf.' 
                : 'Create an account to borrow books and manage returns.'}
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Samruddhi"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs transition shadow flex items-center justify-center gap-2"
              >
                {authSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : null}
                <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              {authMode === 'login' ? (
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthMode('register')}
                    className="text-indigo-400 hover:underline font-semibold"
                  >
                    Register here
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Already registered?{' '}
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-indigo-400 hover:underline font-semibold"
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;