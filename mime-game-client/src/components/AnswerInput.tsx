import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useGameStore } from '@/store/gameStore';
import { useSocket } from '@/hooks/useSocket';
import { usePathname } from 'next/navigation';

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #2196f3;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1976d2;
  }

  &:disabled {
    background-color: #bdbdbd;
    cursor: not-allowed;
  }
`;

const MyAnswer = styled.div`
  width: 100%;
  padding: 1rem;
  background-color: #e3f2fd;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
  font-size: 1.1rem;
  color: #1976d2;
`;

export default function AnswerInput() {
  const [answer, setAnswer] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const { currentPlayer } = useGameStore();
  const pathname = usePathname();
  const roomId = pathname.split('/')[2]; // /room/[roomId] 형식에서 roomId 추출
  const { emit } = useSocket(roomId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !currentPlayer || !roomId) return;

    emit('round:submitAnswer', {
      roomId,
      playerId: currentPlayer.id,
      nickname: currentPlayer.nickname,
      answer: answer.trim(),
    });
    setSubmittedAnswer(answer.trim());
    setAnswer('');
  };

  return (
    <Container>
      <Input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="답변을 입력하세요..."
        maxLength={50}
        disabled={submittedAnswer !== null}
      />
      <SubmitButton 
        onClick={handleSubmit} 
        disabled={!answer.trim() || submittedAnswer !== null}
      >
        {submittedAnswer ? '제출완료' : '제출하기'}
      </SubmitButton>
      {submittedAnswer && (
        <MyAnswer>
          내 답변: {submittedAnswer}
        </MyAnswer>
      )}
    </Container>
  );
} 