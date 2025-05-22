#!/bin/bash

# 에러 발생 시 스크립트 중단
set -e

# 서버/클라이언트 빌드 파일이 복사된 위치로 이동
cd /home/ubuntu/mime-game

# (선택) 의존성 설치 (필요시)
# cd mime-game-server
# npm ci --only=production

# 서버 실행 (NestJS)
pm2 reload my-server || pm2 start mime-game-server/dist/main.js --name my-server --env PORT=3000

# 클라이언트 실행 (Next.js)
pm2 reload my-client || pm2 start "npm" --name my-client -- start --prefix mime-game-client

echo "배포 완료!"