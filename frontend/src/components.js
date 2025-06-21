import React, { useState, useEffect } from 'react';

// Mock data for files and folders
const mockFiles = [
  { id: 1, name: 'Projects', type: 'folder', size: '', modified: '2 days ago', icon: '📁', color: '#4285f4' },
  { id: 2, name: 'Documents', type: 'folder', size: '', modified: '1 week ago', icon: '📁', color: '#34a853' },
  { id: 3, name: 'Photos', type: 'folder', size: '', modified: '3 days ago', icon: '📁', color: '#fbbc05' },
  { id: 4, name: 'Presentation.pptx', type: 'file', size: '2.4 MB', modified: '1 hour ago', icon: '📊', color: '#ea4335' },
  { id: 5, name: 'Resume.pdf', type: 'file', size: '1.2 MB', modified: '2 days ago', icon: '📄', color: '#ea4335' },
  { id: 6, name: 'Spreadsheet.xlsx', type: 'file', size: '856 KB', modified: '5 days ago', icon: '📈', color: '#34a853' },
  { id: 7, name: 'Video.mp4', type: 'file', size: '45.6 MB', modified: '1 week ago', icon: '🎥', color: '#fbbc05' },
  { id: 8, name: 'Music.mp3', type: 'file', size: '5.2 MB', modified: '3 days ago', icon: '🎵', color: '#9c27b0' },
  { id: 9, name: 'Design.sketch', type: 'file', size: '12.8 MB', modified: '4 days ago', icon: '🎨', color: '#ff9800' },
  { id: 10, name: 'Code.zip', type: 'file', size: '8.9 MB', modified: '1 day ago', icon: '💻', color: '#607d8b' },
];

// Login Page Component
export const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin({ email, name: email.split('@')[0] });
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
          <h2 className="text-2xl font-semibold text-white mb-2">Sign in</h2>
          <p className="text-gray-400">to continue to Google Drive</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
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
                autoComplete="current-password"
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
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Forgot email?
              </a>
            </div>
            <div className="text-sm">
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Create account
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
            >
              Sign in
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              Not your computer? Use Guest mode to sign in privately.{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Learn more
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Sidebar Component
export const Sidebar = ({ activeSection, setActiveSection, isCollapsed, setIsCollapsed }) => {
  const menuItems = [
    { id: 'my-drive', name: 'My Drive', icon: '🗂️', count: null },
    { id: 'shared', name: 'Shared with me', icon: '👥', count: 3 },
    { id: 'recent', name: 'Recent', icon: '🕒', count: null },
    { id: 'starred', name: 'Starred', icon: '⭐', count: null },
    { id: 'trash', name: 'Trash', icon: '🗑️', count: 5 },
  ];

  const storageUsed = 68;
  const storageTotal = 100;

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
        
        {!isCollapsed && (
          <button className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
            </svg>
            <span className="font-medium">New</span>
          </button>
        )}
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

      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Storage</div>
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex-1 bg-gray-800 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${storageUsed}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-400">{storageUsed}%</span>
          </div>
          <div className="text-xs text-gray-400">
            {storageUsed} GB of {storageTotal} GB used
          </div>
          <button className="w-full mt-2 text-xs text-blue-400 hover:text-blue-300 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
            Buy storage
          </button>
        </div>
      )}
    </div>
  );
};

// Header Component
export const Header = ({ user, onLogout, viewMode, setViewMode, searchQuery, setSearchQuery }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-gray-400 text-sm">{user.email}</div>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">
                    Manage your Google Account
                  </button>
                  <button className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">
                    Settings
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
export const FileGrid = ({ files, viewMode, onFileClick }) => {
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
              onClick={() => onFileClick(file)}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <div className="col-span-6 flex items-center space-x-3">
                <span className="text-2xl">{file.icon}</span>
                <span className="text-white truncate">{file.name}</span>
              </div>
              <div className="col-span-2 text-gray-400 text-sm flex items-center">
                {file.modified}
              </div>
              <div className="col-span-2 text-gray-400 text-sm flex items-center">
                {file.size}
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
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
          onClick={() => onFileClick(file)}
          className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 cursor-pointer transition-colors group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 mb-3 flex items-center justify-center rounded-lg" style={{ backgroundColor: file.color + '20' }}>
              <span className="text-3xl">{file.icon}</span>
            </div>
            <h3 className="text-white text-sm font-medium truncate w-full mb-1">
              {file.name}
            </h3>
            <p className="text-gray-400 text-xs">
              {file.modified}
            </p>
            {file.size && (
              <p className="text-gray-400 text-xs">
                {file.size}
              </p>
            )}
          </div>
          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded">
              Open
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Upload Modal Component
export const UploadModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Upload Files</h2>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-300 mb-2">Drag and drop files here</p>
          <p className="text-gray-400 text-sm mb-4">or</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Select Files
          </button>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Upload
          </button>
        </div>
      </div>
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
  const [files, setFiles] = useState(mockFiles);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileClick = (file) => {
    if (file.type === 'folder') {
      console.log('Opening folder:', file.name);
    } else {
      console.log('Opening file:', file.name);
    }
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
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white capitalize">
                {activeSection.replace('-', ' ')}
              </h2>
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
            
            {filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-300 mb-2">No files found</h3>
                <p className="text-gray-400">Try adjusting your search or upload some files.</p>
              </div>
            ) : (
              <FileGrid
                files={filteredFiles}
                viewMode={viewMode}
                onFileClick={handleFileClick}
              />
            )}
          </div>
        </div>
      </div>

      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />
    </div>
  );
};