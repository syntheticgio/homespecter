const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

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

// Appliance Schema
const applianceSchema = new mongoose.Schema({
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Appliance = mongoose.model('Appliance', applianceSchema);

// Routes

// Get all appliances
app.get('/api/appliances', async (req, res) => {
  try {
    const appliances = await Appliance.find().sort({ createdAt: -1 });
    res.json(appliances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single appliance
app.get('/api/appliances/:id', async (req, res) => {
  try {
    const appliance = await Appliance.findById(req.params.id);
    if (!appliance) {
      return res.status(404).json({ error: 'Appliance not found' });
    }
    res.json(appliance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create appliance
app.post('/api/appliances', upload.fields([
  { name: 'photos', maxCount: 10 },
  { name: 'manuals', maxCount: 5 }
]), async (req, res) => {
  try {
    const applianceData = {
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
      manuals: req.files.manuals ? req.files.manuals.map(f => f.filename) : []
    };

    const appliance = new Appliance(applianceData);
    await appliance.save();
    res.status(201).json(appliance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update appliance
app.put('/api/appliances/:id', upload.fields([
  { name: 'photos', maxCount: 10 },
  { name: 'manuals', maxCount: 5 }
]), async (req, res) => {
  try {
    const updateData = {
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
      updatedAt: Date.now()
    };

    if (req.files.photos) {
      updateData.photos = req.files.photos.map(f => f.filename);
    }
    if (req.files.manuals) {
      updateData.manuals = req.files.manuals.map(f => f.filename);
    }

    const appliance = await Appliance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!appliance) {
      return res.status(404).json({ error: 'Appliance not found' });
    }

    res.json(appliance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete appliance
app.delete('/api/appliances/:id', async (req, res) => {
  try {
    const appliance = await Appliance.findByIdAndDelete(req.params.id);
    if (!appliance) {
      return res.status(404).json({ error: 'Appliance not found' });
    }
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
