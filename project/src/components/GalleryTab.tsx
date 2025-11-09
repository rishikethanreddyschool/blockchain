import React, { useState, useEffect } from 'react';
import { supabase, ArtworkMetadata } from '../lib/supabase';
import { isHashRegistered } from '../lib/contract-interactions';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';
import { Calendar, FileText, Shield, ExternalLink, CheckCircle, XCircle, Loader, User } from 'lucide-react';

export default function GalleryTab() {
  const [artworks, setArtworks] = useState<ArtworkMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'warning', title: string, message: string} | null>(null);
  const [verifyingHashes, setVerifyingHashes] = useState<Set<string>>(new Set());
  const [verificationResults, setVerificationResults] = useState<Map<string, { verified: boolean; error?: string }>>(new Map());
  
  const { user } = useAuth();

  useEffect(() => {
    fetchAllArtworks();
  }, []);

  const fetchAllArtworks = async () => {
    try {
      // Fetch all artworks from all users for universal gallery
      const { data, error } = await supabase
        .from('artwork_metadata')
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw error;
      }

      setArtworks(data || []);
    } catch (error: any) {
      setToast({ type: 'error', title: 'Loading Error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyArtwork = async (artwork: ArtworkMetadata) => {
    if (!artwork.hash) {
      setToast({ type: 'error', title: 'Verification Error', message: 'No hash available for this artwork' });
      return;
    }

    setVerifyingHashes(prev => new Set(prev).add(artwork.id));
    
    try {
      const verified = await isHashRegistered(artwork.hash);
      
      setVerificationResults(prev => new Map(prev).set(artwork.id, {
        verified: verified,
        error: verified ? undefined : 'Hash not found on blockchain'
      }));
      
    } catch (error: any) {
      setVerificationResults(prev => new Map(prev).set(artwork.id, {
        verified: false,
        error: error.message
      }));
    } finally {
      setVerifyingHashes(prev => {
        const newSet = new Set(prev);
        newSet.delete(artwork.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast 
          type={toast.type} 
          title={toast.title}
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Universal Art Gallery</h2>
        <p className="text-gray-600">Discover digital artworks from our community of artists</p>
      </div>

      {artworks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No artworks yet</h3>
          <p className="text-gray-600 mb-4">
            Be the first to share your digital art with the community.
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-6">
            Showing {artworks.length} artwork{artworks.length !== 1 ? 's' : ''} from our community
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((artwork) => (
              <div
                key={artwork.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100"
              >
                {/* Image */}
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg truncate">
                    {artwork.title}
                  </h3>
                  
                  {/* Artist Info */}
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <User className="h-4 w-4 mr-1" />
                    <span>
                      {(artwork as any).profiles?.full_name || 
                       (artwork as any).profiles?.email?.split('@')[0] || 
                       'Anonymous Artist'}
                    </span>
                  </div>
                  
                  {artwork.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {artwork.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(artwork.uploaded_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  
                  {/* Blockchain Verification */}
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">Blockchain Verification</span>
                      </div>
                      
                      {verifyingHashes.has(artwork.id) ? (
                        <div className="flex items-center space-x-1 text-xs text-blue-600">
                          <Loader className="h-3 w-3 animate-spin" />
                          <span>Verifying...</span>
                        </div>
                      ) : verificationResults.has(artwork.id) ? (
                        <div className="flex items-center space-x-1 text-xs">
                          {verificationResults.get(artwork.id)?.verified ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">Verified</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-red-600" />
                              <span className="text-red-600">Not Found</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleVerifyArtwork(artwork)}
                          disabled={!artwork.hash}
                          className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          Verify Authenticity
                        </button>
                      )}
                    </div>
                    
                    {verificationResults.has(artwork.id) && verificationResults.get(artwork.id)?.error && (
                      <div className="text-xs text-red-500">
                        Error: {verificationResults.get(artwork.id)?.error}
                      </div>
                    )}
                    
                    {verificationResults.has(artwork.id) && verificationResults.get(artwork.id)?.verified && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        This artwork's authenticity has been verified on the blockchain
                      </div>
                    )}
                    
                    {verificationResults.has(artwork.id) && !verificationResults.get(artwork.id)?.verified && !verificationResults.get(artwork.id)?.error && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        This artwork was not found on the blockchain. Authenticity cannot be verified.
                      </div>
                    )}
                    
                    {!artwork.hash && (
                      <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                        This artwork was uploaded before blockchain integration
                      </div>
                    )}
                  </div>
                </div>
                
                {/* View Full Image */}
                <div className="px-5 pb-5">
                  <a
                    href={artwork.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center py-2 px-3 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-sm rounded-lg transition-colors font-medium"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Full Image
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}