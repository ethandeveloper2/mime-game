import { create } from 'zustand';
import { GameState } from '@/types/game';
import type { Player } from '@/types/game';
import type { Room } from '@/types/game';

interface GameStore {
  // 게임 상태
  title: string;
  gameState: GameState;
  currentImage: string | null;
  round: number;
  maxRounds: number;
  
  // 플레이어 관련
  players: Player[];
  currentPlayer: Player | null;
  
  // 타이머 관련
  remainingTime: number;
  totalTime: number;
  isTimerRunning: boolean;
  
  // 채팅 관련
  currentRoom: Room | null;
  whisperTarget: string | null;
  
  // 게임 상태 관리 함수
  setTitle: (title: string) => void;
  setGameState: (state: GameState) => void;
  setCurrentImage: (image: string | null) => void;
  setRound: (round: number) => void;
  setMaxRounds: (maxRounds: number) => void;
  
  // 플레이어 관리 함수
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerScore: (playerId: string, score: number) => void;
  setCurrentPlayer: (player: Player | null) => void;
  
  // 타이머 관리 함수
  setRemainingTime: (time: number | ((prev: number) => number)) => void;
  setTotalTime: (time: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  
  // 채팅 관련 함수
  setCurrentRoom: (room: Room | null) => void;
  setWhisperTarget: (target: string | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // 초기 상태
  title: '',
  gameState: GameState.WAITING,
  currentImage: null,
  round: 1,
  maxRounds: 3,
  players: [],
  currentPlayer: null,
  remainingTime: 60,
  totalTime: 60,
  isTimerRunning: false,
  currentRoom: null,
  whisperTarget: null,

  // 게임 상태 관리 함수
  setTitle: (title) => set({ title }),
  setGameState: (state) => set({ gameState: state }),
  setCurrentImage: (image) => set({ currentImage: image }),
  setRound: (round) => set({ round }),
  setMaxRounds: (maxRounds) => set({ maxRounds }),

  // 플레이어 관리 함수
  setPlayers: (players) => set({ players }),
  addPlayer: (player) => set((state) => ({ 
    players: [...state.players, player] 
  })),
  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter(p => p.id !== playerId)
  })),
  updatePlayerScore: (playerId, score) => set((state) => ({
    players: state.players.map(p => 
      p.id === playerId ? { ...p, score } : p
    )
  })),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  
  // 타이머 관리 함수
  setRemainingTime: (time) => set((state) => ({ 
    remainingTime: typeof time === 'function' ? time(state.remainingTime) : time 
  })),
  setTotalTime: (time) => set({ totalTime: time }),
  startTimer: () => set({ isTimerRunning: true }),
  stopTimer: () => set({ isTimerRunning: false }),
  resetTimer: () => set({ remainingTime: 60, totalTime: 60, isTimerRunning: false }),
  
  // 채팅 관련 함수
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setWhisperTarget: (target) => set({ whisperTarget: target }),
})); 