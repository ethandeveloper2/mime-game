import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/store/gameStore';
// import { Room } from '@/types/game';

// interface Player {
//   id: string;
//   name: string;
//   nickname: string;
//   score: number;
//   isHost: boolean;
// }

// interface CreateRoomData {
//   hostId: string;
//   hostName: string;
// }

// interface JoinRoomData {
//   roomId: string;
//   playerId: string;
//   playerName: string;
// }

// interface StartGameData {
//   roomId: string;
// }

// type GameState = 'WAITING' | 'IMAGE' | 'ANSWERING' | 'REVEAL' | 'VOTING' | 'RESULT';

// interface SocketEvents {
//   'game:state': (state: GameState) => void;
//   'player:join': (player: Player) => void;
//   'player:leave': (playerId: string) => void;
//   'player:score': (data: { playerId: string; score: number }) => void;
//   'game:start': (data: StartGameData) => void;
//   'game:end': () => void;
//   'rooms:list': (data: void) => Room[];
//   'rooms:subscribe': (data: void) => Room;
//   'room:create': (data: CreateRoomData) => string;
//   'room:join': (data: JoinRoomData) => boolean;
//   'timer:end': (data: void) => void;
//   'join:room': (data: { roomId: string }) => void;
// }

let socket: Socket | null = null;

export const useSocket = (roomId: string) => {
  const { currentPlayer } = useGameStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    // 이미 초기화되었다면 리턴
    if (initializedRef.current) {
      return;
    }

    console.log('useSocket 초기화', roomId);
    initializedRef.current = true;

    // 이미 소켓이 연결되어 있다면 재사용
    if (socket?.connected) {
      console.log('기존 소켓 연결 재사용');
    } else {
      // 새로운 소켓 연결 생성
      socket = io('http://localhost:9100', {
        query: {
          roomId,
          playerId: currentPlayer?.id,
          playerName: currentPlayer?.nickname,
          isHost: currentPlayer?.isHost
        }
      });

      socket.on('connect', () => {
        console.log('소켓 연결됨', socket?.id);
      });

      socket.on('disconnect', () => {
        console.log('소켓 연결 끊김');
      });
    }

    // 에러 이벤트 구독
    socket?.on('error', (error) => {
      console.error('소켓 에러:', error);
    });

    return () => {
      // 이벤트 리스너만 제거하고 소켓 연결은 유지
      if (socket) {
        socket.off('error');
      }
    };
  }, [roomId]);

  const emit = useCallback(<T, R>(
    event: string,
    data?: T,
    callback?: (response: R) => void
  ) => {
    if (socket) {
      if (callback) {
        socket.emit(event, data, callback);
      } else {
        socket.emit(event, data);
      }
    }
  }, []);

  const getSocket = useCallback(() => socket, []);

  return { emit, getSocket };
}; 