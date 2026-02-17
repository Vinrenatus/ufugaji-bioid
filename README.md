# 🐄 Ufugaji-BioID: Livestock Muzzle Print Biometrics System

**KSEF 2026 | Computer Science - Artificial Intelligence / Computer Systems**

**Edmund Rice Catholic Education Center**

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
- **28-dimensional feature vectors** for biometric matching
- **Multi-factor validation**: LBP texture + Symmetry + Edge density + Contrast distribution

### Cross-Cutting Appeal
- ✅ **Computer Science**: AI algorithms, image processing, database design, CI/CD
- ✅ **Agriculture**: Livestock management, rural development
- ✅ **National Cohesion**: Security, conflict resolution, economic stability

### Feasibility
- Works **100% offline** - no internet required
- Runs on standard Android smartphones
- Camera OR upload interface for flexibility
- Production-ready CI/CD pipeline

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git for version control
- Modern web browser with camera access

### Installation

```bash
# Clone the repository
git clone https://github.com/Vinrenatus/ufugaji-bioid.git
cd ufugaji-bioid

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

---

## 📱 The 4 MVPs (Minimum Viable Products)

### MVP 1: 📷 Muzzle Mapper (Camera + Upload)
**Image Capture & Pre-processing with AI Validation**

- **Dual Mode**: Camera capture OR file upload
- Camera interface with guide box overlay
- Automatic grayscale conversion
- CLAHE contrast enhancement
- **AI Validation**: LBP texture analysis, symmetry detection, edge density, contrast
- Real-time confidence scoring
- 28-dimensional feature vector extraction

**Tech Demo**: Shows understanding of image processing and AI validation

**Access**: Navigate to `/mapper` or click "Muzzle Mapper" from enrollment

---

### MVP 2: 📝 Offline Enrollment
**Database Creation with LocalStorage**

- Registration form with owner and cattle details
- Kenyan breeds (Boran, Zebu, Ankole, Sahiwal)
- Kenyan counties (Turkana, Pokot, Kajiado, Narok, etc.)
- Muzzle print capture integration
- Local storage using localStorage API
- **NO INTERNET REQUIRED**

**Tech Demo**: Proves the app works in remote areas

**Access**: Navigate to `/enroll`

---

### MVP 3: 🔍 AI Matcher
**Identification System with Confidence Scoring**

- Capture or upload muzzle print of found/stolen cattle
- AI validates it's a muzzle print (≥45% confidence)
- Compare against enrolled database using cosine similarity
- Return match percentages with confidence adjustment
- Rank results by score

**Algorithm**:
1. Validate muzzle (LBP + Symmetry + Edge Density + Contrast)
2. Extract 28-D feature vector
3. Calculate cosine similarity
4. Apply confidence boost for valid muzzles (≥60%)
5. Return top matches with percentage scores

**Tech Demo**: The "Magic Moment" - scan/print and identify the cow!

**Access**: Navigate to `/matcher`

---

### MVP 4: 📜 Digital Title Deed
**Certificate Generation with PDF Export**

- Unique certificate ID for each animal (UFUGAJI-2026-XXX)
- Professional PDF certificate with:
  - Owner details
  - Cattle information (breed, age, location)
  - Biometric ID status
  - Feature vector preview
  - Official seal and signature
- Download as PDF or print
- Legal proof of ownership

**Tech Demo**: Addresses legal aspect of ownership disputes

**Access**: Navigate to `/cattle` and click "Certificate"

---

## 🛠️ Technical Stack

### Frontend
- **React 19** with Vite (Latest stable)
- **React Router v7** for navigation
- **html2canvas** for certificate generation
- **jsPDF** for PDF creation

### Image Processing (Simulated OpenCV)
- **Grayscale Conversion**: Luminosity method (0.299R + 0.587G + 0.114B)
- **Gaussian Blur**: 3x3 kernel for noise reduction
- **CLAHE**: Adaptive histogram equalization (8x8 tiles, clip limit 2.0)
- **Feature Extraction**: Multi-method analysis (28 dimensions)

### AI Validation
- **Local Binary Patterns (LBP)**: Texture analysis
- **Symmetry Detection**: Bilateral correlation
- **Edge Density**: Sobel operators (15-40% ideal)
- **Contrast Distribution**: Standard deviation analysis (40-80 ideal)

### Database
- **localStorage** for offline data persistence
- **JSON** data structure
- Sample data pre-loaded from `db.json`

### Algorithms
- **Cosine Similarity**: Match scoring
- **28-Dimensional Feature Vectors**: Grid mean (16) + Edge density (4) + Texture variance (4) + Radial patterns (4)
- **Confidence-Adjusted Matching**: Boost for validated muzzles

### DevOps (Silicon Valley Standards)
- **GitHub Actions**: CI/CD pipeline
- **Netlify**: Production deployment
- **ESLint + Prettier**: Code quality
- **Husky**: Pre-commit hooks
- **Security Scanning**: npm audit automation

---

## 🔬 Technical Implementation Details

### Image Processing Pipeline

```
RGB Image → AI Validation → Grayscale → Gaussian Blur → CLAHE → Feature Extraction (28-D)
```

#### 1. AI Muzzle Validation (NEW)
- **Local Binary Patterns (LBP)**: Analyzes micro-texture patterns unique to muzzle ridges
- **Symmetry Analysis**: Bovine muzzles exhibit bilateral symmetry
- **Edge Density**: Muzzle prints have characteristic ridge patterns (15-40% density)
- **Contrast Distribution**: Validates proper lighting (40-80 std dev ideal)
- **Confidence Score**: Combined weighted score (≥45% = valid muzzle)

#### 2. Grayscale Conversion
```javascript
gray = 0.299*R + 0.587*G + 0.114*B
```

#### 3. Gaussian Blur (Noise Reduction)
- 3x3 kernel convolution
- Reduces high-frequency noise

#### 4. CLAHE (Contrast Enhancement)
- 8x8 tile grid
- Clip limit: 2.0
- Enhances muzzle ridge visibility

#### 5. Feature Extraction (28 dimensions)
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
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions CI/CD
├── .husky/
│   └── pre-commit             # Pre-commit hooks
├── public/
│   └── db.json                # Sample cattle data
├── src/
│   ├── pages/
│   │   ├── Home.jsx           # Landing page
│   │   ├── MuzzleMapper.jsx   # MVP 1 (Camera + Upload)
│   │   ├── Enroll.jsx         # MVP 2
│   │   ├── Matcher.jsx        # MVP 3
│   │   ├── CattleList.jsx     # Registry view
│   │   └── Certificate.jsx    # MVP 4
│   ├── utils/
│   │   ├── database.js        # LocalStorage operations
│   │   └── imageProcessing.js # AI algorithms
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── .eslintrc.json             # ESLint configuration
├── .prettierrc                # Prettier configuration
├── netlify.toml               # Netlify configuration
├── package.json
└── README.md
```

