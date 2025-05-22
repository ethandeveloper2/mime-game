#!/bin/bash
set -e
set -x  # 디버깅 로그 출력

cd /home/ubuntu/mime-game

# 1. 서버 의존성 설치 (NestJS)
cd mime-game-server
npm install --production
cd ..

# 2. 클라이언트 의존성 설치 (Next.js)
cd mime-game-client
npm install --production
cd ..

# 3. 서버 실행 (NestJS)
PORT=9100 pm2 reload my-server || PORT=9100 pm2 start mime-game-server/dist/main.js --name my-server

# 4. 클라이언트 실행 (Next.js)
pm2 reload my-client || pm2 start "npm start --prefix mime-game-client" --name my-client

echo "✅ 배포 완료!"