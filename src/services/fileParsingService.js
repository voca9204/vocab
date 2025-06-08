import * as pdfjsLib from 'pdfjs-dist';

/**
 * File Parsing Service
 * 
 * Handles parsing of different file formats for vocabulary imports:
 * - CSV files
 * - JSON files
 * - Excel files (basic support)
 * - PDF files (with OCR support)
 * 
 * Provides validation and data mapping functionality
 */

class FileParsingService {
  constructor() {
    this.supportedFormats = ['csv', 'json', 'xlsx', 'xls', 'pdf'];
    this.requiredFields = ['word', 'definition'];
    this.optionalFields = [
      'pronunciation', 
      'partOfSpeech', 
      'koreanTranslation', 
      'example', 
      'examples',
      'difficulty', 
      'category', 
      'categories',
      'translation'
    ];
    this.pdfWorkerInitialized = false;
    this.initializePDFWorker();
  }

  /**
   * PDF.js Worker 초기화
   */
  async initializePDFWorker() {
    if (this.pdfWorkerInitialized) return;
    
    try {
      // CDN에서 직접 Worker 로드 (안정적)
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.min.js';
      console.log('✅ PDF.js Worker initialized with CDN');
      this.pdfWorkerInitialized = true;
      
    } catch (error) {
      console.warn('⚠️ PDF.js Worker initialization failed:', error.message);
    }
  }

