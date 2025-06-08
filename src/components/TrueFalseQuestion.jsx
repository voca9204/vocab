import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import './QuizQuestion.css';

const TrueFalseQuestion = ({
  question,
  correctAnswer, // true or false
  explanation,
  onAnswer,
  showResult = false,
  disabled = false,
  timeLimit,
  onTimeUp
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
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

  const handleAnswerClick = (answer) => {
    if (disabled || isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const isCorrect = answer === correctAnswer;
    
    if (onAnswer) {
      onAnswer({
        selectedAnswer: answer,
        correctAnswer,
        isCorrect,
        timeTaken: timeLimit ? timeLimit - timeLeft : null
      });
    }
  };

  const getOptionClass = (option) => {
    const baseClass = 'quiz-option';
    
    if (!showResult && !isAnswered) {
      return `${baseClass} ${selectedAnswer === option ? 'selected' : ''}`;
    }
    
    if (showResult || isAnswered) {
      if (option === correctAnswer) {
        return `${baseClass} correct`;
      } else if (option === selectedAnswer && option !== correctAnswer) {
        return `${baseClass} incorrect`;
      } else {
        return `${baseClass} ${selectedAnswer === option ? 'selected' : ''}`;
      }
    }
    
    return baseClass;
  };

  return (
    <div className="quiz-question true-false">
      {timeLimit && (
        <div className="timer">
          <span className={`time-left ${timeLeft <= 10 ? 'warning' : ''}`}>
            {timeLeft}s
          </span>
        </div>
      )}
      
      <h3 className="question-text">{question}</h3>
      
      <div className="options-container">
        <button
          className={getOptionClass(true)}
          onClick={() => handleAnswerClick(true)}
          disabled={disabled || isAnswered}
        >
          <span className="option-text">TRUE</span>
          {(showResult || isAnswered) && correctAnswer === true && (
            <span className="check-mark">✓</span>
          )}
          {(showResult || isAnswered) && selectedAnswer === true && correctAnswer !== true && (
            <span className="x-mark">✗</span>
          )}
        </button>
        
        <button
          className={getOptionClass(false)}
          onClick={() => handleAnswerClick(false)}
          disabled={disabled || isAnswered}
        >
          <span className="option-text">FALSE</span>
          {(showResult || isAnswered) && correctAnswer === false && (
            <span className="check-mark">✓</span>
          )}
          {(showResult || isAnswered) && selectedAnswer === false && correctAnswer !== false && (
            <span className="x-mark">✗</span>
          )}
        </button>
      </div>
      
      {(showResult || isAnswered) && (
        <div className="result-feedback">
          <p className={`feedback ${selectedAnswer === correctAnswer ? 'correct' : 'incorrect'}`}>
            {selectedAnswer === correctAnswer ? 
              '🎉 Correct! Well done!' : 
              `❌ Incorrect. The correct answer is ${correctAnswer ? 'TRUE' : 'FALSE'}.`
            }
          </p>
          {explanation && (
            <p className="explanation">
              <strong>Explanation:</strong> {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

TrueFalseQuestion.propTypes = {
  question: PropTypes.string.isRequired,
  correctAnswer: PropTypes.bool.isRequired,
  explanation: PropTypes.string,
  onAnswer: PropTypes.func,
  showResult: PropTypes.bool,
  disabled: PropTypes.bool,
  timeLimit: PropTypes.number,
  onTimeUp: PropTypes.func
};

export default TrueFalseQuestion;
