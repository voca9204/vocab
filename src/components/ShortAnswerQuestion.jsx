import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import './QuizQuestion.css';

const ShortAnswerQuestion = ({
  question,
  correctAnswers, // Array of acceptable answers
  onAnswer,
  showResult = false,
  disabled = false,
  placeholder = "Type your answer here...",
  caseSensitive = false,
  timeLimit,
  onTimeUp
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  // Timer effect
  React.useEffect(() => {
    if (timeLimit && timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleTimeUp();
    }
  }, [timeLeft, isAnswered, timeLimit]);

  const handleTimeUp = () => {
    setIsAnswered(true);
    if (onTimeUp) {
      onTimeUp();
    }
  };

  const checkAnswer = (answer) => {
    const processedAnswer = caseSensitive ? answer.trim() : answer.trim().toLowerCase();
    const processedCorrectAnswers = caseSensitive 
      ? correctAnswers.map(a => a.trim())
      : correctAnswers.map(a => a.trim().toLowerCase());
    
    return processedCorrectAnswers.includes(processedAnswer);
  };

  const handleSubmit = () => {
    if (!userAnswer.trim() || isAnswered) return;
    
    setIsAnswered(true);
    const isCorrect = checkAnswer(userAnswer);
    
    if (onAnswer) {
      onAnswer({
        userAnswer: userAnswer.trim(),
        correctAnswers,
        isCorrect,
        timeTaken: timeLimit ? timeLimit - timeLeft : null
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getInputClass = () => {
    let className = 'answer-input';
    
    if (showResult || isAnswered) {
      const isCorrect = checkAnswer(userAnswer);
      className += isCorrect ? ' correct' : ' incorrect';
    }
    
    return className;
  };

  return (
    <div className="quiz-question short-answer">
      {timeLimit && (
        <div className="timer">
          <span className={`time-left ${timeLeft <= 10 ? 'warning' : ''}`}>
            {timeLeft}s
          </span>
        </div>
      )}
      
      <h3 className="question-text">{question}</h3>
      
      <div className="answer-container">
        <input
          type="text"
          className={getInputClass()}
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isAnswered}
          autoFocus
        />
      </div>
      
      {!isAnswered && userAnswer.trim() && (
        <div className="submit-container">
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={disabled}
          >
            Submit Answer
          </Button>
        </div>
      )}
      
      {(showResult || isAnswered) && (
        <div className="result-feedback">
          <p className={`feedback ${checkAnswer(userAnswer) ? 'correct' : 'incorrect'}`}>
            {checkAnswer(userAnswer) ? 
              '🎉 Correct! Well done!' : 
              `❌ Incorrect. Correct answer${correctAnswers.length > 1 ? 's' : ''}: ${correctAnswers.join(', ')}`
            }
          </p>
        </div>
      )}
    </div>
  );
};

ShortAnswerQuestion.propTypes = {
  question: PropTypes.string.isRequired,
  correctAnswers: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAnswer: PropTypes.func,
  showResult: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  caseSensitive: PropTypes.bool,
  timeLimit: PropTypes.number,
  onTimeUp: PropTypes.func
};

export default ShortAnswerQuestion;
