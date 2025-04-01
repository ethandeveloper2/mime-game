import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateRoomDto, JoinRoomDto } from './dto/game.dto';
import { GameRoomService, GameState } from './game-room.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameRoomService: GameRoomService) {}

  // 1. GameGateway 초기화
  afterInit(server: Server) {
    this.gameRoomService.setServer(server); // Socket.IO 서버 설정
  }

  // 2. 연결 관리, 클라이언트에서 Socket.IO 서버에 연결되면 호출되는 이벤트 핸들러
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('rooms:list')
  handleRoomList(client: Socket) {
    const roomList = this.gameRoomService.getRoomList();
    client.emit('rooms:list', roomList);
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(client: Socket, payload: JoinRoomDto) {
    const { roomId, playerId, playerName } = payload;

    // 방 조회
    const room = this.gameRoomService.getRoom(roomId);

    // 방 찾을 수 없음
    if (!room) {
      client.emit('game:error', { message: '방을 찾을 수 없습니다.' });
      return false;
    }

    // 방이 이미 시작되었는지 확인
    if (room.state !== GameState.WAITING) {
      client.emit('game:error', { message: '이미 시작된 방입니다.' });
      return false;
    }

    // 방이 만원인지 확인
    if (room.players.size >= 8) {
      client.emit('game:error', { message: '방이 만원입니다.' });
      return false;
    }

    // 방 참여
    client.join(roomId);
    client.data.roomId = roomId;
    client.data.playerId = playerId;
    this.gameRoomService.joinRoom(
      roomId,
      playerName,
      playerId,
      playerId === room.hostId,
    );

    // 방 상태 전파
    this.server.to(roomId).emit('game:state', {
      title: room.title,
      state: room.state,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
      players: Array.from(room.players.values()),
    });

    return true;
  }

  @SubscribeMessage('room:create')
  async handleCreateRoom(client: Socket, payload: CreateRoomDto) {
    const { hostId, hostName, title } = payload;
    // 방을 만든다.
    const room = await this.gameRoomService.createNewRoom(
      hostId,
      hostName,
      title,
    );

    // 호스트를 방에 참여시킴
    client.join(room.id);
    this.gameRoomService.joinRoom(room.id, hostName, hostId, true);

    // 방 생성 성공 이벤트 전송
    client.emit('room:created', { roomId: room.id });

    // 방 상태 전파
    this.server.to(room.id).emit('game:state', {
      title: room.title,
      state: room.state,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
      currentImage: room.currentImage,
      players: Array.from(room.players.values()),
    });

    // 방 목록 업데이트 이벤트 전송
    const roomList = this.gameRoomService.getRoomList();
    this.server.emit('rooms:list', roomList);

    return true; // 성공 여부 반환
  }

  @SubscribeMessage('game:start')
  handleStartGame(
    client: Socket,
    payload: { roomId: string; playerId: string },
  ) {
    const { roomId, playerId } = payload;
    const room = this.gameRoomService.getRoom(roomId);
    if (!room) {
      client.emit('game:error', { message: '방을 찾을 수 없습니다.' });
      return;
    }

    // 호스트만 게임을 시작할 수 있도록 확인
    if (room.hostId !== playerId) {
      client.emit('game:error', {
        message: '호스트만 게임을 시작할 수 있습니다.',
      });
      return;
    }

    // 게임 시작
    this.gameRoomService.startGame(roomId);
  }

  @SubscribeMessage('round:getAnswers')
  handleGetAnswers(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = this.gameRoomService.getRoom(data.roomId);
      if (!room) {
        throw new Error('방을 찾을 수 없습니다.');
      }
      return room.getAnswers();
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('round:submitAnswer')
  handleSubmitAnswer(
    @MessageBody() data: { roomId: string; playerId: string; answer: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = this.gameRoomService.getRoom(data.roomId);
      if (!room) {
        throw new Error('방을 찾을 수 없습니다.');
      }
      room.submitAnswer(data.playerId, data.answer);
      this.server.to(data.roomId).emit('game:state', {
        state: room.state,
        currentRound: room.currentRound,
        maxRounds: room.maxRounds,
        currentImage: room.currentImage,
        players: Array.from(room.players.values()),
        remainingTime: room.remainingTime,
        totalTime: room.totalTime,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('round:submitVote')
  handleSubmitVote(
    @MessageBody()
    data: { roomId: string; playerId: string; votedPlayerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = this.gameRoomService.getRoom(data.roomId);
      if (!room) {
        throw new Error('방을 찾을 수 없습니다.');
      }
      room.submitVote(data.playerId, data.votedPlayerId);
      this.server.to(data.roomId).emit('game:state', {
        state: room.state,
        currentRound: room.currentRound,
        maxRounds: room.maxRounds,
        currentImage: room.currentImage,
        players: Array.from(room.players.values()),
        remainingTime: room.remainingTime,
        totalTime: room.totalTime,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    client: Socket,
    payload: { roomId: string; playerId: string },
  ) {
    const { roomId, playerId } = payload;

    // 소켓을 방에서 나가게 함
    client.leave(roomId);

    // 게임 방에서 플레이어 제거
    this.gameRoomService.removePlayer(roomId, playerId);

    const room = this.gameRoomService.getRoom(roomId);
    if (!room) {
      // 방 목록 업데이트 이벤트 전송
      const roomList = this.gameRoomService.getRoomList();
      this.server.emit('rooms:list', roomList);
      return;
    } else {
      // 방 상태 전파
      this.server.to(roomId).emit('game:state', {
        state: GameState.WAITING,
        currentRound: 0,
        maxRounds: room.maxRounds,
        currentImage: room.currentImage,
        players: Array.from(room.players.values()),
      });
    }
  }

  @SubscribeMessage('chat:message')
  async handleChatMessage(client: Socket, payload: { roomId: string; playerId: string; message: string; targetPlayerId?: string }) {
    const { roomId, playerId, message, targetPlayerId } = payload;
    
    if (!roomId) {
      console.error('No roomId found in socket data');
      return;
    }

    const room = await this.gameRoomService.getRoom(roomId);
    if (!room) {
      console.error('Room not found:', roomId);
      return;
    }

    const player = room.players.get(playerId);
    if (!player) {
      console.error('Player not found:', playerId);
      return;
    }

    const chatMessage = {
      roomId,
      playerId,
      playerName: player.nickname,
      message,
      timestamp: new Date().toISOString(),
      isWhisper: !!targetPlayerId,
      targetPlayerId,
    };

    try {
      // 귓속말인 경우 발신자와 수신자에게만 전송
      if (targetPlayerId) {
        const targetSocket = this.getPlayerSocket(roomId, targetPlayerId);
        if (targetSocket) {
          targetSocket.emit('chat:message', chatMessage);
          console.log('Whisper sent to:', targetPlayerId);
        } else {
          console.error('Target socket not found:', targetPlayerId);
        }
        client.emit('chat:message', chatMessage);
        console.log('Whisper sent to sender:', playerId);
      } else {
        // 일반 메시지는 방의 모든 플레이어에게 전송
        this.server.to(roomId).emit('chat:message', chatMessage);
        console.log('Message broadcast to room:', roomId);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  }

  private getPlayerSocket(roomId: string, playerId: string): Socket | undefined {
    const room = this.server.sockets.adapter.rooms.get(roomId);
    if (!room) {
      console.error('Room not found in socket adapter:', roomId);
      return undefined;
    }

    for (const socketId of room) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket && socket.data.playerId === playerId) {
        return socket;
      }
    }
    console.error('Player socket not found:', playerId);
    return undefined;
  }
}
