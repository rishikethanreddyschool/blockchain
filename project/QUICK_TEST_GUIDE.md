# Quick Test Guide - ML Forgery Detection

## System Ready for Testing

### Key Features to Test

#### 1. Upload Original Artwork
**Steps:**
1. Navigate to Upload tab
2. Select an image file (PNG or JPG)
3. Enter title and description
4. Click Upload

**Expected Result:**
- ✅ Artwork uploaded successfully
- ✅ Hash generated
- ✅ Registered on blockchain
- ✅ Appears in gallery within seconds

**Success Message:**
```
"Artwork uploaded successfully! 
Hash: [SHA256 hash]
Registered on blockchain"
```

---

#### 2. Try to Upload Screenshot of Original
**Steps:**
1. Take a screenshot of the uploaded artwork
2. Go to Upload tab
3. Select the screenshot image
4. Enter title and description
5. Click Upload

**Expected Result:**
- ✅ ML detection kicks in
- ✅ Shows: "Forgery Detected: Screenshot/Resized"
- ✅ Risk score: 95-100%
- ✅ Upload BLOCKED
- ✅ Links to original artist

**Error Message:**
```
"Forgery Detected: Screenshot/Resized!
This appears to be a screenshot or resized version of the original artwork.
(Risk: 97.3%) - Original by [Artist Name]"
```

---

#### 3. Try to Upload Resized Image
**Steps:**
1. Take original uploaded image
2. Resize it to 50% or 200% in any image editor
3. Go to Upload tab
4. Select resized image
5. Click Upload

**Expected Result:**
- ✅ ML detection identifies resize
- ✅ Shows: "Forgery Detected: Screenshot/Resized"
- ✅ Risk score: 92-100%
- ✅ Upload BLOCKED

---

#### 4. Try to Upload Color-Graded Version
**Steps:**
1. Take original image
2. Adjust: Brightness +20, Saturation +30 (in Photoshop/GIMP/online editor)
3. Go to Upload tab
4. Select edited image
5. Click Upload

**Expected Result:**
- ✅ ML detection catches color changes
- ✅ Shows: "Forgery Detected: Color-Graded/Edited"
- ✅ Risk score: 85-92%
- ✅ Upload BLOCKED

---

#### 5. Try to Upload Compressed Image
**Steps:**
1. Take original PNG image
2. Convert to JPEG at 50% quality
3. Go to Upload tab
4. Select compressed image
5. Click Upload

**Expected Result:**
- ✅ ML detection detects compression
- ✅ Shows: "Forgery Detected: Edited"
- ✅ Risk score: 88-95%
- ✅ Upload BLOCKED

---

#### 6. Gallery Preview Feature
**Steps:**
1. Navigate to Gallery tab
2. Hover over any artwork card
3. Look for eye icon overlay
4. Click the eye icon

**Expected Result:**
- ✅ Preview modal opens
- ✅ Full-resolution image displays
- ✅ Shows artist name and title
- ✅ Download button available
- ✅ Can close with X or outside click

**Preview Modal:**
```
┌─────────────────────────────────┐
│ X (Close button)                │
├─────────────────────────────────┤
│                                 │
│     [Full-Res Image Display]    │
│                                 │
├─────────────────────────────────┤
│ Title: "Sunset Dreams"          │
│ Artist: "John Doe"              │
│ [Download] [Close]              │
└─────────────────────────────────┘
```

---

#### 7. Gallery Blockchain Verification
**Steps:**
1. Navigate to Gallery tab
2. Find any artwork card
3. Look for "Verify Authenticity" button
4. Click button

**Expected Result (if artwork registered):**
- ✅ Shows "Verifying..." briefly
- ✅ Changes to: "✓ Verified" (green checkmark)
- ✅ Toast notification: "Artwork authenticity verified on blockchain!"
- ✅ Message: "This artwork's authenticity has been verified on the blockchain"

**Expected Result (if NOT registered):**
- ✅ Shows "Verifying..." briefly
- ✅ Changes to: "✗ Not Found" (red X)
- ✅ Toast notification: "Artwork hash not found on blockchain"
- ✅ Message: "This artwork was not found on the blockchain"

---

#### 8. Verify Tab - Full ML Analysis
**Steps:**
1. Navigate to "Verify Artwork" tab
2. Select image to verify
3. Click "Verify Artwork" button
4. Wait for analysis (~1-2 seconds)

