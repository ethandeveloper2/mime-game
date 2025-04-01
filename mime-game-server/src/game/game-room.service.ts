import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

export enum GameState {
  WAITING = 'WAITING',
  IMAGE = 'IMAGE',
  ANSWERING = 'ANSWERING',
  REVEAL = 'REVEAL',
  VOTING = 'VOTING',
  RESULT = 'RESULT',
  END = 'END',
}

interface Player {
  nickname: string;
  score: number;
  currentAnswer?: string;
  currentVote?: string;
  id: string;
  isHost: boolean;
}

class GameRoom {
  id: string;
  state: GameState;
  players: Map<string, Player>;
  currentRound: number;
  maxRounds: number;
  currentImage: string | null;
  answers: Map<string, string>;
  votes: Map<string, string>;
  remainingTime: number;
  totalTime: number;
  stateTimer: NodeJS.Timeout | null;
  createdAt: number;
  host: string;
  isPrivate: boolean;
  password?: string;
  hostId: string;
  hostName: string;
  title: string;
  private server: Server | null;
  private stateStartTime: number;
  private readonly STATE_DURATIONS = {
    [GameState.IMAGE]: 5,
    [GameState.ANSWERING]: 30,
    [GameState.VOTING]: 20,
    [GameState.RESULT]: 5,
  } as const;
  private readonly NEXT_STATE = {
    [GameState.IMAGE]: GameState.ANSWERING,
    [GameState.ANSWERING]: GameState.VOTING,
    [GameState.VOTING]: GameState.RESULT,
    [GameState.RESULT]: GameState.IMAGE,
  } as const;

  constructor(server?: Server) {
    this.id = '';
    this.state = GameState.WAITING;
    this.players = new Map();
    this.currentRound = 1;
    this.maxRounds = 1;
    this.currentImage = null;
    this.answers = new Map();
    this.votes = new Map();
    this.remainingTime = 0;
    this.totalTime = 0;
    this.stateTimer = null;
    this.createdAt = Date.now();
    this.host = '';
    this.isPrivate = false;
    this.hostId = '';
    this.hostName = '';
    this.title = '';
    this.server = server || null;
    this.stateStartTime = 0;
  }

  setServer(server: Server) {
    this.server = server;
  }

  submitAnswer(playerId: string, answer: string): void {
    if (this.state !== GameState.ANSWERING) {
      throw new Error('답변을 제출할 수 있는 상태가 아닙니다.');
    }
    this.answers.set(playerId, answer);

    // 모든 플레이어가 답변을 제출했는지 확인
    if (this.answers.size === this.players.size) {
      this.setState(GameState.VOTING);
    }
  }

  submitVote(voterId: string, votedPlayerId: string): void {
    if (this.state !== GameState.VOTING) {
      throw new Error('투표할 수 있는 상태가 아닙니다.');
    }
    if (!this.answers.has(votedPlayerId)) {
      throw new Error('존재하지 않는 답변에 투표할 수 없습니다.');
    }
    if (voterId === votedPlayerId) {
      throw new Error('자신의 답변에 투표할 수 없습니다.');
    }

    this.votes.set(voterId, votedPlayerId);

    // 모든 플레이어가 투표했는지 확인
    if (this.votes.size === this.players.size) {
      this.calculateScores();
      this.setState(GameState.RESULT);
    }
  }

  getAnswers(): Array<{ id: string; nickname: string; answer: string }> {
    const answers: Array<{ id: string; nickname: string; answer: string }> = [];
    this.answers.forEach((answer, nickname, playerId) => {
      const player = this.players.get(nickname);
      if (player) {
        answers.push({
          id: player.id,
          nickname: player.nickname,
          answer,
        });
      }
    });
    return answers;
  }

