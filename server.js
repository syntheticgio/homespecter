const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/homespecter';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // For parsing form data
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-secret-key-that-should-be-in-env',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/', limiter);

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Appliance Schema
const applianceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  manufacturer: String,
  model: String,
  serialNumber: String,
  purchaseDate: Date,
  warrantyExpiry: Date,
  purchasePrice: Number,
  location: String,
  notes: String,
  photos: [String],
  manuals: [String],
  quickStartGuide: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Appliance = mongoose.model('Appliance', applianceSchema);

// Passport Local Strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Passport session management
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'You are not authenticated' });
}

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ error: 'Failed to login after registration' });
      res.status(201).json({ id: newUser.id, username: newUser.username });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

app.post('/api/auth/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: { id: req.user.id, username: req.user.username } });
  } else {
    res.json({ isAuthenticated: false });
  }
});


// --- APPLIANCE ROUTES (now protected) ---

// Get all appliances for the logged-in user
app.get('/api/appliances', isAuthenticated, async (req, res) => {
  try {
    const appliances = await Appliance.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(appliances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single appliance
app.get('/api/appliances/:id', isAuthenticated, async (req, res) => {
  try {
    const appliance = await Appliance.findOne({ _id: req.params.id, user: req.user.id });
    if (!appliance) {
      return res.status(404).json({ error: 'Appliance not found or you do not have permission' });
    }
    res.json(appliance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get distinct manufacturers for the logged-in user
app.get('/api/manufacturers', isAuthenticated, async (req, res) => {
  try {
    const manufacturers = await Appliance.distinct('manufacturer', { user: req.user.id });
    res.json(manufacturers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get distinct models for a given manufacturer for the logged-in user
app.get('/api/models', isAuthenticated, async (req, res) => {
  const { manufacturer } = req.query;
  if (!manufacturer) {
    return res.status(400).json({ error: 'Manufacturer query parameter is required' });
  }
  try {
    const models = await Appliance.distinct('model', { user: req.user.id, manufacturer: manufacturer });
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Create appliance
// (Same file fetching logic as before)
const ALLOWED_IMAGE_MIMES = ['image/png','image/jpeg','image/jpg','image/gif','image/webp'];
const ALLOWED_DOC_MIMES = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'];
const MAX_FETCH_BYTES = 10 * 1024 * 1024; // 10MB

function isPrivateHostname(hostname) {
  if (!hostname) return true;
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === '::1') return true;
  if (/^10\.|^127\.|^169\.254\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(lower)) return true;
  return false;
}

async function fetchAndSaveFile(fileUrl, allowedMimes, maxBytes) {
  try {
    const parsed = new URL(fileUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Invalid URL protocol');
    if (isPrivateHostname(parsed.hostname)) throw new Error('Fetching from private hostnames is disallowed');
  } catch (err) {
    throw new Error('Invalid URL');
  }

  try {
    const response = await axios.get(fileUrl, { responseType: 'stream', timeout: 15000 });
    const contentType = (response.headers['content-type'] || '').split(';')[0].trim();
    if (!allowedMimes.includes(contentType)) throw new Error(`Content type ${contentType} not allowed`);

    const contentLength = parseInt(response.headers['content-length'] || '0', 10);
    if (contentLength > 0 && contentLength > maxBytes) throw new Error('File too large');

    let ext = '';
    if (contentType === 'image/png') ext = '.png';
    else if (contentType === 'image/jpeg' || contentType === 'image/jpg') ext = '.jpg';
    else if (contentType === 'image/gif') ext = '.gif';
    else if (contentType === 'image/webp') ext = '.webp';
    else if (contentType === 'application/pdf') ext = '.pdf';
    else if (contentType === 'application/msword') ext = '.doc';
    else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ext = '.docx';
    else if (contentType === 'text/plain') ext = '.txt';
    else ext = path.extname(new URL(fileUrl).pathname) || '';

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filepath = path.join('uploads', filename);
    const writer = fs.createWriteStream(filepath);

    let downloaded = 0;
    await new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        downloaded += chunk.length;
        if (downloaded > maxBytes) {
          writer.destroy();
          response.data.destroy();
          fs.unlink(filepath, () => {});
          reject(new Error('File exceeds maximum allowed size'));
        }
      });
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });

    return filename;
  } catch (err) {
    throw err;
  }
}

app.post('/api/appliances', isAuthenticated, upload.fields([
  { name: 'photos', maxCount: 10 },
  { name: 'manuals', maxCount: 5 },
  { name: 'quickStartGuide', maxCount: 1 }
]), async (req, res) => {
  try {
    const applianceData = {
      user: req.user.id, // Associate with logged-in user
      name: req.body.name,
      category: req.body.category,
      manufacturer: req.body.manufacturer,
      model: req.body.model,
      serialNumber: req.body.serialNumber,
      purchaseDate: req.body.purchaseDate,
      warrantyExpiry: req.body.warrantyExpiry,
      purchasePrice: req.body.purchasePrice,
      location: req.body.location,
      notes: req.body.notes,
      photos: req.files.photos ? req.files.photos.map(f => f.filename) : [],
      manuals: req.files.manuals ? req.files.manuals.map(f => f.filename) : [],
      quickStartGuide: req.files.quickStartGuide && req.files.quickStartGuide[0] ? req.files.quickStartGuide[0].filename : undefined
    };

    try {
      if (req.body.photosUrls) {
        const urls = req.body.photosUrls.split(/\r?\n|,\s*/).map(u => u.trim()).filter(Boolean);
        for (const u of urls) {
          const saved = await fetchAndSaveFile(u, ALLOWED_IMAGE_MIMES, MAX_FETCH_BYTES);
          applianceData.photos.push(saved);
        }
      }
      if (req.body.manualsUrls) {
        const urls = req.body.manualsUrls.split(/\r?\n|,\s*/).map(u => u.trim()).filter(Boolean);
        for (const u of urls) {
          const saved = await fetchAndSaveFile(u, ALLOWED_DOC_MIMES, MAX_FETCH_BYTES);
          applianceData.manuals.push(saved);
        }
      }
      if (!applianceData.quickStartGuide && req.body.quickStartGuideUrl) {
        applianceData.quickStartGuide = await fetchAndSaveFile(req.body.quickStartGuideUrl.trim(), ALLOWED_DOC_MIMES, MAX_FETCH_BYTES);
      }
    } catch (err) {
      console.error('Error fetching remote file:', err.message || err);
      return res.status(400).json({ error: 'Failed to fetch and save a remote file: ' + err.message });
    }

    const appliance = new Appliance(applianceData);
    await appliance.save();
    res.status(201).json(appliance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update appliance
app.put('/api/appliances/:id', isAuthenticated, upload.fields([
  { name: 'photos', maxCount: 10 },
  { name: 'manuals', maxCount: 5 },
  { name: 'quickStartGuide', maxCount: 1 }
]), async (req, res) => {
  try {
    const existingAppliance = await Appliance.findOne({ _id: req.params.id, user: req.user.id });
    if (!existingAppliance) {
      return res.status(404).json({ error: 'Appliance not found or you do not have permission' });
    }

    const updateData = {};
    const allowedFields = ['name', 'category', 'manufacturer', 'model', 'serialNumber', 
                           'purchaseDate', 'warrantyExpiry', 'purchasePrice', 'location', 'notes'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    updateData.updatedAt = Date.now();
    updateData.photos = existingAppliance.photos ? [...existingAppliance.photos] : [];
    updateData.manuals = existingAppliance.manuals ? [...existingAppliance.manuals] : [];
    if (existingAppliance.quickStartGuide) updateData.quickStartGuide = existingAppliance.quickStartGuide;

    if (req.files && req.files.photos) {
      updateData.photos = updateData.photos.concat(req.files.photos.map(f => f.filename));
    }
    if (req.files && req.files.manuals) {
      updateData.manuals = updateData.manuals.concat(req.files.manuals.map(f => f.filename));
    }
    if (req.files && req.files.quickStartGuide && req.files.quickStartGuide[0]) {
      updateData.quickStartGuide = req.files.quickStartGuide[0].filename;
    }

    try {
      if (req.body.photosUrls) {
        const urls = req.body.photosUrls.split(/\r?\n|,\s*/).map(u => u.trim()).filter(Boolean);
        for (const u of urls) {
          updateData.photos.push(await fetchAndSaveFile(u, ALLOWED_IMAGE_MIMES, MAX_FETCH_BYTES));
        }
      }
      if (req.body.manualsUrls) {
        const urls = req.body.manualsUrls.split(/\r?\n|,\s*/).map(u => u.trim()).filter(Boolean);
        for (const u of urls) {
          updateData.manuals.push(await fetchAndSaveFile(u, ALLOWED_DOC_MIMES, MAX_FETCH_BYTES));
        }
      }
      if (!updateData.quickStartGuide && req.body.quickStartGuideUrl) {
        updateData.quickStartGuide = await fetchAndSaveFile(req.body.quickStartGuideUrl.trim(), ALLOWED_DOC_MIMES, MAX_FETCH_BYTES);
      }
    } catch (err) {
      console.error('Error fetching remote file in PUT:', err.message || err);
      return res.status(400).json({ error: 'Failed to fetch and save a remote file: ' + err.message });
    }

    const appliance = await Appliance.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json(appliance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete appliance
app.delete('/api/appliances/:id', isAuthenticated, async (req, res) => {
  try {
    const appliance = await Appliance.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!appliance) {
      return res.status(404).json({ error: 'Appliance not found or you do not have permission' });
    }
    // Note: This does not delete associated files from 'uploads'. A cleanup job would be needed.
    res.json({ message: 'Appliance deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
