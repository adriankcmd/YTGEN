import React, { useState, useCallback } from 'react';
import { Upload, FileAudio, Type, Sparkles, CheckCircle, AlertCircle, Loader2, Wifi } from 'lucide-react';

interface UploadState {
  cta: File | null;
  bgm: File | null;
  prompt: string;
}

interface SubmissionState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

function App() {
  const [uploads, setUploads] = useState<UploadState>({
    cta: null,
    bgm: null,
    prompt: ''
  });

  const [submission, setSubmission] = useState<SubmissionState>({
    loading: false,
    success: false,
    error: null
  });

  const [connectionTest, setConnectionTest] = useState<{
    testing: boolean;
    connected: boolean | null;
  }>({
    testing: false,
    connected: null
  });
  const [dragStates, setDragStates] = useState({
    cta: false,
    bgm: false
  });

  const handleDragEnter = useCallback((type: 'cta' | 'bgm') => (e: React.DragEvent) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: true }));
  }, []);

  const handleDragLeave = useCallback((type: 'cta' | 'bgm') => (e: React.DragEvent) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: false }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((type: 'cta' | 'bgm') => (e: React.DragEvent) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: false }));
    
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => file.type.startsWith('audio/'));
    
    if (audioFile) {
      setUploads(prev => ({ ...prev, [type]: audioFile }));
    }
  }, []);

  const handleFileSelect = useCallback((type: 'cta' | 'bgm') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setUploads(prev => ({ ...prev, [type]: file }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploads.cta || !uploads.bgm || !uploads.prompt.trim()) {
      setSubmission(prev => ({ ...prev, error: 'Please fill in all required fields' }));
      return;
    }

    setSubmission({ loading: true, success: false, error: null });

    try {
      const formData = new FormData();
      formData.append('cta', uploads.cta);
      formData.append('bgm', uploads.bgm);
      formData.append('prompt', uploads.prompt);

      const response = await fetch('http://localhost:8080/webhook/e9402225-9ac3-4f33-bd00-fe4c40868234', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'sec-ch-ua-platform': '"macOS"',
          'Referer': window.location.origin,
          'User-Agent': navigator.userAgent,
          'Accept': 'application/json',
          'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?0'
        },
        body: formData,
      });

      if (response.ok) {
        setSubmission({ loading: false, success: true, error: null });
        // Reset form after successful submission
        setTimeout(() => {
          setUploads({ cta: null, bgm: null, prompt: '' });
          setSubmission({ loading: false, success: false, error: null });
        }, 3000);
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      setSubmission({
        loading: false,
        success: false,
        error: error instanceof Error 
          ? error.message === 'Failed to fetch' 
            ? 'Unable to connect to the server. Please ensure your n8n webhook is running on localhost:8080 and CORS is enabled.'
            : error.message
          : 'Failed to generate video'
      });
    }
  };
  const resetForm = () => {
    setUploads({ cta: null, bgm: null, prompt: '' });
    setSubmission({ loading: false, success: false, error: null });
  };
  const testConnection = async () => {
    setConnectionTest({ testing: true, connected: null });
    
    try {
      const response = await fetch('http://localhost:8080/webhook/e9402225-9ac3-4f33-bd00-fe4c40868234', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        body: new FormData(),
      });
      
      setConnectionTest({ testing: false, connected: true });
    } catch (error) {
      setConnectionTest({ testing: false, connected: false });
    }
  };
  const FileUploadZone = ({ 
    type, 
    file, 
    isDragging, 
    title, 
    description 
  }: { 
    type: 'cta' | 'bgm';
    file: File | null;
    isDragging: boolean;
    title: string;
    description: string;
  }) => (
    <div 
      className={`
        relative group overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-out
        ${isDragging 
          ? 'border-purple-400 bg-purple-50 scale-105 shadow-lg' 
          : file 
            ? 'border-green-400 bg-green-50' 
            : 'border-gray-300 bg-white hover:border-purple-300 hover:bg-purple-25'
        }
      `}
      onDragEnter={handleDragEnter(type)}
      onDragLeave={handleDragLeave(type)}
      onDragOver={handleDragOver}
      onDrop={handleDrop(type)}
    >
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileSelect(type)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        id={`${type}-upload`}
      />
      
      <div className="p-8 text-center">
        <div className={`
          inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all duration-300
          ${file 
            ? 'bg-green-100 text-green-600' 
            : isDragging 
              ? 'bg-purple-100 text-purple-600 scale-110' 
              : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
          }
        `}>
          {file ? <CheckCircle size={24} /> : <FileAudio size={24} />}
        </div>
        
        <h3 className="font-semibold text-lg text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        
        {file ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-600">✓ {file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Drop your MP3 file here or click to browse
            </p>
            <p className="text-xs text-gray-500">Supports MP3, WAV, M4A</p>
          </div>
        )}
      </div>
      
      {/* Animated background effect */}
      <div className={`
        absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-0 transition-opacity duration-300
        ${isDragging ? 'opacity-5' : ''}
      `} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 opacity-20 animate-pulse" />
        <div className="absolute top-1/2 -left-32 w-64 h-64 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 opacity-20 animate-pulse delay-1000" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 opacity-10 animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg mb-6 group hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-10 h-10 text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4 leading-tight">
            YouTube Shorts
            <br />
            <span className="text-3xl md:text-5xl">Generator</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Transform your ideas into engaging YouTube Shorts with AI-powered video generation
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="backdrop-blur-sm bg-white/70 rounded-3xl shadow-xl border border-white/20 p-8 md:p-12 hover:shadow-2xl transition-all duration-500">
            
            {/* File Upload Section */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <FileUploadZone
                type="cta"
                file={uploads.cta}
                isDragging={dragStates.cta}
                title="Call-to-Action Audio"
                description="Upload your CTA voice recording"
              />
              
              <FileUploadZone
                type="bgm"
                file={uploads.bgm}
                isDragging={dragStates.bgm}
                title="Background Music"
                description="Upload your background music track"
              />
            </div>

            {/* Text Input Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                  <Type className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Video Prompt</h3>
                  <p className="text-sm text-gray-600">Describe your video concept and style</p>
                </div>
              </div>
              
              <div className="relative">
                <textarea
                  value={uploads.prompt}
                  onChange={(e) => setUploads(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Enter your creative prompt here... Describe the style, mood, visuals, and any specific requirements for your YouTube Short."
                  className="w-full h-32 px-6 py-4 text-base border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:outline-none resize-none transition-all duration-300 placeholder:text-gray-400 bg-white/80 backdrop-blur-sm hover:border-gray-300"
                  maxLength={500}
                />
                <div className="absolute bottom-4 right-6 text-xs text-gray-400">
                  {uploads.prompt.length}/500
                </div>
              </div>
            </div>

            {/* Error Display */}
            {submission.error && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-fadeIn">
                <AlertCircle size={20} />
                <div>
                  <p className="font-medium">Connection Error</p>
                  <p className="text-sm">{submission.error}</p>
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={connectionTest.testing}
                    className="mt-2 text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors"
                  >
                    {connectionTest.testing ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </div>
            )}

            {/* Connection Test Result */}
            {connectionTest.connected !== null && (
              <div className={`flex items-center space-x-3 p-4 rounded-xl animate-fadeIn ${
                connectionTest.connected 
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <Wifi size={20} />
                <span>
                  {connectionTest.connected 
                    ? 'Connection to n8n webhook successful!' 
                    : 'Cannot connect to n8n webhook. Please check if n8n is running and CORS is enabled.'
                  }
                </span>
              </div>
            )}

            {/* Success Display */}
            {submission.success && (
              <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 animate-fadeIn">
                <CheckCircle size={20} />
                <span>Your YouTube Short is being generated! Check back soon.</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submission.loading || !uploads.cta || !uploads.bgm || !uploads.prompt.trim()}
              className={`
                w-full group relative overflow-hidden text-white font-semibold py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 transform
                ${submission.loading || !uploads.cta || !uploads.bgm || !uploads.prompt.trim()
                  ? 'bg-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                }
              `}
              onClick={(e) => {
                console.log('Button clicked!');
                console.log('Form valid:', uploads.cta && uploads.bgm && uploads.prompt.trim());
                console.log('Uploads:', uploads);
              }}
            >
              <div className="flex items-center justify-center space-x-3">
                {submission.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Your Short...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Create YouTube Short</span>
                  </>
                )}
              </div>
              
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl" />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by AI • Generate amazing YouTube Shorts in minutes</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;