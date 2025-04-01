import { GameState } from '../game-room.service';

export class CreateRoomDto {
  hostId: string;
  hostName: string;
  title: string;
}

export class JoinRoomDto {
  roomId: string;
  playerId: string;
  playerName: string;
}

export class SubmitAnswerDto {
  roomId: string;
  nickname: string;
  answer: string;
}

export class SubmitVoteDto {
  roomId: string;
  nickname: string;
  votedFor: string;
}

export class GameStateDto {
  state: GameState;
  currentRound: number;
  maxRounds: number;
  currentImage?: string;
  players: {
    nickname: string;
    score: number;
    currentAnswer?: string;
    currentVote?: string;
  }[];
} 