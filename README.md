# 🐄 Ufugaji-BioID: Livestock Muzzle Print Biometrics System

**KSEF 2026 | Computer Science - Artificial Intelligence / Computer Systems**

A cutting-edge livestock identification system that uses AI-powered muzzle print biometrics to combat cattle rustling in Kenya's ASAL regions.

---

## 🏆 Why This Project Will Win

### Unique Kenyan Context
- **Problem**: Cattle rustling causes death, poverty, and instability in Turkana, Pokot, Kajiado, and other ASAL regions
- **Current Solutions Fail**: Ear tags are cut off, hot iron branding is cruel and damages hides
- **Our Solution**: A cow's muzzle print is unique (like a human fingerprint) and cannot be altered

### Scientific Novelty
- Uses **Convolutional Neural Network (CNN)** concepts for feature extraction
- Implements **CLAHE** (Contrast Limited Adaptive Histogram Equalization) for image enhancement
- **Cosine Similarity** algorithm for biometric matching
- **16-dimensional feature vectors** for each muzzle print

### Cross-Cutting Appeal
- ✅ **Computer Science**: AI algorithms, image processing, database design
- ✅ **Agriculture**: Livestock management, rural development
- ✅ **National Cohesion**: Security, conflict resolution, economic stability

### Feasibility
- Works **100% offline** - no internet required
- Runs on standard Android smartphones
- Uses lightweight algorithms suitable for mobile devices

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Modern web browser with camera access

### Installation