  private calculateScores(): void {
    // 투표 결과를 집계하여 점수 계산
    const voteCount = new Map<string, number>();
    this.votes.forEach((votedPlayerId) => {
      const count = voteCount.get(votedPlayerId) || 0;
      voteCount.set(votedPlayerId, count + 1);
    });

    // 각 플레이어의 점수 업데이트
    voteCount.forEach((count, playerId) => {
      const player = this.players.get(playerId);
      if (player) {
        player.score += count;
      }
    });
  }

  setState(newState: GameState): void {
    this.state = newState;
    this.clearTimers();

    // 상태별 초기화
    switch (newState) {
      case GameState.ANSWERING:
        this.answers.clear();
        break;
      case GameState.VOTING:
        this.votes.clear();
        break;
      case GameState.RESULT:
        this.calculateScores();
        break;
    }

    // 타이머 시작
    this.startStateTimer();
  }

  private startStateTimer(): void {
    if (!this.server) return;

    const duration = this.STATE_DURATIONS[this.state];
    if (!duration) return;

    this.stateStartTime = Date.now();
    this.totalTime = duration;
    this.remainingTime = duration;

    const broadcast = () => {
      const now = Date.now();
      const elapsedTime = Math.floor((now - this.stateStartTime) / 1000);
      this.remainingTime = Math.max(0, duration - elapsedTime);

      this.server?.to(this.id).emit('game:state', {
        state: this.state,
        currentRound: this.currentRound,
        maxRounds: this.maxRounds,
        currentImage: this.currentImage,
        players: Array.from(this.players.values()),
        remainingTime: this.remainingTime,
        totalTime: this.totalTime,
      });

      if (this.remainingTime > 0) {
        this.stateTimer = setTimeout(broadcast, 1000);
      } else {
        this.handleStateTransition();
      }
    };

    broadcast();
  }

  private handleStateTransition(): void {
    const nextState = this.NEXT_STATE[this.state];
    
    if (nextState) {
      if (this.state === GameState.RESULT) {
        this.currentRound++;
        if (this.currentRound > this.maxRounds) {
          this.state = GameState.WAITING;
          this.server?.to(this.id).emit('game:state', {
            state: this.state,
            currentRound: this.currentRound,
            maxRounds: this.maxRounds,
            currentImage: '',
            players: Array.from(this.players.values()),
          });
          return;
        }
      }
      this.setState(nextState);
    }
  }

  clearTimers(): void {
    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }
    this.remainingTime = 0;
    this.totalTime = 0;
  }
}

interface RoomListItem {
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

@Injectable()
export class GameRoomService {
  // 게임 방 목록
  private gameRooms: Map<string, GameRoom> = new Map();
  // Socket.IO 서버 인스턴스
  private server: Server;
  // 이미지 목록
  private readonly images: string[] = [
    'https://picsum.photos/800/600?random=1',
    'https://picsum.photos/800/600?random=2',
    'https://picsum.photos/800/600?random=3',
    'https://picsum.photos/800/600?random=4',
    'https://picsum.photos/800/600?random=5',
    'https://picsum.photos/800/600?random=6',
    'https://picsum.photos/800/600?random=7',
    'https://picsum.photos/800/600?random=8',
    'https://picsum.photos/800/600?random=9',
    'https://picsum.photos/800/600?random=10',
  ];

  setServer(server: Server) {
    this.server = server;
  }

  // 게임 방 생성 및 초기화
  createRoom(roomId: string, maxRounds: number = 5): GameRoom {
    const room = new GameRoom(this.server);
    room.id = roomId;
    room.maxRounds = maxRounds;
    this.gameRooms.set(roomId, room);
    return room;
  }

  // 게임 방 조회
  getRoom(roomId: string): GameRoom | undefined {
    return this.gameRooms.get(roomId);
  }

  joinRoom(
    roomId: string,
    playerName: string,
    playerId: string,
    isHost: boolean = false,
  ): GameRoom {
    let room = this.getRoom(roomId);
    if (!room) {
      room = this.createRoom(roomId);
    }

    if (!room.players.has(playerId)) {
      room.players.set(playerId, {
        id: playerId,
        nickname: playerName,
        score: 0,
        isHost,
      });
    }

    return room;
  }

