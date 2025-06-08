import React, { useState, useEffect } from 'react';
import MultipleChoiceQuestion from '../components/MultipleChoiceQuestion';
import ShortAnswerQuestion from '../components/ShortAnswerQuestion';
import TrueFalseQuestion from '../components/TrueFalseQuestion';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import vocabularyAPI from '../services/vocabularyAPI';
import './Quiz.css';

const Quiz = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const appState = useAppState();
  const dispatch = useAppDispatch();

  // Generate quiz questions from vocabulary API
  useEffect(() => {
    const generateQuizQuestions = async () => {
      try {
        setIsLoading(true);
        
        // Get quiz words based on user's difficulty preference
        const userDifficulty = appState.user.preferences.difficulty;
        const quizWords = await vocabularyAPI.getQuizWords(5, userDifficulty);
        
        if (quizWords.length === 0) {
          throw new Error('No words available for quiz');
        }

        const generatedQuestions = [];

        for (let i = 0; i < quizWords.length; i++) {
          const word = quizWords[i];
          const questionType = getRandomQuestionType();

          switch (questionType) {
            case 'multiple-choice':
              generatedQuestions.push(await generateMultipleChoiceQuestion(word));
              break;
            case 'true-false':
              generatedQuestions.push(generateTrueFalseQuestion(word));
              break;
            case 'short-answer':
              generatedQuestions.push(generateShortAnswerQuestion(word));
              break;
            default:
              generatedQuestions.push(await generateMultipleChoiceQuestion(word));
          }
        }

        setQuestions(generatedQuestions);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    generateQuizQuestions();
  }, [appState.user.preferences.difficulty]);

  const getRandomQuestionType = () => {
    const types = ['multiple-choice', 'true-false', 'short-answer'];
    return types[Math.floor(Math.random() * types.length)];
  };

  const generateMultipleChoiceQuestion = async (word) => {
    // Get related words for wrong answers
    const relatedWords = await vocabularyAPI.getRelatedWords(word.id, 3);
    const correctDefinition = word.definitions[0]?.definition || 'No definition available';
    
    const options = [correctDefinition];
    
    // Add wrong answers from related words
    relatedWords.forEach(relatedWord => {
      if (options.length < 4 && relatedWord.definitions[0]) {
        options.push(relatedWord.definitions[0].definition);
      }
    });
    
    // If we don't have enough options, add generic wrong answers
    const genericWrongAnswers = [
      'A type of mathematical equation',
      'A scientific measurement tool',
      'A historical period in ancient Rome',
      'A genre of classical music'
    ];
    
    while (options.length < 4) {
      const wrongAnswer = genericWrongAnswers[Math.floor(Math.random() * genericWrongAnswers.length)];
      if (!options.includes(wrongAnswer)) {
        options.push(wrongAnswer);
      }
    }

    // Shuffle options
    const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
    const correctAnswerIndex = shuffledOptions.indexOf(correctDefinition);

    return {
      type: 'multiple-choice',
      question: `What does the word "${word.word}" mean?`,
      options: shuffledOptions,
      correctAnswer: correctAnswerIndex,
      word: word.word,
      wordData: word
    };
  };

  const generateTrueFalseQuestion = (word) => {
    const correctDefinition = word.definitions[0]?.definition || 'No definition available';
    const isTrue = Math.random() > 0.5;
    
    let questionText;
    let correctAnswer;

    if (isTrue) {
      questionText = `The word "${word.word}" means: ${correctDefinition}`;
      correctAnswer = true;
    } else {
      // Create a false statement
      const falseStatements = [
        `The word "${word.word}" means: A type of ancient weapon used in medieval times.`,
        `The word "${word.word}" means: A mathematical formula for calculating area.`,
        `The word "${word.word}" means: A style of architecture from the Renaissance period.`,
        `The word "${word.word}" means: A cooking technique originating from France.`
      ];
      questionText = falseStatements[Math.floor(Math.random() * falseStatements.length)];
      correctAnswer = false;
    }

    return {
      type: 'true-false',
      question: questionText,
      correctAnswer: correctAnswer,
      explanation: `The correct definition of "${word.word}" is: ${correctDefinition}`,
      word: word.word,
      wordData: word
    };
  };

  const generateShortAnswerQuestion = (word) => {
    const definition = word.definitions[0]?.definition || 'No definition available';
    
    // Create variations of the word as acceptable answers
    const acceptableAnswers = [word.word.toLowerCase()];
    
    // Add synonyms if available
    if (word.definitions[0]?.synonyms) {
      acceptableAnswers.push(...word.definitions[0].synonyms.map(s => s.toLowerCase()));
    }

    return {
      type: 'short-answer',
      question: `What word means: "${definition}"?`,
      correctAnswers: acceptableAnswers,
      caseSensitive: false,
      word: word.word,
      wordData: word
    };
  };

  const handleAnswer = async (answerData) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Update score
    if (answerData.isCorrect) {
      setScore(score + 1);
      dispatch(actions.markWordKnown(currentQuestion.word));
      dispatch(actions.setNotification({
        type: 'success',
        message: `Correct! +1 point 🎉`
      }));
    } else {
      dispatch(actions.markWordUnknown(currentQuestion.word));
      dispatch(actions.setNotification({
        type: 'info',
        message: `Study this word: ${currentQuestion.word}`
      }));
    }

    // Update word progress in API
    if (currentQuestion.wordData) {
      try {
        await vocabularyAPI.updateWordProgress(currentQuestion.wordData.id, {
          studied: true,
          correctRate: answerData.isCorrect ? 1 : 0
        });
      } catch (error) {
        console.error('Error updating word progress:', error);
      }
    }

    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setQuizCompleted(true);
        dispatch(actions.updateProgress({
          todayProgress: appState.learning.todayProgress + 1
        }));
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);
    setIsLoading(true);
    // Re-generate questions
    window.location.reload();
  };

  const renderQuestion = () => {
    if (questions.length === 0) return null;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <MultipleChoiceQuestion
            question={currentQuestion.question}
            options={currentQuestion.options}
            correctAnswer={currentQuestion.correctAnswer}
            onAnswer={handleAnswer}
            timeLimit={30}
          />
        );
      
      case 'true-false':
        return (
          <TrueFalseQuestion
            question={currentQuestion.question}
            correctAnswer={currentQuestion.correctAnswer}
            explanation={currentQuestion.explanation}
            onAnswer={handleAnswer}
            timeLimit={20}
          />
        );
      
      case 'short-answer':
        return (
          <ShortAnswerQuestion
            question={currentQuestion.question}
            correctAnswers={currentQuestion.correctAnswers}
            caseSensitive={currentQuestion.caseSensitive}
            onAnswer={handleAnswer}
            timeLimit={30}
          />
        );
      
      default:
        return <div>Unknown question type</div>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="quiz-page">
        <div className="quiz-loading">
          <LoadingSpinner 
            size="large"
            text="Generating personalized quiz questions..."
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="quiz-page">
        <div className="quiz-error">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No questions available
  if (questions.length === 0) {
    return (
      <div className="quiz-page">
        <div className="quiz-error">
          <h2>No Quiz Questions Available</h2>
          <p>We couldn't generate quiz questions at this time. Please try again later.</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // Quiz completion screen
  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    let performanceMessage = '';
    let performanceIcon = '';

    if (percentage >= 90) {
      performanceMessage = 'Outstanding! You have excellent vocabulary knowledge!';
      performanceIcon = '🌟';
    } else if (percentage >= 70) {
      performanceMessage = 'Great job! Your vocabulary skills are strong!';
      performanceIcon = '🎉';
    } else if (percentage >= 50) {
      performanceMessage = 'Good effort! Keep practicing to improve!';
      performanceIcon = '💪';
    } else {
      performanceMessage = 'Keep studying! Practice makes perfect!';
      performanceIcon = '📚';
    }

    return (
      <div className="quiz-page">
        <div className="quiz-completed">
          <h1>{performanceIcon} Quiz Completed!</h1>
          <div className="final-score">
            <h2>Your Score: {score}/{questions.length}</h2>
            <p>Percentage: {percentage}%</p>
            <p className="performance-message">{performanceMessage}</p>
          </div>
          
          <div className="quiz-stats">
            <div className="stat-row">
              <span>Words learned today:</span>
              <span>{appState.learning.todayProgress}</span>
            </div>
            <div className="stat-row">
              <span>Total words learned:</span>
              <span>{appState.learning.totalWordsLearned}</span>
            </div>
            <div className="stat-row">
              <span>Known words:</span>
              <span>{appState.vocabulary.knownWords.length}</span>
            </div>
            <div className="stat-row">
              <span>Words to study:</span>
              <span>{appState.vocabulary.unknownWords.length}</span>
            </div>
          </div>
          
          <div className="quiz-actions">
            <Button variant="primary" onClick={resetQuiz}>
              Take Quiz Again
            </Button>
            <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
            <Button variant="info" onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz interface
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="quiz-page">
      <div className="quiz-header">
        <h1>Vocabulary Quiz</h1>
        <div className="quiz-progress">
          <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
          <p>Score: {score}/{currentQuestionIndex + (currentQuestionIndex > 0 ? 1 : 0)}</p>
        </div>
      </div>
      
      <div className="quiz-content">
        {renderQuestion()}
      </div>
      
      <div className="quiz-footer">
        <p>Question Type: {currentQuestion.type.replace('-', ' ').toUpperCase()}</p>
        <p>Word Difficulty: {currentQuestion.wordData?.difficulty?.toUpperCase() || 'UNKNOWN'}</p>
      </div>
    </div>
  );
};

export default Quiz;
