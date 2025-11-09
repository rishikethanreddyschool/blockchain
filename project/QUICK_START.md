# Quick Start Guide - Enhanced Provenance Verification

## Setup (5 Minutes)

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Required variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Optional (for blockchain):
```env
VITE_PUBLIC_SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
SERVER_PORT=3001
```

### 3. Apply Database Migration
The migration will be auto-applied by Supabase when detected in `/supabase/migrations/`.

Or manually apply:
```sql
-- Run this in Supabase SQL Editor
ALTER TABLE artwork_metadata ADD COLUMN IF NOT EXISTS perceptual_hash text;
CREATE INDEX IF NOT EXISTS idx_artwork_metadata_perceptual_hash ON artwork_metadata(perceptual_hash);
```

### 4. Start Backend Server (Optional)
```bash
cd server
npm install
npm start
```

**Note**: Backend is optional. App works without it but skips blockchain registration.

### 5. Start Frontend
```bash
npm run dev
```

Visit: `http://localhost:5174`

## How to Use

### Upload Artwork
1. Click "Upload Artwork" tab
2. Select an image file
3. Enter title and description
4. Click "Upload Artwork"

**System automatically checks for:**
- Exact duplicates (cryptographic hash)
- Similar artworks (perceptual hash)
- Hamming distance ≤ 5

### Verify Artwork
1. Click "Verify Artwork" tab
2. Upload an image to check
3. Click "Verify Artwork"

**Results:**
- ✅ Match found: Shows artist and artwork details
- ⚠️ No match: Artwork unverified or significantly altered

### Browse Gallery
1. Click "Gallery" tab
2. View all registered artworks
3. See blockchain verification status

## Toast Messages You'll See

### On Upload:
- **Success**: "Artwork uploaded and hash recorded on blockchain!"
- **Exact Copy**: "This exact artwork already exists in provenance records. Originally uploaded by: [Artist Name]"
- **Similar**: "This artwork appears to be a modified version of '[Title]' by [Artist Name]. Hamming distance: [X]"

### On Verification:
- **Verified**: "This artwork matches a verified record by [Artist Name]"
- **Not Verified**: "No provenance record found — this artwork may be altered or unverified."

## Test the System

### Test 1: Upload Original
1. Upload any image
2. Expected: Success message

### Test 2: Upload Duplicate
1. Upload the same image again
2. Expected: "Exact Copy Detected" warning

### Test 3: Upload Modified Version
1. Resize or edit an existing artwork
2. Upload the modified version
3. Expected: "Similar Artwork Detected" with distance score

### Test 4: Verify Registered Artwork
1. Go to Verify tab
2. Upload a registered artwork
3. Expected: "Artwork Verified!" with details

### Test 5: Verify Unknown Image
1. Upload a random image not in database
2. Expected: "No Match Found"

## Troubleshooting

### Build Fails
```bash
npm install --legacy-peer-deps
npm run build
```

### Backend Not Starting
- Check if port 3001 is available
- Verify .env variables are set
- App continues to work without backend

### Upload Fails
- Check Supabase connection in .env
- Verify storage bucket "artworks" exists
- Check browser console for errors

### Verification Not Working
- Ensure perceptual_hash column exists
- Check if artworks have perceptual hashes
- Verify browser supports Canvas API

## Configuration

### Adjust Similarity Threshold
Edit `src/lib/perceptual-hash.ts`:
```typescript
const threshold = 5; // Lower = stricter, Higher = more lenient
```

### Change Hash Size
Edit `src/lib/perceptual-hash.ts`:
```typescript
const size = 8; // 8x8 = 64-bit hash (default)
```

## Support

Check documentation:
- `PROVENANCE_VERIFICATION_GUIDE.md` - Detailed guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- Browser console - Error messages
- Backend logs - Blockchain errors

## Success Indicators

✅ App builds without errors
✅ Can upload artworks
✅ Duplicate detection works
✅ Similarity detection works
✅ Verification tab functional
✅ Toast messages appear correctly

You're all set! Start uploading and verifying digital artworks.
