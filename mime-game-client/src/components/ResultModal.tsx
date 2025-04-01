import React from 'react';
import styled from '@emotion/styled';
import { useGameStore } from '@/store/gameStore';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 1.5rem 0;
  text-align: center;
`;

const ResultTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const TableHeader = styled.th`
  padding: 1rem;
  background-color: #f5f5f5;
  color: #333;
  font-weight: 600;
  text-align: left;
  border-bottom: 2px solid #e0e0e0;
`;

const TableRow = styled.tr<{ isCurrentPlayer: boolean }>`
  background-color: ${props => props.isCurrentPlayer ? '#e3f2fd' : 'white'};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.isCurrentPlayer ? '#bbdefb' : '#f5f5f5'};
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  color: #333;
`;

const Score = styled.span`
  font-size: 1.1rem;
  color: #2196f3;
  font-weight: bold;
`;

const PlayerId = styled.span`
  color: #757575;
  font-size: 0.9rem;
  display: block;
  margin-top: 0.25rem;
`;

const RankCell = styled(TableCell)<{ rank: number }>`
  font-weight: bold;
  color: ${props => {
    switch (props.rank) {
      case 1: return '#ffd700'; // 금메달
      case 2: return '#c0c0c0'; // 은메달
      case 3: return '#cd7f32'; // 동메달
      default: return '#333';
    }
  }};
`;

export default function ResultModal() {
  const { players, currentPlayer } = useGameStore();

  // 점수 기준으로 정렬된 플레이어 배열
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <Overlay>
      <Modal>
        <Title>게임 결과</Title>
        <ResultTable>
          <thead>
            <tr>
              <TableHeader>순위</TableHeader>
              <TableHeader>닉네임</TableHeader>
              <TableHeader>점수</TableHeader>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => (
              <TableRow 
                key={player.id}
                isCurrentPlayer={player.id === currentPlayer?.id}
              >
                <RankCell rank={index + 1}>
                  {index + 1}
                </RankCell>
                <TableCell>
                  {player.nickname}
                  <PlayerId>ID: {player.id}</PlayerId>
                </TableCell>
                <TableCell>
                  <Score>{player.score}점</Score>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </ResultTable>
      </Modal>
    </Overlay>
  );
} 