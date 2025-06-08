import React, { useState } from 'react';
import { useAppState } from '../contexts/AppContext';
import FileUpload from '../components/FileUpload';
import { FolderPlus, Database, Upload, Settings } from 'lucide-react';
import fileParsingService from '../services/fileParsingService';
import customVocabularyAPI from '../services/customVocabularyAPI';
import './CustomVocabulary.css';

/**
 * Custom Vocabulary Management Page
 * 
 * This page allows users to:
 * - Upload vocabulary files (CSV, Excel, JSON, PDF)
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
      // 모든 파일 타입을 fileParsingService.parseFile로 통합 처리
      console.log(`Processing file: ${file.name}`);
      
      const parseResult = await fileParsingService.parseFile(file.file, {
        progressCallback: (progress) => {
          console.log(`Parsing progress: ${progress.stage} - ${progress.progress}%`);
          setImportProgress(progress.progress);
        }
      });
      
      if (parseResult.success) {
        setParseResults({
          fileName: parseResult.fileName,
          totalWords: parseResult.recordCount,
          sampleWords: parseResult.sampleData.map(word => ({
            word: word.word,
            definition: word.definitions?.[0]?.definition || word.definition || 'No definition'
          })),
          detectedColumns: parseResult.detectedColumns,
          status: 'ready_for_import',
          fileType: parseResult.fileType,
          originalFile: file,
          parsedData: parseResult.data // Store full parsed data
        });
        
        setShowPreview(true);
        
      } else {
        console.error('File parsing failed:', parseResult.error);
        
        // 파일 타입별 에러 메시지 개선
        let userFriendlyError = parseResult.error;
        
        if (parseResult.fileName?.toLowerCase().endsWith('.pdf')) {
          userFriendlyError = `PDF 처리 중 문제가 발생했습니다: ${parseResult.error}
          
권장 해결 방법:
• CSV 파일로 변환하여 업로드 (강력 추천)
• Excel 파일(.xlsx)로 변환하여 업로드  
• Word 문서에서 텍스트를 복사하여 CSV로 저장
• 온라인 PDF-to-CSV 변환기 사용

PDF에서 텍스트를 복사할 수 있다면 직접 입력하거나 다른 형식으로 저장해주세요.`;
        }
        
        handleUploadError({ [file.name]: [userFriendlyError] });
        return;
      }
    } catch (error) {
      console.error('Error processing file:', error);
      handleUploadError({ [file.name]: [error.message] });
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
      const collectionName = parseResults.fileName.replace(/\.[^/.]+$/, '');
      
      // Create vocabulary collection
      const collection = await customVocabularyAPI.createCollection({
        name: collectionName,
        description: `Imported from ${parseResults.fileName}`,
        wordCount: parseResults.totalWords,
        userId: user.uid,
        createdAt: new Date(),
        tags: [parseResults.fileType]
      });

      console.log('Collection created:', collection.id);

      // Import vocabulary items
      const vocabularyItems = parseResults.parsedData.map(item => ({
        ...item,
        collectionId: collection.id,
        userId: user.uid,
        createdAt: new Date(),
        isCustom: true
      }));

      let imported = 0;
      const batchSize = 10;
      
      for (let i = 0; i < vocabularyItems.length; i += batchSize) {
        const batch = vocabularyItems.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(item => customVocabularyAPI.addVocabularyItem(item))
        );
        
        imported += batch.length;
        const progress = Math.round((imported / vocabularyItems.length) * 100);
        setImportProgress(progress);
        
        console.log(`Imported ${imported}/${vocabularyItems.length} items (${progress}%)`);
      }

      console.log('Import completed successfully');
      
      // Reset form
      setSelectedFiles([]);
      setParseResults(null);
      setShowPreview(false);
      setIsImporting(false);
      setImportProgress(0);
      
      alert(`Successfully imported ${vocabularyItems.length} vocabulary items!`);
      
    } catch (error) {
      console.error('Import failed:', error);
      setIsImporting(false);
      alert('Import failed: ' + error.message);
    }
  };

  return (
    <div className="custom-vocabulary">
      <div className="custom-vocabulary-container">
        <header className="page-header">
          <div className="header-content">
            <div className="header-title">
              <Database className="header-icon" />
              <div>
                <h1>Custom Vocabulary Management</h1>
                <p>Upload and manage your own vocabulary collections</p>
              </div>
            </div>
          </div>
        </header>

        {!showPreview ? (
          <>
            {/* File Upload Section */}
            <section className="upload-section">
              <div className="upload-container">
                <div className="upload-header">
                  <Upload className="upload-icon" />
                  <h2>Upload Vocabulary Files</h2>
                  <p>Support for CSV, Excel, JSON, and PDF files</p>
                </div>
                
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  onUploadProgress={handleUploadProgress}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  acceptedTypes={['.csv', '.xlsx', '.xls', '.json', '.pdf']}
                  maxFileSize={50 * 1024 * 1024} // 50MB for PDF support
                  multiple={false}
                  className="custom-upload"
                />
              </div>
            </section>

            {/* Quick Start Guide */}
            <section className="quick-start">
              <h3>Quick Start Guide</h3>
              <div className="guide-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Prepare Your File</h4>
                    <p>Create a CSV, Excel, JSON, or PDF file with your vocabulary words and definitions.</p>
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

            {/* File Format Examples */}
            <section className="format-examples">
              <h3>Supported File Formats</h3>
              <div className="format-grid">
                <div className="format-card">
                  <h4>CSV Format</h4>
                  <pre>{`word,definition,example
abandon,to leave behind,He decided to abandon the project
abstract,theoretical concept,The idea was too abstract`}</pre>
                </div>
                
                <div className="format-card">
                  <h4>JSON Format</h4>
                  <pre>{`[
  {
    "word": "abandon", 
    "definition": "to leave behind",
    "example": "He decided to abandon the project"
  }
]`}</pre>
                </div>

                <div className="format-card">
                  <h4>PDF Format</h4>
                  <p>Upload PDF files with vocabulary lists. Our system will automatically extract words and definitions using advanced OCR technology.</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Preview Section */
          <section className="preview-section">
            <div className="preview-container">
              <div className="preview-header">
                <h2>Preview Imported Data</h2>
                <p>Review the detected vocabulary items before importing</p>
              </div>

              <div className="preview-stats">
                <div className="stat">
                  <span className="stat-label">File:</span>
                  <span className="stat-value">{parseResults.fileName}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Words:</span>
                  <span className="stat-value">{parseResults.totalWords}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">File Type:</span>
                  <span className="stat-value">{parseResults.fileType.toUpperCase()}</span>
                </div>
              </div>

              <div className="preview-samples">
                <h3>Sample Words</h3>
                <div className="sample-grid">
                  {parseResults.sampleWords.map((word, index) => (
                    <div key={index} className="sample-card">
                      <div className="sample-word">{word.word}</div>
                      <div className="sample-definition">{word.definition}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="preview-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPreview(false);
                    setParseResults(null);
                  }}
                >
                  Back to Upload
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleImportToDatabase}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importing...' : 'Import to Database'}
                </button>
              </div>

              {isImporting && (
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
          </section>
        )}
      </div>
    </div>
  );
};

export default CustomVocabulary;