---

## 🎨 Design Features

### Kenyan Context
- **Color Scheme**: Kenyan flag colors (black, red, green) + accent gold
- **Locations**: Turkana, West Pokot, Kajiado, Narok, Samburu, Isiolo, Marsabit, Wajir, Garissa, Mandera
- **Breeds**: Boran, Zebu, Ankole, Aberdeen Angus, Hereford, Charolais, Limousin, Simmental, Sahiwal, Gyr
- **Language**: Swahili-inspired name "Ufugaji" (Livestock Keeping)
- **School Branding**: Edmund Rice Catholic Education Center

### UI/UX
- Responsive design (mobile-first)
- Offline-first architecture
- Clear visual feedback
- Professional certificate design
- Unified camera/upload interface
- Real-time validation scores

---

## 🎯 Demo Instructions for Judges

### Setup (Before Presentation)
1. Open the application in a browser
2. Ensure camera permissions are available (or use upload)
3. Have 3 printed photos of different cow muzzle prints ready ("Dummy Cows")

### Live Demo Flow

#### Step 1: Show the Problem (1 minute)
- Navigate to Home page
- Explain cattle rustling problem in ASAL regions
- Point out why current methods fail (ear tags, branding)

#### Step 2: Enroll Test Cattle (2 minutes)
- Go to "Enroll" page
- Register "Cow A" with sample data:
  - Name: "Kamau's Pride"
  - Owner: "John Kamau"
  - Breed: Boran
  - Location: Kajiado
- Use "Upload Image" OR "Camera" to capture muzzle
- Show AI validation scores
- Click "Enroll Cattle"
- Show the generated certificate ID

