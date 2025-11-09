import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateFileHash } from '../lib/blockchain';
import { registerImageHash, isHashRegistered } from '../lib/contract-interactions';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';
import { Upload, Image, FileText, Calendar, Hash, Shield, X } from 'lucide-react';

export default function UploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'warning', title: string, message: string} | null>(null);
  const [uploadedArtwork, setUploadedArtwork] = useState<any>(null);
  const [hashGenerating, setHashGenerating] = useState(false);
  const [blockchainProcessing, setBlockchainProcessing] = useState(false);

  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setToast({ 
          type: 'error', 
          title: 'Invalid File Type', 
          message: 'Please select an image file (PNG, JPG, GIF)' 
        });
        return;
      }
      
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setToast(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title.trim() || !user) {
      setToast({ 
        type: 'error', 
        title: 'Missing Information', 
        message: 'Please fill in all required fields and select an image' 
      });
      return;
    }

    setLoading(true);
    setToast(null);
    setHashGenerating(true);

    try {
      // Generate SHA256 hash of the file
      const fileHash = await generateFileHash(file);
      
      // Check if artwork with this hash already exists on blockchain
      const isRegisteredOnBlockchain = await isHashRegistered(fileHash);
      if (isRegisteredOnBlockchain) {
        setHashGenerating(false);
        setLoading(false);
        setToast({ 
          type: 'warning', 
          title: 'Artwork Already Registered', 
          message: 'This artwork hash is already registered on the blockchain.' 
        });
        return;
      }

      // Check if artwork with this hash already exists in Supabase
      const { data: existingArtwork, error: checkError } = await supabase
        .from('artwork_metadata')
        .select(`
          id, 
          title,
          profiles!inner(full_name, email)
        `)
        .eq('hash', fileHash)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is what we want
        throw checkError;
      }

      if (existingArtwork) {
        setHashGenerating(false);
        setLoading(false);
        
        const originalUploader = (existingArtwork as any).profiles?.full_name || 
                               (existingArtwork as any).profiles?.email || 
                               'Unknown Artist';
        
        setToast({ 
          type: 'warning', 
          title: 'Forgery detected!', 
          message: `This artwork already exists in provenance records. Originally uploaded by: ${originalUploader}` 
        });
        return;
      }

      setHashGenerating(false);
      setBlockchainProcessing(true);

      // Make API call to backend to register artwork on blockchain
      const response = await fetch('http://localhost:3001/register-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageHash: fileHash }),
      });

      const backendResponse = await response.json();

      if (!response.ok) {
        throw new Error(backendResponse.error || 'Failed to register image hash on blockchain via backend');
      }

      setBlockchainProcessing(false);

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('artworks')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('artworks')
        .getPublicUrl(fileName);

      // Save metadata to database
      const { data, error: dbError } = await supabase
        .from('artwork_metadata')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          image_url: publicUrl,
          hash: fileHash,
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Register artwork on blockchain
      // await registerImageHash(fileHash); // Removed direct blockchain interaction
      // setBlockchainProcessing(false);

      setToast({ 
        type: 'success', 
        title: 'Upload Successful', 
        message: 'Artwork uploaded and hash recorded on blockchain!' 
      });

      setUploadedArtwork(data);
      
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setPreview(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      setToast({ 
        type: 'error', 
        title: 'Upload Failed', 
        message: error.message || 'Failed to upload artwork' 
      });
    } finally {
      setLoading(false);
      setHashGenerating(false);
      setBlockchainProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {toast && (
        <Toast 
          type={toast.type} 
          title={toast.title}
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image *
              </label>
              
              {!preview ? (
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors cursor-pointer">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mt-2 text-center">
                    <label
                      htmlFor="file-upload-change"
                      className="text-sm text-indigo-600 hover:text-indigo-500 cursor-pointer font-medium"
                    >
                      Change image
                      <input
                        id="file-upload-change"
                        name="file-upload-change"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter artwork title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Describe your artwork..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || hashGenerating || blockchainProcessing || !file || !title.trim()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {hashGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Hash...
                </>
              ) : blockchainProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Recording on Blockchain...
                </>
              ) : loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Upload Artwork'
              )}
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          {uploadedArtwork && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recently Uploaded</h3>
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={uploadedArtwork.image_url}
                    alt={uploadedArtwork.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">{uploadedArtwork.title}</h4>
                  {uploadedArtwork.description && (
                    <p className="text-gray-600 text-sm">{uploadedArtwork.description}</p>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Uploaded {new Date(uploadedArtwork.uploaded_at).toLocaleDateString()}</span>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 text-green-700">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Blockchain Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}