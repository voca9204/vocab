import React, { useState } from 'react';
import { useAppState } from '../contexts/AppContext';
import FileUpload from '../components/FileUpload';
import { FolderPlus, Database, Upload, Settings } from 'lucide-react';
import pdfParsingService from '../services/pdfParsingService';
import fileParsingService from '../services/fileParsingService';
import customVocabularyAPI from '../services/customVocabularyAPI';
import './CustomVocabulary.css';

/**
 * Custom Vocabulary Management Page
 * 
 * This page allows users to:
 * - Upload vocabulary files (CSV, Excel, JSON)
 * - Manage their custom vocabulary collections
 * - Preview uploaded data before processing
 * - Configure import settings
 */

const CustomVocabulary = () => {
  const { user } = useAppState();
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [parseResults, setParseResults] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Handle file selection
  const handleFileSelect = (files) => {
    console.log('Files selected:', files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  // Handle file removal
  const handleFileRemove = (fileId) => {
    console.log('File removed:', fileId);
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Handle upload progress
  const handleUploadProgress = (fileId, progress) => {
    console.log(`Upload progress for ${fileId}: ${progress}%`);
    setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
  };

  // Handle upload completion
  const handleUploadComplete = async (file) => {
    console.log('Upload completed:', file);
    
    try {
      let parseResult;
      
      // 파일 타입에 따라 다른 파싱 로직 적용
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (fileExtension === 'pdf') {
        // PDF 파일 처리
        console.log('Processing PDF file...');
        parseResult = await pdfParsingService.processPDFFile(file.file);
        
        if (parseResult.success) {
          setParseResults({
            fileName: parseResult.fileName,
            totalWords: parseResult.vocabularyCount,
            sampleWords: parseResult.sampleWords.map(word => ({
              word: word.word,
              definition: word.definition
            })),
            detectedColumns: parseResult.detectedColumns,
            status: 'ready_for_import',
            fileType: 'pdf',
            extractedText: parseResult.extractedText,
            originalFile: file,
            parsedData: parseResult.sampleWords // Store full parsed data
          });
        } else {
          console.error('PDF parsing failed:', parseResult.error);
          handleUploadError({ [file.name]: [parseResult.error] });
          return;
        }
      } else {
        // CSV, Excel, JSON 파일 처리 (실제 파싱)
        console.log(`Processing ${fileExtension.toUpperCase()} file...`);
        parseResult = await fileParsingService.parseFile(file.file);
        
        if (parseResult.success) {
          setParseResults({
            fileName: parseResult.fileName,
            totalWords: parseResult.recordCount,
            sampleWords: parseResult.sampleData.map(word => ({
              word: word.word,
              definition: word.definitions[0]?.definition || 'No definition'
            })),
            detectedColumns: parseResult.detectedColumns,
            status: 'ready_for_import',
            fileType: parseResult.fileType,
            originalFile: file,
            parsedData: parseResult.data // Store full parsed data
          });
        } else {
          console.error('File parsing failed:', parseResult.error);
          handleUploadError({ [file.name]: [parseResult.error] });
          return;
        }
      }
      
      setShowPreview(true);
    } catch (error) {
      console.error('Error processing file:', error);
      handleUploadError({ [file.name]: ['Failed to process file: ' + error.message] });
    }
  };

  // Handle upload error
  const handleUploadError = (errors) => {
    console.error('Upload errors:', errors);
  };

  // Handle import to database
  const handleImportToDatabase = async () => {
    if (!parseResults || !user?.uid) {
      console.error('No parsed data or user not authenticated');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Create collection name from filename
      const collectionName = parseResults.fileName.replace(/\.[^/.]+$/, '') + ' Collection';
      
      // Create new collection
      console.log('Creating new collection...');
      const newCollection = await customVocabularyAPI.createCollection(user.uid, {
        name: collectionName,
        description: `Imported from ${parseResults.fileName}`,
        source: 'file_upload',
        originalFileName: parseResults.fileName,
        metadata: {
          fileType: parseResults.fileType,
          importDate: new Date().toISOString(),
          detectedColumns: parseResults.detectedColumns,
          totalWords: parseResults.totalWords
        }
      });

      console.log('Collection created:', newCollection);
      setImportProgress(25);

      // Import vocabularies in batches
      const batchSize = 50;
      const vocabularies = parseResults.parsedData;
      const totalBatches = Math.ceil(vocabularies.length / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, vocabularies.length);
        const batch = vocabularies.slice(startIndex, endIndex);

        console.log(`Importing batch ${i + 1}/${totalBatches} (${batch.length} items)...`);
        
        await customVocabularyAPI.addVocabulariesBatch(
          newCollection.id,
          user.uid,
          batch
        );

        // Update progress
        const progress = 25 + ((i + 1) / totalBatches) * 75;
        setImportProgress(Math.round(progress));
      }

      console.log('Import completed successfully!');
      setImportProgress(100);

      // Show success message and reset
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
        setShowPreview(false);
        setParseResults(null);
        setSelectedFiles([]);
        alert(`Successfully imported ${vocabularies.length} words to "${collectionName}"!`);
      }, 1000);

    } catch (error) {
      console.error('Import failed:', error);
      setIsImporting(false);
      setImportProgress(0);
      alert(`Import failed: ${error.message}`);
    }
  };

  return (
    <div className="custom-vocabulary-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <Database size={32} />
          </div>
          <div className="header-text">
            <h1>Custom Vocabulary</h1>
            <p>Upload and manage your own vocabulary collections</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {!user?.isAuthenticated ? (
          <div className="auth-required">
            <h2>Authentication Required</h2>
            <p>Please sign in to upload and manage your custom vocabulary collections.</p>
          </div>
        ) : (
          <>
            {/* Upload Section */}
            <section className="upload-section">
              <div className="section-header">
                <h2>
                  <Upload size={24} />
                  Upload Vocabulary Files
                </h2>
                <p>
                  Support for CSV, Excel (.xlsx, .xls), JSON, and PDF files. 
                  Maximum file size: 10MB per file.
                </p>
              </div>

              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                onUploadProgress={handleUploadProgress}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                multiple={true}
                className="vocabulary-file-upload"
              />
            </section>

            {/* File Format Guide */}
            <section className="format-guide">
              <h3>Supported File Formats</h3>
              <div className="format-examples">
                <div className="format-item">
                  <h4>📊 CSV Format</h4>
                  <pre>
{`word,definition,translation,example
eloquent,fluent in speaking,웅변의,"She gave an eloquent speech"
ubiquitous,present everywhere,편재하는,"Smartphones are ubiquitous"`}
                  </pre>
                </div>
                
                <div className="format-item">
                  <h4>📗 Excel Format</h4>
                  <p>
                    Create an Excel file with columns for word, definition, translation, 
                    examples, and any other custom fields you want to include.
                    <br />
                    <strong>Note:</strong> Excel files (.xlsx, .xls) are not fully supported yet. 
                    Please convert to CSV format for best results.
                  </p>
                </div>
                
                <div className="format-item">
                  <h4>📄 JSON Format</h4>
                  <pre>
{`[
  {
    "word": "eloquent",
    "definition": "fluent in speaking",
    "translation": "웅변의",
    "example": "She gave an eloquent speech"
  }
]`}
                  </pre>
                </div>
                
                <div className="format-item">
                  <h4>📕 PDF Format</h4>
                  <p>
                    Upload PDF files containing vocabulary lists. The system will extract text 
                    and attempt to identify word-definition pairs. For best results, use PDFs 
                    with clear formatting and structured vocabulary lists.
                  </p>
                  <div className="pdf-tips">
                    <strong>Tips for better PDF parsing:</strong>
                    <ul>
                      <li>Use clear, readable fonts</li>
                      <li>Structure: Word - Definition format</li>
                      <li>Avoid complex layouts or images</li>
                      <li>One word per line works best</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Preview Section */}
            {showPreview && parseResults && (
              <section className="preview-section">
                <h3>Import Preview</h3>
                <div className="preview-card">
                  <div className="preview-header">
                    <h4>{parseResults.fileName}</h4>
                    <span className="word-count">
                      {parseResults.totalWords} words detected
                    </span>
                  </div>
                  
                  <div className="preview-content">
                    <h5>Sample Words:</h5>
                    <div className="sample-words">
                      {parseResults.sampleWords.map((word, index) => (
                        <div key={index} className="sample-word">
                          <strong>{word.word}</strong>: {word.definition}
                        </div>
                      ))}
                    </div>
                    
                    {parseResults.fileType === 'pdf' && parseResults.extractedText && (
                      <>
                        <h5>Extracted Text Preview:</h5>
                        <div className="extracted-text-preview">
                          {parseResults.extractedText.substring(0, 200)}...
                        </div>
                      </>
                    )}
                    
                    <h5>Detected Columns:</h5>
                    <div className="detected-columns">
                      {parseResults.detectedColumns.map((column, index) => (
                        <span key={index} className="column-tag">
                          {column}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="preview-actions">
                    {!isImporting ? (
                      <>
                        <button 
                          className="btn btn-primary"
                          onClick={handleImportToDatabase}
                        >
                          <FolderPlus size={16} />
                          Import as New Collection
                        </button>
                        <button className="btn btn-outline">
                          <Settings size={16} />
                          Configure Mapping
                        </button>
                        <button 
                          className="btn btn-outline"
                          onClick={() => setShowPreview(false)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <div className="import-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${importProgress}%` }}
                          />
                        </div>
                        <p>Importing... {importProgress}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Quick Start Guide */}
            <section className="quick-start">
              <h3>Quick Start Guide</h3>
              <div className="guide-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Prepare Your File</h4>
                    <p>Create a CSV, Excel, or JSON file with your vocabulary words and definitions.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Upload & Preview</h4>
                    <p>Drag and drop your file above, then review the detected words and columns.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Import & Study</h4>
                    <p>Import your words into a collection and start studying with our quiz system.</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomVocabulary;