  /**
   * Parse uploaded file based on its format
   */
  async parseFile(file, options = {}) {
    try {
      const fileExtension = this.getFileExtension(file.name);
      
      let parsedData;
      
      switch (fileExtension) {
        case 'csv':
          const content = await this.readFileContent(file);
          parsedData = await this.parseCSV(content);
          break;
        case 'json':
          const jsonContent = await this.readFileContent(file);
          parsedData = await this.parseJSON(jsonContent);
          break;
        case 'xlsx':
        case 'xls':
          const excelContent = await this.readFileContent(file);
          parsedData = await this.parseExcel(excelContent, file);
          break;
        case 'pdf':
          parsedData = await this.parsePDF(file, options);
          break;
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      // Validate and normalize data
      const validatedData = this.validateAndNormalizeData(parsedData);
      
      return {
        success: true,
        data: validatedData,
        fileName: file.name,
        fileType: fileExtension,
        recordCount: validatedData.length,
        detectedColumns: this.getDetectedColumns(validatedData),
        sampleData: validatedData.slice(0, 5) // First 5 records for preview
      };
      
    } catch (error) {
      console.error('File parsing error:', error);
      return {
        success: false,
        error: error.message,
        fileName: file.name
      };
    }
  }

  /**
   * Read file content as text
   */
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      // For Excel files, read as array buffer
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file, 'UTF-8');
      }
    });
  }

  /**
   * Parse CSV content
   */
  async parseCSV(content) {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Parse header
      const headers = this.parseCSVLine(lines[0]);
      const data = [];

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length > 0) {
          const record = {};
          headers.forEach((header, index) => {
            const cleanHeader = header.trim().toLowerCase();
            record[cleanHeader] = values[index] ? values[index].trim() : '';
          });
          data.push(record);
        }
      }

      return data;
    } catch (error) {
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  }

  /**
   * Parse CSV line handling quoted values
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result.map(val => val.replace(/^"|"$/g, '')); // Remove surrounding quotes
  }

  /**
   * Parse JSON content
   */
  async parseJSON(content) {
    try {
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON must contain an array of vocabulary items');
      }
      
      return data;
    } catch (error) {
      throw new Error(`JSON parsing error: ${error.message}`);
    }
  }

  /**
   * Parse Excel content (basic implementation)
   * Note: This is a basic implementation. For full Excel support, 
   * we would need to add the xlsx library.
   */
  async parseExcel(content, file) {
    try {
      // For now, return an error suggesting CSV format
      // In the future, we can add proper Excel parsing with xlsx library
      throw new Error('Excel files are not fully supported yet. Please convert to CSV format and try again.');
      
      // TODO: Implement proper Excel parsing
      // This would require adding the xlsx library to package.json
      // import * as XLSX from 'xlsx';
      // const workbook = XLSX.read(content, { type: 'buffer' });
      // const sheetName = workbook.SheetNames[0];
      // const worksheet = workbook.Sheets[sheetName];
      // const jsonData = XLSX.utils.sheet_to_json(worksheet);
      // return jsonData;
      
    } catch (error) {
      throw new Error(`Excel parsing error: ${error.message}`);
    }
  }

  /**
   * Parse PDF content using PDF.js
   */
  async parsePDF(file, options = {}) {
    try {
      console.log('📄 Starting PDF parsing for vocabulary import...');
      
      // Worker 초기화 확인
      if (!this.pdfWorkerInitialized) {
        await this.initializePDFWorker();
      }
      
      const arrayBuffer = await file.arrayBuffer();
      console.log(`📊 File loaded: ${Math.round(arrayBuffer.byteLength / 1024)}KB`);
      
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false
      });
      
      const pdf = await loadingTask.promise;
      console.log(`📑 PDF loaded successfully. Pages: ${pdf.numPages}`);
      
      let fullText = '';
      
      // 모든 페이지에서 텍스트 추출
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .filter(item => item.str && item.str.trim())
            .map(item => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (pageText) {
            fullText += pageText + '\n';
          }
          
          page.cleanup();
          
          if (options.progressCallback) {
            options.progressCallback({
              stage: 'Extracting text from PDF',
              progress: (pageNum / pdf.numPages) * 100
            });
          }
          
        } catch (pageError) {
          console.warn(`⚠️ Error processing page ${pageNum}:`, pageError.message);
        }
      }
      
      await pdf.destroy();
      
      if (!fullText || fullText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF file');
      }
      
      console.log(`🎉 PDF extraction completed! Text length: ${fullText.length} characters`);
      
      // 텍스트를 어휘 형태로 변환
      const vocabularyData = this.convertTextToVocabulary(fullText, file.name);
      
      console.log(`✅ PDF parsing completed: ${vocabularyData.length} vocabulary items found`);
      
      return vocabularyData;
      
    } catch (error) {
      console.error('❌ PDF parsing failed:', error);
      throw new Error(`PDF parsing error: ${error.message}`);
    }
  }

  /**
   * Convert extracted text to vocabulary format
   * Tries to intelligently parse text into vocabulary items
   */
  convertTextToVocabulary(text, fileName) {
    const vocabularyItems = [];
    
    // Clean and split text into lines
    const lines = text
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    console.log(`🔍 Processing ${lines.length} lines from PDF...`);
    
    // Try different parsing strategies
    const strategies = [
      this.parseStructuredVocabulary.bind(this),
      this.parseDefinitionList.bind(this),
      this.parseWordList.bind(this),
      this.parseTabSeparated.bind(this),
      this.parseSemiColonSeparated.bind(this)
    ];
    
    for (const strategy of strategies) {
      try {
        const result = strategy(lines);
        if (result.length > 0) {
          console.log(`✅ Successfully parsed using strategy: ${strategy.name}`);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ Strategy ${strategy.name} failed:`, error.message);
      }
    }
    
    // If all strategies fail, create a simple word list
    console.log('🔄 Falling back to simple text extraction...');
    return this.fallbackTextExtraction(text, fileName);
  }

  /**
   * Parse structured vocabulary (word - definition format)
   */
  parseStructuredVocabulary(lines) {
    const vocabularyItems = [];
    const patterns = [
      /^(.+?)\s*[-–—]\s*(.+)$/, // word - definition
      /^(.+?)\s*:\s*(.+)$/, // word: definition
      /^(.+?)\s*\|\s*(.+)$/, // word | definition
      /^(.+?)\s*=\s*(.+)$/ // word = definition
    ];
    
    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const [, word, definition] = match;
          if (word.trim().length > 0 && definition.trim().length > 0) {
            vocabularyItems.push({
              word: word.trim().toLowerCase(),
              definition: definition.trim()
            });
            break;
          }
        }
      }
    }
    
    return vocabularyItems;
  }

  /**
   * Parse definition list format
   */
  parseDefinitionList(lines) {
    const vocabularyItems = [];
    let currentWord = null;
    
    for (const line of lines) {
      // Check if line looks like a word (short, no punctuation at end)
      if (line.length < 30 && !line.endsWith('.') && !line.includes(' ')) {
        currentWord = line.toLowerCase();
      } else if (currentWord && line.length > 10) {
        // This might be a definition
        vocabularyItems.push({
          word: currentWord,
          definition: line
        });
        currentWord = null;
      }
    }
    
    return vocabularyItems;
  }

  /**
   * Parse simple word list
   */
  parseWordList(lines) {
    const vocabularyItems = [];
    
    for (const line of lines) {
      // If line is a single word (no spaces, reasonable length)
      if (!line.includes(' ') && line.length > 2 && line.length < 25) {
        vocabularyItems.push({
          word: line.toLowerCase(),
          definition: `Definition for ${line}` // Placeholder definition
        });
      }
    }
    
    return vocabularyItems;
  }

  /**
   * Parse tab-separated format
   */
  parseTabSeparated(lines) {
    const vocabularyItems = [];
    
    for (const line of lines) {
      const parts = line.split('\t').map(part => part.trim());
      if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
        vocabularyItems.push({
          word: parts[0].toLowerCase(),
          definition: parts[1],
          pronunciation: parts[2] || '',
          koreanTranslation: parts[3] || ''
        });
      }
    }
    
    return vocabularyItems;
  }

  /**
   * Parse semicolon-separated format
   */
  parseSemiColonSeparated(lines) {
    const vocabularyItems = [];
    
    for (const line of lines) {
      const parts = line.split(';').map(part => part.trim());
      if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
        vocabularyItems.push({
          word: parts[0].toLowerCase(),
          definition: parts[1],
          example: parts[2] || ''
        });
      }
    }
    
    return vocabularyItems;
  }

  /**
   * Fallback text extraction when structured parsing fails
   */
  fallbackTextExtraction(text, fileName) {
    // Extract potential vocabulary words (longer than 3 characters, alphabetic)
    const words = text
      .match(/\b[a-zA-Z]{4,}\b/g)
      ?.filter(word => {
        const lower = word.toLowerCase();
        return lower.length > 3 && 
               lower.length < 20 && 
               !['this', 'that', 'with', 'from', 'they', 'were', 'been', 'have', 'will', 'would', 'could', 'should'].includes(lower);
      }) || [];
    
    // Remove duplicates and sort
    const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
    
    return uniqueWords.slice(0, 100).map(word => ({
      word: word,
      definition: `Definition for ${word} (extracted from ${fileName})`,
      source: 'pdf_extraction',
      requiresReview: true
    }));
  }

  /**
   * Validate and normalize parsed data
   */
  validateAndNormalizeData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Parsed data must be an array');
    }

    if (data.length === 0) {
      throw new Error('No data found in file');
    }

    const normalizedData = [];
    const errors = [];

    data.forEach((record, index) => {
      try {
        const normalized = this.normalizeRecord(record, index);
        if (normalized) {
          normalizedData.push(normalized);
        }
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    });

    if (errors.length > 0 && normalizedData.length === 0) {
      throw new Error(`Data validation failed:\n${errors.join('\n')}`);
    }

    if (errors.length > 0) {
      console.warn('Some rows had validation errors:', errors);
    }

    return normalizedData;
  }

  /**
   * Normalize a single record
   */
  normalizeRecord(record, index) {
    // Convert all keys to lowercase for consistency
    const normalizedRecord = {};
    Object.keys(record).forEach(key => {
      normalizedRecord[key.toLowerCase().trim()] = record[key];
    });

    // Find word field (try different variations)
    const word = this.findFieldValue(normalizedRecord, ['word', 'term', 'vocabulary', 'english']);
    if (!word || word.trim() === '') {
      throw new Error('Word field is required and cannot be empty');
    }

    // Find definition field
    const definition = this.findFieldValue(normalizedRecord, ['definition', 'meaning', 'def', 'description']);
    if (!definition || definition.trim() === '') {
      throw new Error('Definition field is required and cannot be empty');
    }

    // Build normalized vocabulary item
    const vocabularyItem = {
      word: word.trim().toLowerCase(),
      definitions: [{ definition: definition.trim() }],
      
      // Optional fields
      pronunciation: this.findFieldValue(normalizedRecord, ['pronunciation', 'phonetic', 'sound']) || '',
      partOfSpeech: this.findFieldValue(normalizedRecord, ['partofspeech', 'pos', 'type', 'part_of_speech']) || '',
      koreanTranslation: this.findFieldValue(normalizedRecord, ['korean', 'translation', 'korean_translation', 'kor']) || '',
      
      // Handle examples (can be single example or multiple)
      examples: this.parseExamples(normalizedRecord),
      
      // Difficulty and categories
      difficulty: this.normalizeDifficulty(this.findFieldValue(normalizedRecord, ['difficulty', 'level', 'hard'])),
      categories: this.parseCategories(normalizedRecord),
      
      // Custom fields for any additional data
      customFields: this.extractCustomFields(normalizedRecord)
    };

    return vocabularyItem;
  }

  /**
   * Find field value by trying multiple possible field names
   */
  findFieldValue(record, possibleNames) {
    for (const name of possibleNames) {
      if (record[name] !== undefined && record[name] !== null) {
        return record[name].toString();
      }
    }
    return null;
  }

  /**
   * Parse examples from various formats
   */
  parseExamples(record) {
    const examples = [];
    
    // Try single example field
    const example = this.findFieldValue(record, ['example', 'sentence', 'usage', 'sample']);
    if (example) {
      examples.push({ example: example.trim() });
    }
    
    // Try multiple example fields (example1, example2, etc.)
    for (let i = 1; i <= 5; i++) {
      const exampleField = this.findFieldValue(record, [`example${i}`, `sentence${i}`, `sample${i}`]);
      if (exampleField) {
        examples.push({ example: exampleField.trim() });
      }
    }
    
    // Try examples as comma-separated values
    const examplesField = this.findFieldValue(record, ['examples', 'sentences', 'usages']);
    if (examplesField && examples.length === 0) {
      const exampleList = examplesField.split(',').map(ex => ex.trim()).filter(ex => ex);
      exampleList.forEach(ex => examples.push({ example: ex }));
    }
    
    return examples;
  }

  /**
   * Normalize difficulty level
   */
  normalizeDifficulty(difficulty) {
    if (!difficulty) return 'medium';
    
    const normalized = difficulty.toLowerCase().trim();
    const validDifficulties = ['easy', 'medium', 'hard'];
    
    if (validDifficulties.includes(normalized)) {
      return normalized;
    }
    
    // Try to map common variations
    if (['1', 'beginner', 'simple', 'basic'].includes(normalized)) return 'easy';
    if (['2', 'intermediate', 'normal', 'average'].includes(normalized)) return 'medium';
    if (['3', 'advanced', 'difficult', 'complex', 'challenging'].includes(normalized)) return 'hard';
    
    return 'medium'; // Default
  }

  /**
   * Parse categories from various formats
   */
  parseCategories(record) {
    const categories = [];
    
    // Try category fields
    const category = this.findFieldValue(record, ['category', 'topic', 'subject', 'theme']);
    if (category) {
      const categoryList = category.split(',').map(cat => cat.trim()).filter(cat => cat);
      categories.push(...categoryList);
    }
    
    // Try categories field (comma-separated)
    const categoriesField = this.findFieldValue(record, ['categories', 'topics', 'subjects', 'tags']);
    if (categoriesField && categories.length === 0) {
      const categoryList = categoriesField.split(',').map(cat => cat.trim()).filter(cat => cat);
      categories.push(...categoryList);
    }
    
    return categories;
  }

  /**
   * Extract custom fields (fields not in standard vocabulary schema)
   */
  extractCustomFields(record) {
    const customFields = {};
    const standardFields = [
      'word', 'term', 'vocabulary', 'english',
      'definition', 'meaning', 'def', 'description',
      'pronunciation', 'phonetic', 'sound',
      'partofspeech', 'pos', 'type', 'part_of_speech',
      'korean', 'translation', 'korean_translation', 'kor',
      'example', 'sentence', 'usage', 'sample', 'examples', 'sentences', 'usages',
      'difficulty', 'level', 'hard',
      'category', 'topic', 'subject', 'theme', 'categories', 'topics', 'subjects', 'tags'
    ];
    
    Object.keys(record).forEach(key => {
      const normalizedKey = key.toLowerCase().trim();
      if (!standardFields.includes(normalizedKey) && 
          !normalizedKey.match(/^(example|sentence|sample)\d+$/)) {
        customFields[key] = record[key];
      }
    });
    
    return Object.keys(customFields).length > 0 ? customFields : {};
  }

  /**
   * Get detected columns from parsed data
   */
  getDetectedColumns(data) {
    if (data.length === 0) return [];
    
    const allKeys = new Set();
    data.forEach(record => {
      Object.keys(record).forEach(key => allKeys.add(key));
    });
    
    return Array.from(allKeys);
  }

  /**
   * Get file extension
   */
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  /**
   * Validate file format
   */
  isValidFormat(filename) {
    const extension = this.getFileExtension(filename);
    return this.supportedFormats.includes(extension);
  }

  /**
   * Get column mapping suggestions
   */
  getColumnMappingSuggestions(detectedColumns) {
    const mappings = {};
    
    // Word field mappings
    const wordFields = ['word', 'term', 'vocabulary', 'english'];
    const wordMatch = detectedColumns.find(col => 
      wordFields.some(field => col.toLowerCase().includes(field))
    );
    if (wordMatch) mappings.word = wordMatch;
    
    // Definition field mappings
    const definitionFields = ['definition', 'meaning', 'def', 'description'];
    const definitionMatch = detectedColumns.find(col => 
      definitionFields.some(field => col.toLowerCase().includes(field))
    );
    if (definitionMatch) mappings.definition = definitionMatch;
    
    // Other field mappings
    const otherMappings = {
      pronunciation: ['pronunciation', 'phonetic', 'sound'],
      partOfSpeech: ['partofspeech', 'pos', 'type', 'part_of_speech'],
      koreanTranslation: ['korean', 'translation', 'korean_translation', 'kor'],
      example: ['example', 'sentence', 'usage', 'sample'],
      difficulty: ['difficulty', 'level', 'hard'],
      category: ['category', 'topic', 'subject', 'theme']
    };
    
    Object.keys(otherMappings).forEach(field => {
      const match = detectedColumns.find(col => 
        otherMappings[field].some(pattern => col.toLowerCase().includes(pattern))
      );
      if (match) mappings[field] = match;
    });
    
    return mappings;
  }
}

// Create and export singleton instance
const fileParsingService = new FileParsingService();

export default fileParsingService;
