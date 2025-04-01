export enum GameState {
  WAITING = 'WAITING',
  IMAGE = 'IMAGE',
  ANSWERING = 'ANSWERING',
  REVEAL = 'REVEAL',
  VOTING = 'VOTING',
  RESULT = 'RESULT',
  END = 'END',
}

export interface CreateRoomData {
  hostId: string;
  hostName: string;
  title: string;
}

export interface JoinRoomData {
  roomId: string;
  playerId: string;
  playerName: string;
}

export interface Room {
  id: string;
  title: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'ended';
  host: string;
  state: GameState;
  currentRound: number;
  maxRounds: number;
}

export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  score: number;
  currentAnswer?: string;
  currentVote?: string;
} 