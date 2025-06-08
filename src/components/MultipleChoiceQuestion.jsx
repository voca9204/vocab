import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import './QuizQuestion.css';

const MultipleChoiceQuestion = ({
  question,
  options,
  correctAnswer,
  onAnswer,
  showResult = false,
  disabled = false,
  timeLimit,
  onTimeUp
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
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

  const handleOptionClick = (optionIndex) => {
    if (disabled || isAnswered) return;
    
    setSelectedOption(optionIndex);
  };

  const handleSubmit = () => {
    if (selectedOption === null || isAnswered) return;
    
    setIsAnswered(true);
    const isCorrect = selectedOption === correctAnswer;
    
    if (onAnswer) {
      onAnswer({
        selectedOption,
        correctAnswer,
        isCorrect,
        timeTaken: timeLimit ? timeLimit - timeLeft : null
      });
    }
  };

  const getOptionClass = (optionIndex) => {
    const baseClass = 'quiz-option';
    
    if (!showResult && !isAnswered) {
      return `${baseClass} ${selectedOption === optionIndex ? 'selected' : ''}`;
    }
    
    if (showResult || isAnswered) {
      if (optionIndex === correctAnswer) {
        return `${baseClass} correct`;
      } else if (optionIndex === selectedOption && optionIndex !== correctAnswer) {
        return `${baseClass} incorrect`;
      } else {
        return `${baseClass} ${selectedOption === optionIndex ? 'selected' : ''}`;
      }
    }
    
    return baseClass;
  };

  return (
    <div className="quiz-question multiple-choice">
      {timeLimit && (
        <div className="timer">
          <span className={`time-left ${timeLeft <= 10 ? 'warning' : ''}`}>
            {timeLeft}s
          </span>
        </div>
      )}
      
      <h3 className="question-text">{question}</h3>
      
      <div className="options-container">
        {options.map((option, index) => (
          <button
            key={index}
            className={getOptionClass(index)}
            onClick={() => handleOptionClick(index)}
            disabled={disabled || isAnswered}
          >
            <span className="option-letter">
              {String.fromCharCode(65 + index)}.
            </span>
            <span className="option-text">{option}</span>
            {(showResult || isAnswered) && index === correctAnswer && (
              <span className="check-mark">✓</span>
            )}
            {(showResult || isAnswered) && index === selectedOption && index !== correctAnswer && (
              <span className="x-mark">✗</span>
            )}
          </button>
        ))}
      </div>
      
      {!isAnswered && selectedOption !== null && (
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
          <p className={`feedback ${selectedOption === correctAnswer ? 'correct' : 'incorrect'}`}>
            {selectedOption === correctAnswer ? 
              '🎉 Correct! Well done!' : 
              `❌ Incorrect. The correct answer is ${String.fromCharCode(65 + correctAnswer)}.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

MultipleChoiceQuestion.propTypes = {
  question: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  correctAnswer: PropTypes.number.isRequired,
  onAnswer: PropTypes.func,
  showResult: PropTypes.bool,
  disabled: PropTypes.bool,
  timeLimit: PropTypes.number,
  onTimeUp: PropTypes.func
};

export default MultipleChoiceQuestion;
