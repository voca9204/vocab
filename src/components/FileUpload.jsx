import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Upload, File, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import './FileUpload.css';

/**
 * FileUpload Component
 * 
 * A drag-and-drop file upload component with support for CSV, Excel, and JSON files.
 * Features:
 * - Drag and drop interface
 * - File type validation (CSV, Excel, JSON)
 * - File size validation (configurable, default 10MB)
 * - Progress tracking
 * - Error handling
 * - Multiple file selection
 */

const FileUpload = ({ 
  onFileSelect, 
  onFileRemove,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['.csv', '.xlsx', '.xls', '.json', '.pdf'],
  multiple = false,
  disabled = false,
  className = ''
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const fileInputRef = useRef(null);

  // Validate file type and size
  const validateFile = useCallback((file) => {
    const errors = [];
    
    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File size exceeds ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB limit`);
    }
    
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      errors.push(`File type ${fileExtension} is not supported. Accepted types: ${acceptedTypes.join(', ')}`);
    }
    
    return errors;
  }, [maxFileSize, acceptedTypes]);

  // Handle file selection
  const handleFileSelection = useCallback((files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = {};

    fileArray.forEach((file) => {
      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        errors[file.name] = fileErrors;
      } else {
        validFiles.push({
          file,
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          status: 'selected'
        });
      }
    });

    if (Object.keys(errors).length > 0) {
      setUploadErrors(prev => ({ ...prev, ...errors }));
      if (onUploadError) {
        onUploadError(errors);
      }
    }

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
      setSelectedFiles(newFiles);
      
      if (onFileSelect) {
        onFileSelect(validFiles);
      }
    }
  }, [validateFile, selectedFiles, multiple, onFileSelect, onUploadError]);

  // Handle drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (!disabled) {
      const files = e.dataTransfer.files;
      handleFileSelection(files);
    }
  }, [disabled, handleFileSelection]);

  // Handle file input change
  const handleInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelection]);

  // Remove file
  const removeFile = useCallback((fileId) => {
    const updatedFiles = selectedFiles.filter(f => f.id !== fileId);
    setSelectedFiles(updatedFiles);
    
    // Clean up progress and errors
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    
    setUploadErrors(prev => {
      const newErrors = { ...prev };
      const fileToRemove = selectedFiles.find(f => f.id === fileId);
      if (fileToRemove) {
        delete newErrors[fileToRemove.name];
      }
      return newErrors;
    });
    
    if (onFileRemove) {
      onFileRemove(fileId);
    }
  }, [selectedFiles, onFileRemove]);

  // Simulate upload progress (in real implementation, this would be handled by the upload service)
  const simulateUpload = useCallback((fileId) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        setSelectedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'completed' } : f
        ));
        
        if (onUploadComplete) {
          const file = selectedFiles.find(f => f.id === fileId);
          onUploadComplete(file);
        }
      } else {
        setUploadProgress(prev => ({ ...prev, [fileId]: Math.floor(progress) }));
        
        if (onUploadProgress) {
          onUploadProgress(fileId, Math.floor(progress));
        }
      }
    }, 200);
    
    return interval;
  }, [selectedFiles, onUploadProgress, onUploadComplete]);

  // Start upload for a file
  const startUpload = useCallback((fileId) => {
    setSelectedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'uploading' } : f
    ));
    simulateUpload(fileId);
  }, [simulateUpload]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'csv':
        return '📊';
      case 'xlsx':
      case 'xls':
        return '📗';
      case 'json':
        return '📄';
      case 'pdf':
        return '📕';
      default:
        return '📄';
    }
  };

  return (
    <div className={`file-upload-container ${className}`}>
      {/* Drag and Drop Area */}
      <div
        className={`file-upload-dropzone ${isDragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="file-upload-content">
          <Upload 
            className={`file-upload-icon ${isDragActive ? 'bounce' : ''}`} 
            size={48} 
          />
          <div className="file-upload-text">
            <h3>
              {isDragActive 
                ? 'Drop files here...' 
                : 'Drag & drop files here, or click to select'
              }
            </h3>
            <p>
              Supports {acceptedTypes.join(', ')} files up to {(maxFileSize / (1024 * 1024)).toFixed(1)}MB
            </p>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          style={{ display: 'none' }}
        />
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="file-upload-list">
          <h4>Selected Files</h4>
          {selectedFiles.map((fileData) => (
            <div key={fileData.id} className="file-upload-item">
              <div className="file-info">
                <span className="file-icon">{getFileIcon(fileData.name)}</span>
                <div className="file-details">
                  <span className="file-name">{fileData.name}</span>
                  <span className="file-size">{formatFileSize(fileData.size)}</span>
                </div>
              </div>
              
              <div className="file-actions">
                {fileData.status === 'selected' && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => startUpload(fileData.id)}
                    disabled={disabled}
                  >
                    Upload
                  </button>
                )}
                
                {fileData.status === 'uploading' && (
                  <div className="upload-progress">
                    <RefreshCw className="spin" size={16} />
                    <span>{uploadProgress[fileData.id] || 0}%</span>
                  </div>
                )}
                
                {fileData.status === 'completed' && (
                  <CheckCircle className="text-success" size={20} />
                )}
                
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => removeFile(fileData.id)}
                  disabled={disabled && fileData.status === 'uploading'}
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Progress Bar */}
              {fileData.status === 'uploading' && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress[fileData.id] || 0}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {Object.keys(uploadErrors).length > 0 && (
        <div className="file-upload-errors">
          <h4 className="error-title">
            <AlertCircle size={16} />
            Upload Errors
          </h4>
          {Object.entries(uploadErrors).map(([fileName, errors]) => (
            <div key={fileName} className="error-item">
              <strong>{fileName}:</strong>
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  onFileSelect: PropTypes.func,
  onFileRemove: PropTypes.func,
  onUploadProgress: PropTypes.func,
  onUploadComplete: PropTypes.func,
  onUploadError: PropTypes.func,
  maxFileSize: PropTypes.number,
  acceptedTypes: PropTypes.arrayOf(PropTypes.string),
  multiple: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default FileUpload;
