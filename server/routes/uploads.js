import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  'https://rhtapruqmzlbtfetntlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJodGFwcnVxbXpsYnRmZXRudGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODIyNjgsImV4cCI6MjA3MDE1ODI2OH0.V8-VBM8NmrefAMQp4UASrPa7jzV-Qvy3_pLUNMayAQk'
);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'text/plain': '.txt'
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, GIF, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload single file
router.post('/single', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    const { category = 'general', description = '' } = req.body;

    // Save file info to database
    const { data: fileRecord, error } = await supabase
      .from('user_files')
      .insert({
        user_id: userId,
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        category: category,
        description: description,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('File record creation error:', error);
      // Clean up uploaded file if database insert fails
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Failed to save file information' });
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.original_name,
        size: fileRecord.file_size,
        mimeType: fileRecord.mime_type,
        category: fileRecord.category,
        description: fileRecord.description,
        uploadedAt: fileRecord.created_at
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload multiple files
router.post('/multiple', authenticateToken, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = req.user.userId;
    const { category = 'general', description = '' } = req.body;

    const fileRecords = [];
    const uploadedFiles = [];

    try {
      // Process each file
      for (const file of req.files) {
        const { data: fileRecord, error } = await supabase
          .from('user_files')
          .insert({
            user_id: userId,
            filename: file.filename,
            original_name: file.originalname,
            file_path: file.path,
            file_size: file.size,
            mime_type: file.mimetype,
            category: category,
            description: description,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        fileRecords.push(fileRecord);
        uploadedFiles.push({
          id: fileRecord.id,
          filename: fileRecord.filename,
          originalName: fileRecord.original_name,
          size: fileRecord.file_size,
          mimeType: fileRecord.mime_type,
          category: fileRecord.category,
          description: fileRecord.description,
          uploadedAt: fileRecord.created_at
        });
      }

      res.status(201).json({
        message: `${req.files.length} files uploaded successfully`,
        files: uploadedFiles
      });
    } catch (dbError) {
      console.error('Database error during multiple file upload:', dbError);
      // Clean up all uploaded files if database operations fail
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      res.status(500).json({ error: 'Failed to save file information' });
    }
  } catch (error) {
    console.error('Multiple file upload error:', error);
    // Clean up uploaded files if error occurs
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user files
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, category, search } = req.query;

    let query = supabase
      .from('user_files')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`original_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: files, error, count } = await query;

    if (error) {
      console.error('Files fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch files' });
    }

    const formattedFiles = files?.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.original_name,
      size: file.file_size,
      mimeType: file.mime_type,
      category: file.category,
      description: file.description,
      uploadedAt: file.created_at
    })) || [];

    res.json({
      files: formattedFiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Files fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download file
router.get('/download/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Get file info from database
    const { data: fileRecord, error } = await supabase
      .from('user_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only download their own files
      .single();

    if (error || !fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(fileRecord.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.original_name}"`);
    res.setHeader('Content-Type', fileRecord.mime_type);
    res.setHeader('Content-Length', fileRecord.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(fileRecord.file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete file
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Get file info from database
    const { data: fileRecord, error: fetchError } = await supabase
      .from('user_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only delete their own files
      .single();

    if (fetchError || !fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('user_files')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('File deletion error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete file record' });
    }

    // Delete file from disk
    if (fs.existsSync(fileRecord.file_path)) {
      fs.unlinkSync(fileRecord.file_path);
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update file metadata
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { category, description } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;

    const { data: updatedFile, error } = await supabase
      .from('user_files')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only update their own files
      .select()
      .single();

    if (error) {
      console.error('File update error:', error);
      return res.status(500).json({ error: 'Failed to update file' });
    }

    if (!updatedFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      message: 'File updated successfully',
      file: {
        id: updatedFile.id,
        filename: updatedFile.filename,
        originalName: updatedFile.original_name,
        size: updatedFile.file_size,
        mimeType: updatedFile.mime_type,
        category: updatedFile.category,
        description: updatedFile.description,
        uploadedAt: updatedFile.created_at,
        updatedAt: updatedFile.updated_at
      }
    });
  } catch (error) {
    console.error('File update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;