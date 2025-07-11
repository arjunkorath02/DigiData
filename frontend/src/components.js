import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// API Service
class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.axios = axios.create({
      baseURL: API_BASE_URL,
    });

    // Add token to requests
    this.axios.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Handle token expiration
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    window.location.reload();
  }

  // Auth methods
  async login(email, password) {
    const response = await this.axios.post('/auth/login', { email, password });
    this.setToken(response.data.access_token);
    return response.data;
  }

  async register(name, email, password) {
    const response = await this.axios.post('/auth/register', { name, email, password });
    this.setToken(response.data.access_token);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.axios.get('/auth/me');
    return response.data;
  }

  // File methods
  async uploadFile(file, parentId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId) {
      formData.append('parent_id', parentId);
    }
    const response = await this.axios.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async createFolder(name, parentId = null) {
    const response = await this.axios.post('/folders', {
      name,
      type: 'folder',
      parent_id: parentId
    });
    return response.data;
  }

  async getFiles(folderId = null) {
    const response = await this.axios.get('/files', {
      params: folderId ? { folder_id: folderId } : {}
    });
    return response.data;
  }

  async searchFiles(query) {
    const response = await this.axios.get('/files/search', { params: { q: query } });
    return response.data;
  }

  async getRecentFiles() {
    const response = await this.axios.get('/files/recent');
    return response.data;
  }

  async getStarredFiles() {
    const response = await this.axios.get('/files/starred');
    return response.data;
  }

  async getSharedFiles() {
    const response = await this.axios.get('/files/shared');
    return response.data;
  }

  async getTrashedFiles() {
    const response = await this.axios.get('/files/trash');
    return response.data;
  }

  async updateFile(fileId, data) {
    const response = await this.axios.put(`/files/${fileId}`, data);
    return response.data;
  }

  async deleteFile(fileId, permanent = false) {
    const response = await this.axios.delete(`/files/${fileId}`, {
      params: { permanent }
    });
    return response.data;
  }

  async downloadFile(fileId) {
    const response = await this.axios.get(`/files/${fileId}/download`, {
      responseType: 'blob'
    });
    return response;
  }

  async shareFile(fileId, userEmail, permission) {
    const response = await this.axios.post(`/files/${fileId}/share`, {
      file_id: fileId,
      user_email: userEmail,
      permission
    });
    return response.data;
  }
}

const apiService = new ApiService();

