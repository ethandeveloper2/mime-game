import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useGameStore } from '@/store/gameStore';
import { useSocket } from '@/hooks/useSocket';
import { usePathname } from 'next/navigation';

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  text-align: center;
  color: #333;
  margin: 0;
`;

const AnswerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RadioCard = styled.label<{ isDisabled: boolean; isSelected: boolean }>`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: ${props => 
    props.isDisabled ? '#f5f5f5' : 
    props.isSelected ? '#e3f2fd' : 'white'
  };
  border: 2px solid ${props => 
    props.isDisabled ? '#e0e0e0' : 
    props.isSelected ? '#2196f3' : '#e0e0e0'
  };
  border-radius: 8px;
  cursor: ${props => props.isDisabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  opacity: ${props => props.isDisabled ? 0.7 : 1};

  &:hover {
    border-color: ${props => props.isDisabled ? '#e0e0e0' : '#2196f3'};
    background-color: ${props => props.isDisabled ? '#f5f5f5' : '#f8f8f8'};
  }
`;

const RadioInput = styled.input`
  display: none;
`;

const AnswerText = styled.span<{ isDisabled: boolean }>`
  flex: 1;
  margin-left: 1rem;
  color: ${props => props.isDisabled ? '#666' : '#333'};
  ${props => props.isDisabled && `
    &::after {
      content: ' (내 답변)';
      color: #666;
      font-style: italic;
    }
  `}
`;

const RadioCircle = styled.div<{ isSelected: boolean; isDisabled: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => 
    props.isDisabled ? '#bdbdbd' : 
    props.isSelected ? '#2196f3' : '#757575'
  };
  border-radius: 50%;
  position: relative;

  &::after {
    content: '';
    width: 10px;
    height: 10px;
    background-color: #2196f3;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: ${props => props.isSelected ? 1 : 0};
    transition: opacity 0.2s;
  }
`;

const VoteButton = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #388e3c;
  }

  &:disabled {
    background-color: #bdbdbd;
    cursor: not-allowed;
  }
`;

interface Answer {
  id: string;
  nickname: string;
  answer: string;
}

export default function VoteCard() {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const { currentPlayer } = useGameStore();
  const pathname = usePathname();
  const roomId = pathname.split('/')[2];
  const { emit } = useSocket(roomId);

  useEffect(() => {
    emit('round:getAnswers', { roomId }, (response: Answer[]) => {
      setAnswers(response);
    });
  }, [roomId, emit]);

  const handleVote = () => {
    if (!selectedAnswer || !currentPlayer || hasVoted) return;

    emit('round:submitVote', {
      roomId,
      playerId: currentPlayer.id,
      votedPlayerId: selectedAnswer,
    });
    setHasVoted(true);
  };

  return (
    <Container>
      <Title>가장 적절한 답변에 투표해주세요</Title>
      <AnswerList>
        {answers.map((answer) => {
          const isMyAnswer = answer.id === currentPlayer?.id;
          const isSelected = selectedAnswer === answer.id;

          return (
            <RadioCard
              key={answer.id}
              isDisabled={isMyAnswer || hasVoted}
              isSelected={isSelected}
            >
              <RadioInput
                type="radio"
                name="answer"
                value={answer.id}
                checked={isSelected}
                onChange={() => !hasVoted && !isMyAnswer && setSelectedAnswer(answer.id)}
                disabled={isMyAnswer || hasVoted}
              />
              <RadioCircle isSelected={isSelected} isDisabled={isMyAnswer || hasVoted} />
              <AnswerText isDisabled={isMyAnswer}>
                {answer.answer}
              </AnswerText>
            </RadioCard>
          );
        })}
      </AnswerList>
      <VoteButton 
        onClick={handleVote}
        disabled={!selectedAnswer || hasVoted}
      >
        {hasVoted ? '투표 완료' : '투표하기'}
      </VoteButton>
    </Container>
  );
}