#### Step 3: Test the Matcher (3 minutes) ⭐ **Key Moment**
- Go to "Matcher" page
- Explain the AI algorithm (LBP, symmetry, edge density, contrast)
- **Upload or scan** Cow A's muzzle
- Show validation confidence score
- Show match results: "Match Found: 92% - Owner: John Kamau"
- **Important**: Upload Cow B - show it does NOT match Cow A

#### Step 4: Generate Certificate (1 minute)
- Go to "Registry" page
- Click "Certificate" on enrolled cow
- Click "Download PDF"
- Show the professional certificate with:
  - Certificate ID
  - Owner details
  - Biometric status
  - Feature vector

#### Step 5: Offline Capability (1 minute)
- Turn off WiFi/data
- Show app still works
- Demonstrate local storage

#### Step 6: CI/CD Demo (30 seconds)
- Show GitHub Actions workflow
- Explain automated testing and deployment
- Mention Silicon Valley standards

---

## 🚀 Deployment

### Production URL
**https://ksefufugajibioid.netlify.app**

### Deploy Commands

```bash
# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod
```

### CI/CD Pipeline
- Automated on every push to `main`
- Runs: ESLint → Build → Security Scan → Deploy
- Configuration: `.github/workflows/ci-cd.yml`

See [`CICD_GUIDE.md`](./CICD_GUIDE.md) for detailed setup.

---

## 📊 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

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

## 🔒 Security & Code Quality

### ESLint Rules
- React Hooks rules enforced
- Import order standardized
- No unused variables
- No console.log in production

### Prettier Configuration
- Single quotes
- 100 character line width
- 2 space indentation
- Semicolons required

### Pre-commit Hooks (Husky)
- Auto-fix linting issues
- Auto-format code
- Ensures consistent code quality

### Security Scanning
- Automated `npm audit` on every build
- Dependency vulnerability checks
- Automatic fixes for moderate issues

---

## 🏅 Competition Talking Points

### Innovation
- "While others build generic inventory apps, we're solving a specific violent problem affecting millions of Kenyans"
- "Muzzle prints are unalterable - unlike ear tags that thieves cut off"
- "Dual camera/upload interface for maximum flexibility"

### Technical Depth
- "We implemented a CNN-inspired feature extraction pipeline with 28-dimensional feature vectors"
- "Our CLAHE implementation enhances ridge visibility for accurate matching"
- "**Cow-specific validation**: Uses LBP texture, symmetry, edge density, and contrast analysis"
- "Multi-stage validation ensures only valid muzzle prints are enrolled and matched"

### Impact
- "8 million+ cattle in ASAL regions worth billions of shillings"
- "Can reduce cattle rustling incidents by providing irrefutable ownership proof"
- "Works offline in remote areas like Turkana and Pokot"

### Scalability
- "Future: Cloud synchronization when internet available"
- "Future: Integration with government livestock databases"
- "Future: Mobile app for Android using TensorFlow Lite"

### Silicon Valley Standards
- "CI/CD pipeline with automated testing and deployment"
- "Code quality enforcement with ESLint and Prettier"
- "Pre-commit hooks for consistent code standards"
- "Security scanning for dependency vulnerabilities"

---

## 📞 Quick Reference

| Item | Value |
|------|-------|
| **Project Name** | Ufugaji-BioID |
| **School** | Edmund Rice Catholic Education Center |
| **Category** | Computer Science - AI & Computer Systems |
| **Competition** | KSEF 2026 |
| **GitHub** | https://github.com/Vinrenatus/ufugaji-bioid |
| **Live Site** | https://ksefufugajibioid.netlify.app |
| **Node Version** | 18+ |

---

## 📚 Additional Documentation

- [`CICD_GUIDE.md`](./CICD_GUIDE.md) - CI/CD setup and configuration
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Deployment instructions
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Contribution guidelines

---

## 🙏 Acknowledgments

- **Kenya Science and Engineering Fair 2026**
- **Edmund Rice Catholic Education Center**
- **OpenCV community** for image processing concepts
- **React community** for excellent documentation

---

## 📄 License

This project is created for KSEF 2026 competition. Educational use permitted with attribution.

---

*"Securing Kenya's Livestock, One Muzzle Print at a Time"* 🐄🇰🇪

**Edmund Rice Catholic Education Center | KSEF 2026**
