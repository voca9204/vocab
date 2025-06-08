import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Leaderboard.css';

const Leaderboard = ({
  users = [],
  currentUserId = null,
  showRank = true,
  showAvatar = true,
  showPoints = true,
  showLevel = true,
  maxEntries = 10,
  highlightCurrent = true,
  variant = 'default',
  size = 'medium',
  className = '',
  onUserClick,
  ...props
}) => {
  const [filter, setFilter] = useState('all');
  
  const leaderboardClasses = [
    'leaderboard',
    `leaderboard-${variant}`,
    `leaderboard-${size}`,
    className
  ].filter(Boolean).join(' ');

  // Sort and filter users
  const sortedUsers = users
    .sort((a, b) => b.points - a.points)
    .slice(0, maxEntries);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const formatPoints = (points) => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    } else if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toLocaleString();
  };

  const getUserAvatar = (user) => {
    if (user.avatar) {
      return <img src={user.avatar} alt={user.name} className="user-avatar-img" />;
    }
    return <div className="user-avatar-placeholder">{user.name?.charAt(0) || '👤'}</div>;
  };

  return (
    <div className={leaderboardClasses} {...props}>
      {/* Header */}
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">🏆 Leaderboard</h3>
        <div className="leaderboard-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Time
          </button>
          <button 
            className={`filter-btn ${filter === 'weekly' ? 'active' : ''}`}
            onClick={() => setFilter('weekly')}
          >
            This Week
          </button>
          <button 
            className={`filter-btn ${filter === 'monthly' ? 'active' : ''}`}
            onClick={() => setFilter('monthly')}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="leaderboard-list">
        {sortedUsers.map((user, index) => {
          const rank = index + 1;
          const isCurrentUser = user.id === currentUserId;
          const rankIcon = getRankIcon(rank);
          
          const entryClasses = [
            'leaderboard-entry',
            isCurrentUser && highlightCurrent && 'entry-current',
            rank <= 3 && 'entry-top-three',
            onUserClick && 'entry-clickable'
          ].filter(Boolean).join(' ');

          return (
            <div 
              key={user.id} 
              className={entryClasses}
              onClick={() => onUserClick && onUserClick(user)}
            >
              {/* Rank */}
              {showRank && (
                <div className="entry-rank">
                  {rankIcon ? (
                    <span className="rank-icon">{rankIcon}</span>
                  ) : (
                    <span className="rank-number">#{rank}</span>
                  )}
                </div>
              )}

              {/* Avatar */}
              {showAvatar && (
                <div className="entry-avatar">
                  {getUserAvatar(user)}
                </div>
              )}

              {/* User Info */}
              <div className="entry-info">
                <div className="entry-name">
                  {user.name}
                  {isCurrentUser && <span className="you-badge">You</span>}
                </div>
                {user.title && (
                  <div className="entry-title">{user.title}</div>
                )}
              </div>

              {/* Stats */}
              <div className="entry-stats">
                {showLevel && user.level && (
                  <div className="entry-level">Lv. {user.level}</div>
                )}
                {showPoints && (
                  <div className="entry-points">{formatPoints(user.points)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedUsers.length === 0 && (
        <div className="leaderboard-empty">
          <div className="empty-icon">📊</div>
          <div className="empty-message">No users to display</div>
        </div>
      )}
    </div>
  );
};

Leaderboard.propTypes = {
  users: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    points: PropTypes.number.isRequired,
    level: PropTypes.number,
    avatar: PropTypes.string,
    title: PropTypes.string
  })),
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  showRank: PropTypes.bool,
  showAvatar: PropTypes.bool,
  showPoints: PropTypes.bool,
  showLevel: PropTypes.bool,
  maxEntries: PropTypes.number,
  highlightCurrent: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'compact', 'detailed']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
  onUserClick: PropTypes.func
};

export default Leaderboard;