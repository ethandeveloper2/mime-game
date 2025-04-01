import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { useGameStore } from '@/store/gameStore';
import { useSocket } from '@/hooks/useSocket';

interface TimerBarProps {
  remainingTime: number;
  totalTime: number;
}

const TimerBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin: 10px 0;
`;

const TimerProgress = styled.div<{ progress: number }>`
  width: ${props => props.progress}%;
  height: 100%;
  background-color: #4CAF50;
  transition: width 1s linear;
`;

const TimeText = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #333;
  margin-top: 0.5rem;
`;

const TimerBar: React.FC<TimerBarProps> = ({ remainingTime, totalTime }) => {
  const progress = (remainingTime / totalTime) * 100;

  return (
    <div>
      <TimerBarContainer>
        <TimerProgress progress={progress} />
      </TimerBarContainer>
      <TimeText>{remainingTime}초</TimeText>
    </div>
  );
}; 

export default TimerBar;