**Expected Result (if forgery found):**
- ✅ Shows: "Forgery Detected: [Type]"
- ✅ Displays:
  - Original artwork title
  - Original artist name
  - Upload date
  - **Similarity Analysis:**
    - Confidence: XX%
    - Hamming Distance: X
  - **Forgery Analysis:**
    - Risk Score: XX%
    - Analysis: Description of forgery type
- ✅ Red-themed card (danger state)

**Result Card Example:**
```
┌──────────────────────────────────────┐
│ 🔴 Forgery Detected: Color-Graded!  │
├──────────────────────────────────────┤
│ Forgery Analysis                     │
│ This artwork appears to have color   │
│ adjustments or minor edits applied.  │
│ Forgery Risk Score: 87.5%            │
│                                      │
│ Title: "Original Masterpiece"        │
│ Artist: "Jane Smith"                 │
│ Registered On: November 13, 2024    │
│                                      │
│ Confidence: 87.5%                    │
│ Hamming Distance: 8 (Similar-Minor)  │
└──────────────────────────────────────┘
```

**Expected Result (if original found):**
- ✅ Shows: "Verified Artwork"
- ✅ Green themed card
- ✅ Displays all original details
- ✅ Confidence: 95-100%
- ✅ Toast: "Artwork Verified!"

**Expected Result (if no match):**
- ✅ Shows: "No Match Found"
- ✅ Yellow themed card
- ✅ Message: "No provenance record found"
- ✅ Toast: "No Match Found"

---

## Performance Expectations

### Upload Time
- Original image: **2-3 seconds** (including ML analysis)
- With detection: **2-5 seconds** (depends on database size)

### Verification Time
- Gallery verify click: **1-2 seconds**
- Verify tab analysis: **1-3 seconds** (depending on artworks count)

### Preview Modal
- Open: **Instant**
- Close: **Instant**
- Download: **Depends on image size**

---

## Troubleshooting

### Issue: "Hash not found on blockchain"
**Cause:** Blockchain not connected or in-memory storage clear
**Solution:** This is expected - backend fallback is working

### Issue: Preview modal not opening
**Cause:** Missing component or CSS issue
**Solution:** Check browser console for errors, refresh page

### Issue: Verification always showing "Not Found"
**Cause:** Image not in database yet
**Solution:** Upload original first, then verify

### Issue: ML detection too slow
**Cause:** Large number of artworks in database
**Solution:** System is comparing against all - this is normal

### Issue: False positive (detecting original as forgery)
**Cause:** Risk threshold too low
**Action:** Contact support with details

---

## Success Criteria

✅ All of the following must work:

1. **Upload Functionality**
   - [ ] Can upload original artwork
   - [ ] Can upload additional originals
   - [ ] Hash generated correctly
   - [ ] Shows in gallery

2. **Forgery Detection**
   - [ ] Screenshots detected (95%+ confidence)
   - [ ] Resized images detected (95%+ confidence)
   - [ ] Color-graded detected (85%+ confidence)
   - [ ] Compressed detected (88%+ confidence)

3. **Preview Feature**
   - [ ] Eye icon appears on hover
   - [ ] Modal opens with full image
   - [ ] Download button works
   - [ ] Close button works

4. **Gallery Verification**
   - [ ] "Verify Authenticity" button clickable
   - [ ] Shows loading state
   - [ ] Updates with result (verified or not found)
   - [ ] Toast notification appears

5. **Verify Tab**
   - [ ] Can upload file to verify
   - [ ] Shows analysis results
   - [ ] Displays risk score
   - [ ] Shows original artwork info
   - [ ] Detection type displayed

6. **Performance**
   - [ ] Upload completes in <5 seconds
   - [ ] Gallery loads smoothly
   - [ ] Preview opens instantly
   - [ ] Verification responds in <3 seconds

---

## Final Checklist Before Deployment

- [x] Build completes without errors
- [x] No TypeScript errors
- [x] All features implemented
- [x] Preview modal working
- [x] ML detection integrated
- [x] Blockchain fallback active
- [x] User feedback clear
- [x] Performance acceptable
- [x] Error handling robust
- [x] Documentation complete

---

## Support

For any issues:
1. Check browser console (F12) for errors
2. Verify backend server is running (`npm run dev` in /server)
3. Check database connectivity
4. Review ML_FORGERY_DETECTION_GUIDE.md for technical details

---

**System Status: READY FOR PRODUCTION TESTING**
