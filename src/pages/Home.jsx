import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import VocabularyCard from '../components/VocabularyCard';
import AudioPlayer from '../components/AudioPlayer';
import FormDemo from '../components/FormDemo';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressBar from '../components/ProgressBar';
import AchievementBadge from '../components/AchievementBadge';
import PointsDisplay from '../components/PointsDisplay';
import Leaderboard from '../components/Leaderboard';
import LevelIndicator from '../components/LevelIndicator';
import RewardAnimation from '../components/RewardAnimation';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import vocabularyAPI from '../services/vocabularyAPI';
import './Home.css';

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentWordData, setCurrentWordData] = useState(null);
  const [showReward, setShowReward] = useState(false);
  const [rewardType, setRewardType] = useState('points');
  const [rewardValue, setRewardValue] = useState(0);
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

      {/* Gamification Demo Section */}
      <div className="demo-section gamification-demo">
        <h2 className="section-title">🎮 Gamification Features</h2>
        
        {/* Achievement Badges */}
        <div className="demo-subsection">
          <h3>🏆 Achievement Badges</h3>
          <div className="badges-grid">
            <AchievementBadge
              title="First Steps"
              description="Complete your first vocabulary quiz"
              icon="🎯"
              earned={true}
              rarity="common"
              animated={true}
            />
            <AchievementBadge
              title="Word Master"
              description="Learn 100 vocabulary words"
              icon="📚"
              earned={false}
              rarity="rare"
              progress={75}
              maxProgress={100}
              showProgress={true}
            />
            <AchievementBadge
              title="Streak Legend"
              description="Maintain a 30-day learning streak"
              icon="🔥"
              earned={true}
              rarity="epic"
              size="large"
            />
            <AchievementBadge
              title="Grammar Guru"
              description="Perfect score on advanced grammar test"
              icon="⭐"
              earned={false}
              rarity="legendary"
              progress={5}
              maxProgress={10}
              showProgress={true}
            />
          </div>
        </div>

        {/* Points & Level Display */}
        <div className="demo-subsection">
          <h3>💯 Points & Level System</h3>
          <div className="points-level-container">
            <PointsDisplay
              currentPoints={2450}
              totalPoints={12890}
              level={8}
              nextLevelPoints={2800}
              animated={true}
              variant="detailed"
            />
            <LevelIndicator
              currentLevel={8}
              currentXP={2450}
              nextLevelXP={2800}
              animated={true}
              size="large"
            />
          </div>
        </div>

        {/* Leaderboard */}
        <div className="demo-subsection">
          <h3>🏅 Leaderboard</h3>
          <Leaderboard
            users={[
              { id: 1, name: "Sarah Chen", points: 15420, level: 12, avatar: null, title: "Vocabulary Master" },
              { id: 2, name: "Alex Johnson", points: 12890, level: 10, avatar: null, title: "Grammar Expert" },
              { id: 3, name: "You", points: 8650, level: 8, avatar: null, title: "Rising Star" },
              { id: 4, name: "Maria Garcia", points: 7200, level: 7, avatar: null, title: "Word Explorer" },
              { id: 5, name: "David Kim", points: 6800, level: 6, avatar: null, title: "Language Learner" },
              { id: 6, name: "Emma Wilson", points: 5900, level: 6, avatar: null, title: "Dedicated Student" }
            ]}
            currentUserId={3}
            maxEntries={6}
            variant="detailed"
          />
        </div>

        {/* Reward Animation Demo */}
        <div className="demo-subsection">
          <h3>✨ Reward Animations</h3>
          <div className="reward-demo-buttons">
            <Button 
              variant="success" 
              onClick={() => {
                setRewardType('points');
                setRewardValue(50);
                setShowReward(true);
              }}
            >
              +50 Points
            </Button>
            <Button 
              variant="info" 
              onClick={() => {
                setRewardType('badge');
                setRewardValue(0);
                setShowReward(true);
              }}
            >
              New Badge
            </Button>
            <Button 
              variant="warning" 
              onClick={() => {
                setRewardType('levelUp');
                setRewardValue(9);
                setShowReward(true);
              }}
            >
              Level Up!
            </Button>
            <Button 
              variant="danger" 
              onClick={() => {
                setRewardType('streak');
                setRewardValue(7);
                setShowReward(true);
              }}
            >
              Streak Bonus
            </Button>
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

      {/* Reward Animation */}
      <RewardAnimation
        isVisible={showReward}
        type={rewardType}
        value={rewardValue}
        message={
          rewardType === 'levelUp' ? `Level ${rewardValue} Reached!` :
          rewardType === 'badge' ? 'New Achievement Unlocked!' :
          rewardType === 'streak' ? `${rewardValue} Day Streak!` :
          'Great Job!'
        }
        onComplete={() => setShowReward(false)}
      />
    </div>
  );
};

export default Home;
