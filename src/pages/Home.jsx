import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import VocabularyCard from '../components/VocabularyCard';
import AudioPlayer from '../components/AudioPlayer';
import FormDemo from '../components/FormDemo';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressBar from '../components/ProgressBar';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import vocabularyAPI from '../services/vocabularyAPI';
import './Home.css';

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentWordData, setCurrentWordData] = useState(null);
  const appState = useAppState();
  const dispatch = useAppDispatch();

  // Load a random word for display
  useEffect(() => {
    const loadRandomWord = async () => {
      try {
        const randomWords = await vocabularyAPI.getRandomWords(1, 'medium');
        if (randomWords.length > 0) {
          setCurrentWordData(randomWords[0]);
        }
      } catch (error) {
        console.error('Error loading random word:', error);
      }
    };

    loadRandomWord();
  }, []);

  const handleGetStarted = () => {
    setLoading(true);
    dispatch(actions.setLoading(true));
    
    setTimeout(() => {
      setLoading(false);
      dispatch(actions.setLoading(false));
      setShowModal(true);
    }, 2000);
  };

  const handleAudioPlay = (word) => {
    console.log(`Playing pronunciation for: ${word}`);
    dispatch(actions.setNotification({
      type: 'info',
      message: `Playing pronunciation for: ${word}`
    }));
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleMarkKnown = (word) => {
    dispatch(actions.markWordKnown(word));
    dispatch(actions.setNotification({
      type: 'success',
      message: `Great! "${word}" added to known words! 🎉`
    }));
    
    if (currentWordData && currentWordData.word === word) {
      vocabularyAPI.updateWordProgress(currentWordData.id, {
        studied: true,
        correctRate: 1
      });
    }
  };

  const handleMarkUnknown = (word) => {
    dispatch(actions.markWordUnknown(word));
    dispatch(actions.setNotification({
      type: 'info',
      message: `"${word}" added to study list 📚`
    }));
    
    if (currentWordData && currentWordData.word === word) {
      vocabularyAPI.updateWordProgress(currentWordData.id, {
        studied: true,
        correctRate: 0
      });
    }
  };

  const loadNewWord = async () => {
    try {
      const randomWords = await vocabularyAPI.getRandomWords(1);
      if (randomWords.length > 0) {
        setCurrentWordData(randomWords[0]);
      }
    } catch (error) {
      console.error('Error loading new word:', error);
    }
  };

  const formatWordForCard = (wordData) => {
    if (!wordData) return null;
    
    return {
      word: wordData.word,
      pronunciation: wordData.pronunciation,
      definition: wordData.definitions[0]?.definition || 'No definition available',
      example: wordData.examples[0]?.sentence || 'No example available',
      difficulty: wordData.difficulty
    };
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Vocabulary Learning App</h1>
        <p>Master SAT vocabulary with our comprehensive learning platform</p>
        
        {/* Progress Demo */}
        <div className="progress-demo">
          <h3>Your Progress</h3>
          <ProgressBar 
            value={appState.learning.totalWordsLearned} 
            max={500} 
            label="Words Learned"
            animated={true}
          />
          <div className="progress-stats">
            <p>Today: {appState.learning.todayProgress}/{appState.learning.dailyGoal}</p>
            <p>Level: {appState.learning.currentLevel}</p>
          </div>
        </div>

        {/* Live Vocabulary Card */}
        <div className="sample-card">
          <h3>Try Our Interactive Cards</h3>
          {currentWordData ? (
            <VocabularyCard
              {...formatWordForCard(currentWordData)}
              onAudioPlay={handleAudioPlay}
              onMarkKnown={handleMarkKnown}
              onMarkUnknown={handleMarkUnknown}
            />
          ) : (
            <LoadingSpinner text="Loading vocabulary word..." />
          )}
          <div className="word-actions">
            <Button variant="secondary" size="small" onClick={loadNewWord}>
              Try Another Word
            </Button>
          </div>
        </div>

        <div className="sample-card">
          <h3>🔊 Advanced Audio Player</h3>
          <p>Experience our full-featured pronunciation system with TTS support, playback controls, and interactive waveforms.</p>
          {currentWordData && (
            <AudioPlayer
              word={currentWordData.word}
              showControls={true}
              showWaveform={true}
              onPlay={() => console.log(`Playing: ${currentWordData.word}`)}
              onPause={() => console.log(`Paused: ${currentWordData.word}`)}
              onEnd={() => console.log(`Finished: ${currentWordData.word}`)}
            />
          )}
        </div>

        <div className="sample-card">
          <h3>📝 Complete Form System</h3>
          <p>Explore our comprehensive form components with validation, accessibility, and responsive design.</p>
          <FormDemo />
        </div>

        <div className="features-preview">
          <div className="feature-card">
            <h3>📚 {appState.vocabulary.totalWords || '3000+'}+ Words</h3>
            <p>Comprehensive SAT vocabulary database</p>
          </div>
          <div className="feature-card">
            <h3>🎯 Personalized Learning</h3>
            <p>Adaptive learning paths based on your progress</p>
          </div>
          <div className="feature-card">
            <h3>📱 Offline Support</h3>
            <p>Study anywhere, even without internet</p>
          </div>
        </div>
        
        <div className="cta-buttons">
          <Button 
            variant="primary" 
            size="large"
            loading={loading}
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
          <Button variant="secondary" size="large">
            Browse Vocabulary
          </Button>
        </div>

        {/* Learning Stats */}
        <div className="learning-stats">
          <div className="stat">
            <span className="stat-number">{appState.vocabulary.knownWords.length}</span>
            <span className="stat-label">Words Known</span>
          </div>
          <div className="stat">
            <span className="stat-number">{appState.vocabulary.unknownWords.length}</span>
            <span className="stat-label">To Study</span>
          </div>
          <div className="stat">
            <span className="stat-number">{appState.learning.streakDays}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>
      </div>

      {/* Modal Demo */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Welcome to Vocabulary Learning!"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Maybe Later
            </Button>
            <Button variant="primary" onClick={() => {
              setShowModal(false);
              window.location.href = '/quiz';
            }}>
              Start Learning
            </Button>
          </>
        }
      >
        <p>Ready to start your vocabulary learning journey?</p>
        <p>We'll begin with a personalized quiz to assess your current level and create a custom learning plan just for you.</p>
        <div className="modal-stats">
          <p><strong>🎯 Your Goal:</strong> {appState.learning.dailyGoal} words per day</p>
          <p><strong>📈 Current Level:</strong> {appState.learning.currentLevel}</p>
          <p><strong>🔥 Streak:</strong> {appState.learning.streakDays} days</p>
        </div>
      </Modal>

      {/* Loading Demo */}
      {loading && (
        <LoadingSpinner 
          text="Setting up your personalized learning experience..."
          fullScreen={true}
        />
      )}
    </div>
  );
};

export default Home;
