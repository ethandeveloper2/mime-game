import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { useGameStore } from '@/store/gameStore';
import { useSocket } from '@/hooks/useSocket';

const Container = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
`;

const Progress = styled.div<{ progress: number }>`
  width: ${props => props.progress}%;
  height: 100%;
  background-color: #2196f3;
  transition: width 1s linear;
`;

const TimeText = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #333;
  margin-top: 0.5rem;
`;

export default function TimerBar() {
  const { remainingTime, totalTime } = useGameStore();
  const progress = (remainingTime / totalTime) * 100;

  return (
    <div>
      <Container>
        <Progress progress={progress} />
      </Container>
      <TimeText>{remainingTime}초</TimeText>
    </div>
  );
} 