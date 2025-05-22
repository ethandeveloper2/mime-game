'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { useGameStore } from '@/store/gameStore';
import { useSocket } from '@/hooks/useSocket';
import { Room, CreateRoomData, JoinRoomData, GameState, Player } from '@/types/game';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f5f5;
`;

const Header = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
`;

const CreateButton = styled.button`
  padding: 0.8rem 1.5rem;
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
`;

const RoomList = styled.div`
  width: 100%;
  max-width: 800px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const RoomCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const RoomTitle = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const RoomInfo = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  background-color: ${props => props.variant === 'primary' ? '#4caf50' : '#f5f5f5'};
  color: ${props => props.variant === 'primary' ? 'white' : '#333'};

  &:hover {
    background-color: ${props => props.variant === 'primary' ? '#388e3c' : '#e0e0e0'};
  }
`;

export default function RoomsPage() {
  const router = useRouter();
  const { currentPlayer, setCurrentPlayer, setGameState, setPlayers, setTitle } = useGameStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const { emit, getSocket } = useSocket('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');

  // 방 목록 포맷팅 함수
  const formatRooms = useCallback((response: Room[]): Room[] => {
    return response.map(room => ({
      id: room.id,
      title: room.title,
      playerCount: room.playerCount,
      maxPlayers: room.maxPlayers,
      status: room.status,
      host: room.host,
      state: room.state,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds
    }));
  }, []);

  // 초기 방 목록 로드
  useEffect(() => {
    // 유저의 정보가 없으면 홈으로 이동
    if (!currentPlayer) {
      router.push('/');
      return;
    }

    // 방 목록 요청
    emit<void, Room[]>('rooms:list', undefined, (response) => {
      setRooms(formatRooms(response));
    });
  }, [currentPlayer, router, emit, formatRooms]);

  // 방 목록 업데이트 이벤트 구독
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRoomList = (response: Room[]) => {
      setRooms(formatRooms(response));
    };

    socket.on('rooms:list', handleRoomList);

    return () => {
      setRooms([]);
      socket.off('rooms:list', handleRoomList);
    };
  }, [formatRooms, getSocket]);

  // 방을 만들기
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlayer || !roomTitle.trim()) return;

    const hostCurrentPlayer = {
      ...currentPlayer,
      isHost: true
    };
    setCurrentPlayer(hostCurrentPlayer);

    const createRoomData: CreateRoomData = {
      hostId: hostCurrentPlayer.id,
      hostName: hostCurrentPlayer.nickname,
      title: roomTitle.trim()
    };

    const socket = getSocket();
    if (!socket) return;

    const handleRoomCreated = (data: { roomId: string }) => {
      socket.off('room:created', handleRoomCreated);
      setIsModalOpen(false);
      setRoomTitle('');
      router.push(`/room/${data.roomId}`);
    };

    const handleGameState = (data: { state: GameState; players: Player[], title: string }) => {
      setGameState(data.state);
      setPlayers(data.players);
      setTitle(data.title);
      socket.off('game:state', handleGameState);
    };

    socket.on('room:created', handleRoomCreated);
    socket.on('game:state', handleGameState);

    // 방 생성 요청
    emit<CreateRoomData, boolean>('room:create', createRoomData, (success) => {
      if (!success) {
        socket.off('room:created', handleRoomCreated);
        socket.off('game:state', handleGameState);
        alert('방 생성에 실패했습니다. 다시 시도해주세요.');
      }
    });
  };

  // 방에 입장하기
  const handleJoinRoom = (roomId: string) => {
    if (!currentPlayer) return;

    const socket = getSocket();
    if (!socket) return;

    const handleGameState = (data: { state: GameState; players: Player[], title: string }) => {
      setGameState(data.state);
      setPlayers(data.players);
      setTitle(data.title);
      socket.off('game:state', handleGameState);
    };

    socket.on('game:state', handleGameState);


    emit<JoinRoomData, boolean>('room:join', {
      roomId,
      playerId: currentPlayer.id,
      playerName: currentPlayer.nickname
    }, (success) => {
      if (success) {
        router.push(`/room/${roomId}`);
      } else {
        alert('방에 입장할 수 없습니다. 방이 이미 시작되었거나 만원일 수 있습니다.');
      }
    });
  };

  return (
    <Container>
      <Header>
        <Title>게임 방 목록</Title>
        <CreateButton onClick={() => setIsModalOpen(true)}>방 만들기</CreateButton>
      </Header>

      <RoomList>
        {rooms.map((room) => (
          <RoomCard key={room.id} onClick={() => handleJoinRoom(room.id)}>
            <RoomTitle>{room.title}</RoomTitle>
            <RoomInfo>
              {room.playerCount}/{room.maxPlayers}명 참여 중
            </RoomInfo>
            <RoomInfo>
              상태: {room.status === 'waiting' ? '대기 중' : '게임 중'}
            </RoomInfo>
          </RoomCard>
        ))}
      </RoomList>

      {isModalOpen && (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <Form onSubmit={handleCreateRoom}>
              <h2>새로운 방 만들기</h2>
              <Input
                type="text"
                placeholder="방 제목을 입력하세요"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                required
              />
              <ButtonGroup>
                <Button type="button" onClick={() => setIsModalOpen(false)}>
                  취소
                </Button>
                <Button type="submit" variant="primary">
                  만들기
                </Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
} 