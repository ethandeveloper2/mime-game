'use client';

import AnswerInput from '@/components/AnswerInput';
import ImageCard from '@/components/ImageCard';
import ResultModal from '@/components/ResultModal';
import TimerBar from '@/components/TimerBar';
import VoteCard from '@/components/VoteCard';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import { GameState, Player } from '@/types/game';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef } from 'react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f5f5;
`;

const GameHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;

const RoundText = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0;
`;

const StateText = styled.p`
  font-size: 1.2rem;
  color: #666;
  margin: 0;
`;

const WaitingText = styled.p`
  font-size: 1.5rem;
  color: #666;
  text-align: center;
`;

const GameContent = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const StartButton = styled.button`
  padding: 1rem 2rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
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

const PlayerList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
`;

const PlayerCard = styled.div<{ isHost: boolean }>`
  padding: 0.5rem 1rem;
  background-color: ${(props) => (props.isHost ? '#e3f2fd' : 'white')};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HostBadge = styled.span`
  background-color: #2196f3;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
`;

export default function GamePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const isMounting = useRef(false);
  const { roomId } = React.use(params);
  const {
    gameState,
    currentImage,
    round,
    players,
    currentPlayer,
    title,
    setGameState,
    setRound,
    setMaxRounds,
    setPlayers,
    setCurrentImage,
    setRemainingTime,
    setTotalTime,
    setTitle
  } = useGameStore();
  const router = useRouter();
  const { emit, getSocket } = useSocket(roomId);

  const handleLeaveRoom = useCallback(() => {
    if (!currentPlayer) return;
    if (!isMounting.current) {
      isMounting.current = true;
      return;
    }

    emit('room:leave', {
      roomId,
      playerId: currentPlayer.id,
    });
    // 전역 상태 초기화
    setGameState(GameState.WAITING);
    setPlayers([]);
    setCurrentImage(null);
    setRound(1);
  }, [
    currentPlayer,
    roomId,
    emit,
    setGameState,
    setPlayers,
    setCurrentImage,
    setRound,
  ]);

  // 컴포넌트 언마운트 시에만 실행되는 useEffect
  useEffect(() => {
    return () => {
      handleLeaveRoom();
    };
  }, [handleLeaveRoom]);

  useEffect(() => {
    if (!currentPlayer) {
      router.push('/');
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    // 게임 상태 이벤트 구독
    socket.on(
      'game:state',
      (data: {
        state: GameState;
        currentRound: number;
        maxRounds: number;
        players: Player[];
        currentImage: string;
        remainingTime: number;
        totalTime: number;
        title: string;
      }) => {
        if (data.state) setGameState(data.state);
        if (data.currentRound) setRound(data.currentRound);
        if (data.maxRounds) setMaxRounds(data.maxRounds);
        if (data.players) setPlayers(data.players);
        if (data.title) setTitle(data.title);
        if (data.remainingTime) setRemainingTime(data.remainingTime);
        if (data.totalTime) setTotalTime(data.totalTime);
        if (data.currentImage) setCurrentImage(data.currentImage);
      }
    );

    // 게임 에러 이벤트 구독
    socket.on('game:error', (data: { message: string }) => {
      alert(data.message);
    });

    // cleanup 함수
    return () => {
      // 이벤트 리스너 제거
      socket.off('game:state');
      socket.off('game:error');
    };
  }, [
    currentPlayer,
    roomId,
    emit,
    getSocket,
    setGameState,
    setPlayers,
    setCurrentImage,
    setRound,
  ]);

  const getStateText = (state: GameState) => {
    switch (state) {
      case 'WAITING':
        return '대기 중';
      case 'IMAGE':
        return '이미지 공개';
      case 'ANSWERING':
        return '답변 작성';
      case 'REVEAL':
        return '답변 공개';
      case 'VOTING':
        return '투표';
      case 'RESULT':
        return '결과';
      default:
        return '';
    }
  };

  const handleStartGame = () => {
    if (!currentPlayer?.isHost) return;
    emit('game:start', { roomId: roomId, playerId: currentPlayer.id });
  };

  return (
    <Container>
      <GameHeader>
        <RoundText>{title}</RoundText>
        <RoundText>라운드 {round}</RoundText>
        <StateText>{getStateText(gameState)}</StateText>
      </GameHeader>

      <GameContent>
        {gameState === 'WAITING' && (
          <>
            <PlayerList>
              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  isHost={player.isHost}
                >
                  {player.nickname}
                  {player.isHost && <HostBadge>호스트</HostBadge>}
                </PlayerCard>
              ))}
            </PlayerList>
            {currentPlayer?.isHost && (
              <StartButton
                onClick={handleStartGame}
                disabled={players.length < 2}
              >
                게임 시작
              </StartButton>
            )}
            {!currentPlayer?.isHost && (
              <WaitingText>
                호스트가 게임을 시작할 때까지 기다리는 중...
              </WaitingText>
            )}
          </>
        )}

        {(gameState === 'IMAGE' || gameState === 'ANSWERING') && (
          <ImageCard imageUrl={currentImage || ''} />
        )}

        {gameState === 'ANSWERING' && (
          <>
            <TimerBar />
            <AnswerInput />
          </>
        )}

        {(gameState === 'REVEAL' || gameState === 'VOTING') && <VoteCard />}

        {gameState === 'RESULT' && <ResultModal />}
      </GameContent>
    </Container>
  );
}
