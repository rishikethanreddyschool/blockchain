# Enhanced Provenance Verification System

## Overview

The Digital Art Provenance & Forgery Detection system now includes an advanced verification mechanism using perceptual hashing to detect similar and altered artworks.

## Features

### 1. Perceptual Hash Generation
- Each uploaded artwork generates a perceptual hash (pHash)
- Perceptual hashes detect visually similar images even if they've been:
  - Resized
  - Compressed
  - Color-adjusted
  - Slightly modified

### 2. Similarity Detection
- Uses Hamming distance to compare perceptual hashes
- Threshold: ≤ 5 (configurable in `perceptual-hash.ts`)
- Detects forgeries and unauthorized modifications

### 3. Three-Tab Interface

#### Gallery Tab
- Browse all registered artworks
- View artwork details and artist information
- See blockchain verification status

#### Upload Artwork Tab
- Upload new digital artworks
- Automatic checks for:
  - Exact duplicate detection (cryptographic hash)
  - Similar artwork detection (perceptual hash)
  - Blockchain registration
- Real-time verification feedback

#### Verify Artwork Tab
- Upload any image to check authenticity
- Compare against all registered artworks
- Get instant verification results with artist attribution

## How It Works

### Upload Process

1. **File Selection**: User selects an image file
2. **Hash Generation**:
   - Cryptographic hash (SHA-256) for exact matching
   - Perceptual hash for similarity detection
3. **Duplicate Check**: System checks if exact copy exists
4. **Similarity Check**: Compares perceptual hash with all registered artworks using Hamming distance
5. **Storage**: If unique, uploads to Supabase with both hashes
6. **Blockchain Registration**: Registers cryptographic hash on blockchain

### Verification Process

1. **Image Upload**: User uploads image to verify
2. **Hash Computation**: Generates perceptual hash of uploaded image
3. **Database Comparison**: Compares against all registered perceptual hashes
4. **Result Display**:
   - **Match Found**: Shows artwork details, artist name, and similarity score
   - **No Match**: Indicates artwork is unverified or significantly altered

## Toast Messages

### Upload Responses

- **Exact Copy Detected**: "This exact artwork already exists in provenance records. Originally uploaded by: [Artist Name]"
- **Similar Artwork Detected**: "This artwork appears to be a modified version of '[Title]' by [Artist Name]. Hamming distance: [Distance]"
- **Upload Successful**: "Artwork uploaded and hash recorded on blockchain!"

### Verification Responses

- **Verified**: "This artwork matches a verified record by [Artist Name]"
- **Not Verified**: "No provenance record found — this artwork may be altered or unverified."

## Database Schema

### artwork_metadata Table

```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles)
- title (text)
- description (text)
- image_url (text)
- hash (text) - SHA-256 cryptographic hash
- perceptual_hash (text) - Perceptual hash for similarity detection
- uploaded_at (timestamptz)
```

## Configuration

### Hamming Distance Threshold

Edit `src/lib/perceptual-hash.ts`:

```typescript
const threshold = 5; // Adjust for stricter or looser matching
```

- Lower values (0-3): More strict, only very similar images
- Higher values (5-10): More lenient, detects broader modifications

### Perceptual Hash Size

Edit `src/lib/perceptual-hash.ts`:

```typescript
const size = 8; // Results in 64-bit hash (8x8)
```

Increasing size improves accuracy but reduces performance.

## Backend Setup

### Environment Variables Required

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Blockchain Configuration (optional)
VITE_PUBLIC_SEPOLIA_RPC_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_private_key
SERVER_PORT=3001
```

### Running the Backend Server

```bash
cd server
npm install
npm start
```

The backend server handles blockchain registration. If not running, the app will continue to work but skip blockchain registration.

## Database Migration

The migration file `20251109000000_add_perceptual_hash.sql` adds:
- `perceptual_hash` column to `artwork_metadata` table
- Index for faster lookups
- Documentation comments

## Testing the System

### Test Scenario 1: Upload Original Artwork
1. Go to "Upload Artwork" tab
2. Select an image
3. Enter title and description
4. Click "Upload Artwork"
5. Expected: Success message, artwork stored with both hashes

### Test Scenario 2: Upload Duplicate
1. Try uploading the same image again
2. Expected: "Exact Copy Detected" warning with original artist name

### Test Scenario 3: Upload Modified Version
1. Take an existing artwork and modify it slightly (resize, adjust colors)
2. Upload the modified version
3. Expected: "Similar Artwork Detected" warning with Hamming distance

### Test Scenario 4: Verify Artwork
1. Go to "Verify Artwork" tab
2. Upload a registered artwork
3. Expected: "Artwork Verified!" with artist details and similarity score

### Test Scenario 5: Verify Unknown Artwork
1. Upload an image not in the database
2. Expected: "No Match Found" message

## Technical Details

### Perceptual Hashing Algorithm

The implementation uses a simplified version of average hash (aHash):

1. Resize image to 8x8 pixels
2. Convert to grayscale
3. Calculate average pixel value
4. Generate binary hash: 1 if pixel > average, 0 otherwise
5. Convert to hexadecimal string

### Hamming Distance Calculation

Measures bit differences between two hashes:
- 0 = Identical
- 1-5 = Very similar
- 6-15 = Similar with modifications
- >15 = Different images

## Security Considerations

1. **Perceptual hashes are stored** in the database for comparison
2. **Cryptographic hashes** prevent exact duplicates
3. **Blockchain registration** provides immutable proof of ownership
4. **RLS policies** ensure users can only modify their own artworks
5. **Backend validation** prevents unauthorized blockchain registrations

## Performance Optimization

- Indexed perceptual_hash column for fast lookups
- Client-side hash generation reduces server load
- Lazy comparison (only when needed)
- Optional blockchain registration (graceful degradation)

## Future Enhancements

1. Batch verification API
2. Advanced perceptual hashing (DCT-based)
3. Multi-resolution comparison
4. IPFS integration for decentralized storage
5. NFT minting capabilities

## Troubleshooting

### "Failed to generate perceptual hash"
- Ensure image format is supported (PNG, JPG, GIF)
- Check image file is not corrupted
- Verify canvas API is available

### "Backend server not available"
- Check if backend server is running on port 3001
- Verify CORS settings allow frontend access
- App continues to work; blockchain registration skipped

### "No provenance record found"
- Image hasn't been registered
- Image has been significantly altered beyond threshold
- Try uploading to register it

## Support

For issues or questions, please check:
1. Browser console for detailed error messages
2. Backend server logs for blockchain errors
3. Supabase dashboard for database errors