  startGame(roomId: string): void {
    const room = this.getRoom(roomId);
    if (!room) {
      this.server.to(roomId).emit('game:error', { message: '방을 찾을 수 없습니다.' });
      return;
    }

    if (room.players.size < 2) {
      this.server.to(roomId).emit('game:error', {
        message: '게임을 시작하려면 최소 2명의 플레이어가 필요합니다.',
      });
      return;
    }

    if (room.state !== GameState.WAITING) {
      this.server.to(roomId).emit('game:error', { message: '이미 게임이 진행 중입니다.' });
      return;
    }

    room.currentRound = 1;
    room.currentImage = this.getRandomImage();
    room.setState(GameState.IMAGE);
  }

  private getRandomImage(): string {
    const randomIndex = Math.floor(Math.random() * this.images.length);
    return this.images[randomIndex];
  }

  private broadcastRoomState(room: GameRoom): void {
    if (!room.remainingTime || !room.totalTime) return;

    const now = Date.now();
    const remainingTime = Math.max(
      0,
      Math.ceil((now - (Date.now() - room.remainingTime * 1000)) / 1000),
    );

    this.server.to(room.id).emit('game:state', {
      state: room.state,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
      currentImage: room.currentImage,
      players: Array.from(room.players.values()),
      remainingTime,
      totalTime: room.totalTime,
    });
  }

  async createNewRoom(
    hostId: string,
    hostName: string,
    title: string,
  ): Promise<GameRoom> {
    const room = new GameRoom(this.server);
    room.id = uuidv4();
    room.hostId = hostId;
    room.hostName = hostName;
    room.title = title;
    this.gameRooms.set(room.id, room);
    return room;
  }

  // 방 목록 조회
  getRoomList(): RoomListItem[] {
    return Array.from(this.gameRooms.values())
      .filter((room) => !room.isPrivate)
      .map((room) => ({
        id: room.id,
        title: room.title,
        playerCount: room.players.size,
        maxPlayers: 8, // 최대 플레이어 수 설정
        status:
          room.state === GameState.WAITING
            ? 'waiting'
            : room.state === GameState.END
              ? 'ended'
              : 'playing',
        host: room.hostName,
        state: room.state,
        currentRound: room.currentRound,
        maxRounds: room.maxRounds,
      }));
  }

  // 방 삭제
  deleteRoom(roomId: string): void {
    const room = this.getRoom(roomId);
    if (room) {
      this.clearTimers(room);
      this.gameRooms.delete(roomId);
    }
  }

  // 비밀방 생성
  createPrivateRoom(password: string, maxRounds: number = 5): GameRoom {
    const room = new GameRoom(this.server);
    room.id = uuidv4();
    room.isPrivate = true;
    room.password = password;
    room.maxRounds = maxRounds;
    this.gameRooms.set(room.id, room);
    return room;
  }

  removePlayer(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;

    // 플레이어 찾아서 제거
    for (const [nickname, player] of room.players.entries()) {
      if (player.id === playerId) {
        room.players.delete(nickname);
        break;
      }
    }

    // 방에 플레이어가 없으면 방 삭제
    if (room.players.size === 0) {
      this.gameRooms.delete(roomId);
      return;
    }

    // 호스트가 나간 경우 새로운 호스트 지정
    if (playerId === room.hostId) {
      const nextHost = Array.from(room.players.values())[0];
      room.hostId = nextHost.id;
      room.hostName = nextHost.nickname;
      nextHost.isHost = true;
    }

    // 게임 중이었다면 게임 종료
    if (room.state !== GameState.WAITING) {
      room.state = GameState.WAITING;
      room.currentRound = 1;
      this.clearTimers(room);
    }

    // 남아있는 플레이어들에게 방 상태 전파
    this.broadcastRoomState(room);
  }

  private clearTimers(room: GameRoom): void {
    room.clearTimers();
  }
}