// Login Page Component
export const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isRegister) {
        result = await apiService.register(name, email, password);
      } else {
        result = await apiService.login(email, password);
      }
      onLogin(result.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
            </div>
            <h1 className="ml-3 text-3xl font-bold text-white">Drive</h1>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {isRegister ? 'Create Account' : 'Sign in'}
          </h2>
          <p className="text-gray-400">to continue to Google Drive</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={isRegister}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email or phone
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-blue-400 hover:text-blue-300"
              >
                {isRegister ? 'Already have an account? Sign in' : 'Create account'}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Loading...' : (isRegister ? 'Create Account' : 'Sign in')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Sidebar Component
export const Sidebar = ({ activeSection, setActiveSection, isCollapsed, setIsCollapsed, user }) => {
  const menuItems = [
    { id: 'my-drive', name: 'My Drive', icon: '🗂️', count: null },
    { id: 'shared', name: 'Shared with me', icon: '👥', count: null },
    { id: 'recent', name: 'Recent', icon: '🕒', count: null },
    { id: 'starred', name: 'Starred', icon: '⭐', count: null },
    { id: 'trash', name: 'Trash', icon: '🗑️', count: null },
  ];

  const storageUsed = user ? Math.round((user.storage_used / user.storage_limit) * 100) : 0;
  const storageUsedGB = user ? (user.storage_used / (1024 * 1024 * 1024)).toFixed(2) : 0;
  const storageLimitGB = user ? (user.storage_limit / (1024 * 1024 * 1024)).toFixed(0) : 15;

  return (
    <div className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
      <div className="p-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-900/50 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.count && (
                      <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {!isCollapsed && user && (
        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Storage</div>
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex-1 bg-gray-800 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(storageUsed, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-400">{storageUsed}%</span>
          </div>
          <div className="text-xs text-gray-400">
            {storageUsedGB} GB of {storageLimitGB} GB used
          </div>
        </div>
      )}
    </div>
  );
};

// Header Component  
export const Header = ({ user, onLogout, viewMode, setViewMode, searchQuery, setSearchQuery, onCreateNew }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white">Drive</h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
              <span>New</span>
            </button>

            {showCreateMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <button
                    onClick={() => {
                      onCreateNew('folder');
                      setShowCreateMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                  >
                    <span>📁</span>
                    <span>New folder</span>
                  </button>
                  <button
                    onClick={() => {
                      onCreateNew('upload');
                      setShowCreateMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                  >
                    <span>📎</span>
                    <span>File upload</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search in Drive"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3v8h8V3H3zm10 0v8h8V3h-8zM3 13v8h8v-8H3zm10 0v8h8v-8h-8z"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg font-medium">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{user?.name || 'User'}</div>
                      <div className="text-gray-400 text-sm">{user?.email || 'user@example.com'}</div>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">
                    Manage your Account
                  </button>
                  <button 
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// File Grid Component
export const FileGrid = ({ files, viewMode, onFileClick, onFileAction }) => {
  const formatSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-gray-900">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-800 text-sm font-medium text-gray-400">
          <div className="col-span-6">Name</div>
          <div className="col-span-2">Last modified</div>
          <div className="col-span-2">File size</div>
          <div className="col-span-2"></div>
        </div>
        <div className="divide-y divide-gray-800">
          {files.map((file) => (
            <div
              key={file.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-800 cursor-pointer transition-colors group"
            >
              <div 
                className="col-span-6 flex items-center space-x-3"
                onClick={() => onFileClick(file)}
              >
                <span className="text-2xl">{file.icon}</span>
                <span className="text-white truncate">{file.name}</span>
                {file.is_starred && <span className="text-yellow-400">⭐</span>}
              </div>
              <div className="col-span-2 text-gray-400 text-sm flex items-center">
                {formatDate(file.modified_at)}
              </div>
              <div className="col-span-2 text-gray-400 text-sm flex items-center">
                {formatSize(file.size)}
              </div>
              <div className="col-span-2 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileAction(file, 'star');
                    }}
                    className="p-2 text-gray-400 hover:text-yellow-400 rounded-lg hover:bg-gray-700"
                    title={file.is_starred ? 'Remove from starred' : 'Add to starred'}
                  >
                    {file.is_starred ? '⭐' : '☆'}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileAction(file, 'download');
                    }}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
                    disabled={file.type === 'folder'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileAction(file, 'delete');
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
      {files.map((file) => (
        <div
          key={file.id}
          className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 cursor-pointer transition-colors group relative"
        >
          <div 
            className="flex flex-col items-center text-center"
            onClick={() => onFileClick(file)}
          >
            <div className="w-16 h-16 mb-3 flex items-center justify-center rounded-lg relative" style={{ backgroundColor: file.color + '20' }}>
              <span className="text-3xl">{file.icon}</span>
              {file.is_starred && (
                <span className="absolute -top-1 -right-1 text-yellow-400 text-sm">⭐</span>
              )}
            </div>
            <h3 className="text-white text-sm font-medium truncate w-full mb-1">
              {file.name}
            </h3>
            <p className="text-gray-400 text-xs">
              {formatDate(file.modified_at)}
            </p>
            {file.size > 0 && (
              <p className="text-gray-400 text-xs">
                {formatSize(file.size)}
              </p>
            )}
          </div>
          
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onFileAction(file, 'star');
                }}
                className="p-1 text-gray-400 hover:text-yellow-400 rounded"
                title={file.is_starred ? 'Remove from starred' : 'Add to starred'}
              >
                {file.is_starred ? '⭐' : '☆'}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onFileAction(file, 'menu');
                }}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Upload Modal Component
export const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.createRef();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i]);
      }
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Upload Files</h2>
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-300 mb-2">Drag and drop files here</p>
          <p className="text-gray-400 text-sm mb-4">or</p>
          <button 
            onClick={onButtonClick}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Select Files'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-300 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Folder Modal Component
export const CreateFolderModal = ({ isOpen, onClose, onCreate }) => {
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setCreating(true);
    try {
      await onCreate(folderName.trim());
      setFolderName('');
      onClose();
    } catch (error) {
      console.error('Folder creation failed:', error);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Create Folder</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-4 py-2 text-gray-300 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !folderName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Breadcrumb Component
export const Breadcrumb = ({ breadcrumbs, onNavigate }) => {
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.id || 'root'}>
          <button
            onClick={() => onNavigate(crumb.id)}
            className={`hover:text-white transition-colors ${
              index === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-gray-400'
            }`}
          >
            {crumb.name}
          </button>
          {index < breadcrumbs.length - 1 && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Main Dashboard Component
export const Dashboard = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('my-drive');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load files based on current section and folder
  const loadFiles = async () => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      
      switch (activeSection) {
        case 'my-drive':
          response = await apiService.getFiles(currentFolder?.id);
          setFiles(response.items || []);
          setBreadcrumbs(response.breadcrumbs || []);
          break;
        case 'recent':
          response = await apiService.getRecentFiles();
          setFiles(Array.isArray(response) ? response : []);
          setBreadcrumbs([{ id: null, name: 'Recent' }]);
          break;
        case 'starred':
          response = await apiService.getStarredFiles();
          setFiles(Array.isArray(response) ? response : []);
          setBreadcrumbs([{ id: null, name: 'Starred' }]);
          break;
        case 'shared':
          response = await apiService.getSharedFiles();
          setFiles(Array.isArray(response) ? response : []);
          setBreadcrumbs([{ id: null, name: 'Shared with me' }]);
          break;
        case 'trash':
          response = await apiService.getTrashedFiles();
          setFiles(Array.isArray(response) ? response : []);
          setBreadcrumbs([{ id: null, name: 'Trash' }]);
          break;
        default:
          setFiles([]);
          setBreadcrumbs([]);
      }
    } catch (err) {
      setError('Failed to load files: ' + (err.response?.data?.detail || err.message));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Search files
  const searchFiles = async () => {
    if (!searchQuery.trim()) {
      loadFiles();
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.searchFiles(searchQuery);
      setFiles(response.items || []);
      setBreadcrumbs([{ id: null, name: `Search results for "${searchQuery}"` }]);
    } catch (err) {
      setError('Search failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle file click (open folder or download file)
  const handleFileClick = (file) => {
    if (file.type === 'folder') {
      setCurrentFolder(file);
      setActiveSection('my-drive'); // Always switch to my-drive when navigating folders
    } else {
      handleFileAction(file, 'download');
    }
  };

  // Handle file actions
  const handleFileAction = async (file, action) => {
    try {
      switch (action) {
        case 'download':
          if (file.type === 'file') {
            const response = await apiService.downloadFile(file.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
          }
          break;
        case 'star':
          await apiService.updateFile(file.id, { is_starred: !file.is_starred });
          loadFiles(); // Refresh to show updated star status
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
            await apiService.deleteFile(file.id);
            loadFiles(); // Refresh to show changes
          }
          break;
        default:
          console.log('Action not implemented:', action);
      }
    } catch (err) {
      setError('Action failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = (folderId) => {
    if (folderId) {
      // Find the folder object to set as current
      // For now, we'll just set the ID and let loadFiles handle it
      setCurrentFolder({ id: folderId });
    } else {
      setCurrentFolder(null);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    try {
      await apiService.uploadFile(file, currentFolder?.id);
      loadFiles(); // Refresh to show uploaded file
    } catch (err) {
      throw new Error('Upload failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Handle folder creation
  const handleFolderCreate = async (name) => {
    try {
      await apiService.createFolder(name, currentFolder?.id);
      loadFiles(); // Refresh to show new folder
    } catch (err) {
      throw new Error('Folder creation failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Handle create new action
  const handleCreateNew = (type) => {
    if (type === 'folder') {
      setShowCreateFolderModal(true);
    } else if (type === 'upload') {
      setShowUploadModal(true);
    }
  };

  // Load files when section or folder changes
  useEffect(() => {
    loadFiles();
  }, [activeSection, currentFolder]);

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchFiles();
      } else {
        loadFiles();
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reset current folder when changing sections (except my-drive)
  useEffect(() => {
    if (activeSection !== 'my-drive') {
      setCurrentFolder(null);
    }
  }, [activeSection]);

  const getSectionTitle = () => {
    const titles = {
      'my-drive': 'My Drive',
      'shared': 'Shared with me',
      'recent': 'Recent',
      'starred': 'Starred',
      'trash': 'Trash'
    };
    return titles[activeSection] || 'Drive';
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <Header
        user={user}
        onLogout={onLogout}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onCreateNew={handleCreateNew}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          user={user}
        />
        
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
                {error}
                <button 
                  onClick={() => setError('')}
                  className="float-right text-red-300 hover:text-red-100"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">
                {getSectionTitle()}
              </h2>
              
              {activeSection === 'my-drive' && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowCreateFolderModal(true)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <span>📁</span>
                    <span>New folder</span>
                  </button>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload</span>
                  </button>
                </div>
              )}
            </div>

            {activeSection === 'my-drive' && breadcrumbs.length > 0 && (
              <Breadcrumb 
                breadcrumbs={breadcrumbs} 
                onNavigate={handleBreadcrumbNavigate}
              />
            )}
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-gray-400 mt-2">Loading...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-300 mb-2">
                  {searchQuery ? 'No files found' : 'No files here'}
                </h3>
                <p className="text-gray-400">
                  {searchQuery 
                    ? 'Try adjusting your search or upload some files.' 
                    : 'Upload files or create folders to get started.'
                  }
                </p>
              </div>
            ) : (
              <FileGrid
                files={files}
                viewMode={viewMode}
                onFileClick={handleFileClick}
                onFileAction={handleFileAction}
              />
            )}
          </div>
        </div>
      </div>

      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        onUpload={handleFileUpload}
      />

      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreate={handleFolderCreate}
      />
    </div>
  );
};