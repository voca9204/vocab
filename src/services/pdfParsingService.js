import * as pdfjsLib from 'pdfjs-dist';

// PDF.js 기본 설정 사용 - worker 설정 없음
console.log('PDF.js loaded with default configuration');

/**
 * PDF 파싱 서비스
 * PDF 파일에서 텍스트를 추출하고 어휘 데이터로 변환
 */
class PDFParsingService {
  /**
   * PDF 파일에서 텍스트 추출
   * @param {File} file - PDF 파일
   * @returns {Promise<string>} 추출된 텍스트
   */
  async extractTextFromPDF(file) {
    try {
      console.log('Starting PDF text extraction for:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('File loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
      
      // 간단한 PDF 로드 설정
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer
      });
      
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
      
      let fullText = '';
      
      // 모든 페이지에서 텍스트 추출
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`Processing page ${pageNum}...`);
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .map(item => item.str)
            .join(' ');
          
          fullText += pageText + '\n';
          console.log(`Page ${pageNum} processed, text length: ${pageText.length}`);
        } catch (pageError) {
          console.warn(`Error processing page ${pageNum}:`, pageError);
          // 개별 페이지 에러는 무시하고 계속 진행
        }
      }
      
      console.log('PDF text extraction completed. Total text length:', fullText.length);
      return fullText;
      
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      
      // 더 구체적인 에러 메시지 제공
      let errorMessage = 'Failed to extract text from PDF.';
      
      if (error.message.includes('InvalidPDFException')) {
        errorMessage = 'The file appears to be corrupted or not a valid PDF.';
      } else if (error.message.includes('PasswordException')) {
        errorMessage = 'This PDF is password protected. Please provide an unprotected file.';
      } else if (error.message.includes('worker')) {
        errorMessage = 'PDF processing encountered an error. Trying alternative method...';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error while processing PDF. Please check your connection.';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * 추출된 텍스트에서 어휘 데이터 파싱
   * @param {string} text - PDF에서 추출된 텍스트
   * @returns {Array} 파싱된 어휘 데이터
   */
  parseVocabularyFromText(text) {
    const vocabularyList = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log(`Parsing vocabulary from ${lines.length} lines of text`);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines or lines that are too short
      if (trimmedLine.length < 5) continue;
      
      // 다양한 패턴으로 단어-정의 쌍 찾기
      const patterns = [
        // Pattern 1: "word - definition"
        /^([a-zA-Z]+)\s*[-–—]\s*(.+)$/,
        // Pattern 2: "word: definition"
        /^([a-zA-Z]+)\s*:\s*(.+)$/,
        // Pattern 3: "word (definition)"
        /^([a-zA-Z]+)\s*\(([^)]+)\)$/,
        // Pattern 4: "word definition" (첫 번째 단어가 영어 단어인 경우)
        /^([a-zA-Z]+)\s+(.{10,})$/,
        // Pattern 5: "WORD - definition" (대문자)
        /^([A-Z]+)\s*[-–—]\s*(.+)$/i,
        // Pattern 6: "word | definition"
        /^([a-zA-Z]+)\s*\|\s*(.+)$/,
        // Pattern 7: 숫자로 시작하는 목록 "1. word - definition"
        /^\d+\.\s*([a-zA-Z]+)\s*[-–—]\s*(.+)$/,
        // Pattern 8: 점으로 구분 "word. definition"
        /^([a-zA-Z]+)\.\s+(.{10,})$/,
      ];
      
      for (const pattern of patterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const word = match[1].toLowerCase().trim();
          const definition = match[2].trim();
          
          // 기본 검증: 단어가 너무 짧거나 길지 않은지, 정의가 의미있는 길이인지
          if (word.length >= 2 && word.length <= 30 && 
              definition.length >= 5 && definition.length <= 500 &&
              /^[a-zA-Z]+$/.test(word)) { // 단어는 영어 알파벳만
            
            vocabularyList.push({
              word: word,
              definitions: [{ definition: definition }],
              partOfSpeech: this.guessPartOfSpeech(definition),
              difficulty: this.guessDifficulty(word, definition),
              source: 'pdf_extraction',
              examples: [],
              pronunciation: '',
              koreanTranslation: '',
              categories: ['imported']
            });
            break; // 패턴이 매치되면 다음 라인으로
          }
        }
      }
    }
    
    console.log(`Parsed ${vocabularyList.length} vocabulary items`);
    return vocabularyList;
  }

  /**
   * 정의에서 품사 추측
   * @param {string} definition - 단어 정의
   * @returns {string} 추측된 품사
   */
  guessPartOfSpeech(definition) {
    const def = definition.toLowerCase();
    
    if (def.includes('adjective') || def.includes('adj.')) return 'adjective';
    if (def.includes('verb') || def.includes('v.')) return 'verb';
    if (def.includes('noun') || def.includes('n.')) return 'noun';
    if (def.includes('adverb') || def.includes('adv.')) return 'adverb';
    
    // 정의 패턴으로 품사 추측
    if (def.startsWith('to ')) return 'verb';
    if (def.includes('a person who') || def.includes('someone who') || def.includes('something that')) return 'noun';
    if (def.includes('having') || def.includes('characterized by') || def.includes('able to')) return 'adjective';
    if (def.includes('in a') && def.includes('manner')) return 'adverb';
    
    return '';
  }

  /**
   * 단어 난이도 추측
   * @param {string} word - 단어
   * @param {string} definition - 정의
   * @returns {string} 추측된 난이도
   */
  guessDifficulty(word, definition) {
    // 단어 길이 기반 난이도 추측
    if (word.length <= 4) return 'easy';
    if (word.length <= 7) return 'medium';
    return 'hard';
  }

  /**
   * PDF 파일 전체 처리 (텍스트 추출 + 어휘 파싱)
   * @param {File} file - PDF 파일
   * @returns {Promise<Object>} 파싱 결과
   */
  async processPDFFile(file) {
    try {
      console.log('Processing PDF file:', file.name);
      
      // 파일 유효성 검사
      if (!this.validatePDFFile(file)) {
        throw new Error('Invalid PDF file. Please ensure the file is a valid PDF.');
      }
      
      // 1. 텍스트 추출
      const extractedText = await this.extractTextFromPDF(file);
      
      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('No readable text found in PDF. The file might be image-only or corrupted.');
      }
      
      // 2. 어휘 데이터 파싱
      const vocabularyList = this.parseVocabularyFromText(extractedText);
      
      if (vocabularyList.length === 0) {
        console.warn('No vocabulary patterns found in PDF text');
        // 빈 결과도 성공으로 처리하되 경고 메시지 포함
      }
      
      return {
        success: true,
        fileName: file.name,
        extractedText: extractedText.substring(0, 1000), // 처음 1000자만 미리보기용
        fullTextLength: extractedText.length,
        vocabularyCount: vocabularyList.length,
        vocabularyList: vocabularyList,
        detectedColumns: ['word', 'definitions', 'partOfSpeech', 'difficulty'],
        sampleWords: vocabularyList.slice(0, 5), // 처음 5개만 샘플로
        parseMethod: 'pdf_text_extraction',
        warnings: vocabularyList.length === 0 ? ['No vocabulary patterns detected. Please ensure the PDF contains word-definition pairs.'] : []
      };
      
    } catch (error) {
      console.error('Error processing PDF file:', error);
      return {
        success: false,
        error: error.message,
        fileName: file.name,
        parseMethod: 'pdf_text_extraction'
      };
    }
  }

  /**
   * PDF 파일 검증
   * @param {File} file - 검증할 파일
   * @returns {boolean} 유효한 PDF 파일인지 여부
   */
  validatePDFFile(file) {
    // MIME 타입 확인
    if (file.type !== 'application/pdf') {
      console.warn('Invalid MIME type:', file.type);
      return false;
    }
    
    // 파일 확장자 확인
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'pdf') {
      console.warn('Invalid file extension:', extension);
      return false;
    }
    
    // 파일 크기 확인 (100MB 제한)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      console.warn('File too large:', file.size);
      return false;
    }
    
    return true;
  }
}

// 싱글톤 인스턴스 생성 및 export
const pdfParsingService = new PDFParsingService();

export default pdfParsingService;