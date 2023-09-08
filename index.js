if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json())
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Create a file model
const fileSchema = new mongoose.Schema({
  filename: String,
  path: String,
});

const File = mongoose.model('File', fileSchema);

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname)
    cb(null, path.basename(file.originalname, ext) + '-' + Date.now() + ext);
  },
});

const upload = multer({ storage });

// API to upload a file and store it in the database
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { filename, path } = req.file;
    const file = new File({ filename, path });
    await file.save();
    res.json({ message: 'File uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to get all files
app.get('/files', async (req, res) => {
  try {
    const files = await File.find();
    if (files == '') {
      return res.send('No files found');
    }
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to get one file by ID
app.get('/file', async (req, res) => {
  try {
    const file = await File.findById(req.query.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to delete a file by ID
app.delete('/file', async (req, res) => {
  try {
    const fileobject = await File.findById(req.query.id);
    fs.unlinkSync(fileobject.path);
    const file = await File.findByIdAndDelete(req.query.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
        return res.status(200).json({ data: 'File not found' });
      });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
