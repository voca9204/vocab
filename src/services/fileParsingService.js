/**
 * File Parsing Service
 * 
 * Handles parsing of different file formats for vocabulary imports:
 * - CSV files
 * - JSON files
 * - Excel files (basic support)
 * 
 * Provides validation and data mapping functionality
 */

class FileParsingService {
  constructor() {
    this.supportedFormats = ['csv', 'json', 'xlsx', 'xls'];
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
  }

  /**
   * Parse uploaded file based on its format
   */
  async parseFile(file) {
    try {
      const fileExtension = this.getFileExtension(file.name);
      const content = await this.readFileContent(file);
      
      let parsedData;
      
      switch (fileExtension) {
        case 'csv':
          parsedData = await this.parseCSV(content);
          break;
        case 'json':
          parsedData = await this.parseJSON(content);
          break;
        case 'xlsx':
        case 'xls':
          parsedData = await this.parseExcel(content, file);
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