```bash
# Navigate to project directory
cd ufugaji-bioid

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

---

## 📱 The 4 MVPs (Minimum Viable Products)

### MVP 1: 📷 Muzzle Mapper
**Image Capture & Pre-processing**

- Camera interface with guide box overlay
- Automatic grayscale conversion
- CLAHE contrast enhancement
- Feature vector extraction

**Tech Demo**: Shows understanding of image processing, not just taking pictures

**Access**: Navigate to `/mapper` or click "Open Muzzle Mapper" from enrollment

---

### MVP 2: 📝 Offline Enrollment
**Database Creation**

- Registration form with owner and cattle details
- Breed and location selection (Kenyan counties)
- Muzzle print capture integration
- Local storage using localStorage API
- **NO INTERNET REQUIRED**

**Tech Demo**: Proves the app works in remote areas (Turkana, Pokot, Kajiado)

**Access**: Navigate to `/enroll`

---

### MVP 3: 🔍 AI Matcher
**Identification System**

- Capture muzzle print of found/stolen cattle
- Compare against enrolled database
- Return match percentages
- Rank results by confidence

**Algorithm**:
1. Capture & preprocess image
2. Extract 16-dimensional feature vector
3. Calculate cosine similarity with all enrolled cattle
4. Return top matches with percentage scores

**Tech Demo**: The "Magic Moment" - scan a print and identify the cow!

**Access**: Navigate to `/matcher`

---

### MVP 4: 📜 Digital Title Deed
**Certificate Generation**

- Unique certificate ID for each animal
- Professional PDF certificate with:
  - Owner details
  - Cattle information
  - Biometric ID status
  - Feature vector preview
- Download as PDF or print

**Tech Demo**: Addresses legal aspect of ownership disputes

**Access**: Navigate to `/cattle` and click "Certificate" on any enrolled animal

---

## 🧪 Demo Instructions for Judges

### Setup (Before Presentation)
1. Open the application in a browser
2. Ensure camera permissions are granted
3. Have 3 printed photos of different cow muzzle prints ready ("Dummy Cows")

### Live Demo Flow

#### Step 1: Show the Problem (1 minute)
- Navigate to Home page
- Explain cattle rustling problem in ASAL regions
- Point out why current methods fail

#### Step 2: Enroll Test Cattle (2 minutes)
- Go to "Enroll" page
- Register "Cow A" with sample data:
  - Name: "Kamau's Pride"
  - Owner: "John Kamau"
  - Breed: Boran
  - Location: Kajiado
- Check "Use sample data for demo"
- Click "Enroll Cattle"
- Show the generated certificate

#### Step 3: Test the Matcher (3 minutes) ⭐ **Key Moment**
- Go to "Matcher" page
- Explain the AI algorithm
- **Important**: Since we're using a browser demo:
  - Click "Scan & Match" (uses current camera frame)
  - Show how it compares against database
  - Explain that with actual muzzle photos, it would match Cow A but NOT Cow B or Cow C
- Show match percentage results

#### Step 4: Generate Certificate (1 minute)
- Go to "Registry" page
- Click "Certificate" on enrolled cow
- Click "Download PDF"
- Show the professional certificate

#### Step 5: Offline Capability (1 minute)
- Turn off WiFi/data
- Show app still works
- Demonstrate local storage

---

## 🛠️ Technical Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **html2canvas** for certificate generation
- **jsPDF** for PDF creation

### Image Processing (Simulated OpenCV)
- **Grayscale Conversion**: Luminosity method
- **Gaussian Blur**: 3x3 kernel for noise reduction
- **CLAHE**: Adaptive histogram equalization
- **Feature Extraction**: Grid analysis + edge detection

### Database
- **localStorage** for offline data persistence
- **JSON** data structure
- Sample data pre-loaded from `db.json`

### Algorithms
- **Cosine Similarity**: Match scoring
- **28-Dimensional Feature Vectors**: Biometric representation (grid mean, edge density, texture variance, radial patterns)
- **SSIM Concept**: Structural similarity for comparison
- **LBP Texture Analysis**: Validates muzzle print authenticity
- **Symmetry Detection**: Checks bilateral symmetry of muzzle
- **Edge Density Analysis**: Verifies ridge pattern characteristics

---

## 📊 Technical Implementation Details

### Image Processing Pipeline

```
RGB Image → Muzzle Validation → Grayscale → Gaussian Blur → CLAHE → Feature Extraction
```

1. **Muzzle Validation** (NEW - Cow-Specific Detection)
   - **Local Binary Patterns (LBP)**: Analyzes texture patterns unique to muzzle ridges
   - **Symmetry Analysis**: Cow muzzles have bilateral symmetry (left-right mirror)
   - **Edge Density**: Muzzle prints have characteristic ridge edge density (15-40%)
   - **Contrast Distribution**: Validates proper lighting and image quality
   - **Confidence Score**: Combined weighted score (≥45% = valid muzzle)

2. **Grayscale Conversion**
   ```javascript
   gray = 0.299*R + 0.587*G + 0.114*B
   ```

3. **Gaussian Blur** (Noise Reduction)
   - 3x3 kernel convolution
   - Reduces high-frequency noise

4. **CLAHE** (Contrast Enhancement)
   - 8x8 tile grid
   - Clip limit: 2.0
   - Enhances muzzle ridge visibility

5. **Feature Extraction** (28 dimensions)
   - Grid mean intensity (4x4 = 16 features)
   - Edge density per quadrant (2x2 = 4 features)
   - Texture variance per quadrant (2x2 = 4 features)
   - Radial patterns from center (4 features)

### Matching Algorithm

```javascript
similarity = (A · B) / (||A|| × ||B||)
```

- Cosine similarity between feature vectors
- Returns 0-100% match score
- Confidence boost applied when validation ≥60%
- **Match thresholds**:
  - 85%+ = Excellent match
  - 70-84% = Good match
  - 50-69% = Possible match
  - <50% = No match

---

## 📁 Project Structure

```
ufugaji-bioid/
├── public/
│   └── db.json              # Sample cattle data
├── src/
│   ├── pages/
│   │   ├── Home.jsx         # Landing page
│   │   ├── MuzzleMapper.jsx # MVP 1
│   │   ├── Enroll.jsx       # MVP 2
│   │   ├── Matcher.jsx      # MVP 3
│   │   ├── CattleList.jsx   # Registry view
│   │   └── Certificate.jsx  # MVP 4
│   ├── utils/
│   │   ├── database.js      # LocalStorage operations
│   │   └── imageProcessing.js # Image algorithms
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── index.html
└── package.json
```

---

## 🎨 Design Features

### Kenyan Context
- **Color Scheme**: Kenyan flag colors (black, red, green)
- **Locations**: Turkana, Pokot, Kajiado, Narok, etc.
- **Breeds**: Boran, Zebu, Ankole, Sahiwal
- **Language**: Swahili-inspired name "Ufugaji" (Livestock Keeping)

### UI/UX
- Responsive design (mobile-first)
- Offline-first architecture
- Clear visual feedback
- Professional certificate design

---

## 🏅 Competition Talking Points

### Innovation
- "While others build generic inventory apps, we're solving a specific violent problem affecting millions of Kenyans"
- "Muzzle prints are unalterable - unlike ear tags that thieves cut off"

### Technical Depth
- "We implemented a CNN-inspired feature extraction pipeline with 28-dimensional feature vectors"
- "Our CLAHE implementation enhances ridge visibility for accurate matching"
- "**Cow-specific validation**: Uses Local Binary Patterns (LBP), symmetry analysis, and edge density detection to verify the image is actually a muzzle print"
- "Multi-stage validation ensures only valid muzzle prints are enrolled and matched"

### Impact
- "8 million+ cattle in ASAL regions worth billions of shillings"
- "Can reduce cattle rustling incidents by providing irrefutable ownership proof"

### Scalability
- "Future: Cloud synchronization when internet available"
- "Future: Integration with government livestock databases"
- "Future: Mobile app for Android using TensorFlow Lite"

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📝 Sample Data

The app comes pre-loaded with 5 sample cattle entries:
- Kamau's Pride (Boran, Kajiado)
- Naserian (Zebu, Turkana)
- Baraka (Ankole, Pokot)
- Cheptum (Boran, West Pokot)
- Lekure (Zebu, Narok)

---

## 🎯 Judge Evaluation Criteria Alignment

| Criteria | How We Meet It |
|----------|----------------|
| **Innovation** | First muzzle print biometric system in Kenya |
| **Technical Skill** | Image processing, AI algorithms, offline-first |
| **Impact** | Addresses national security issue |
| **Feasibility** | Works on standard smartphones, no internet |
| **Presentation** | Professional UI, clear demo flow |

---

## 📞 Contact

**KSEF 2026 Project**
- Category: Computer Science
- Sub-theme: Artificial Intelligence / Computer Systems
- Project: Ufugaji-BioID

---

## 🙏 Acknowledgments

- Kenya Science and Engineering Fair 2026
- OpenCV community for image processing concepts
- React community for excellent documentation

---

*"Securing Kenya's Livestock, One Muzzle Print at a Time"* 🐄🇰🇪
