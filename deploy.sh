#!/bin/bash
set -e
set -x  # 디버깅 로그 출력

cd /home/ubuntu/mime-game

# 서버 실행 (NestJS)
PORT=3000 pm2 reload my-server || PORT=9100 pm2 start mime-game-server/dist/main.js --name my-server

# 클라이언트 실행 (Next.js)
pm2 reload my-client || pm2 start "npm start --prefix mime-game-client" --name my-client

echo "✅ 배포 완료!"