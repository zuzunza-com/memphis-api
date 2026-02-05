# @zuzunza/zetrafi

주전자닷컴(Zuzunza)의 공식 외부 연동 API(Zetrafi) 클라이언트입니다.
외부 애플리케이션은 Supabase를 직접 호출하지 않고, **Zetrafi API**를 통해 안전하게 데이터를 조회/작성해야 합니다.

## 개요
- API 기본 URL: `https://zuzunza.com/api/zetrafi/v1`
- 인증 방식: `Authorization: Bearer <API_KEY>`
- 목적: 외부 앱과 주전자닷컴 서비스 간 안전한 연동

## 설치
```bash
npm install @zuzunza/zetrafi
```

## 빠른 시작
```ts
import { ZetrafiClient } from "@zuzunza/zetrafi";

const client = new ZetrafiClient({
  apiKey: "ztrfi_xxx",
  baseUrl: "https://zuzunza.com",
  timeout: 30000
});

const posts = await client.getPosts({ page: 1, perPage: 20 });
```

## 주요 기능
- API 키 발급/조회/폐기
- 게시글/댓글/유저/게임/카테고리 조회
- 사용자 액션(쓰기) 요청 지원 및 레이트 리밋 처리
- game-cloud: 게임 전용 데이터베이스/함수/유저 공개 데이터 조회

## 문서
- 자세한 명세는 `zetrafi.wiki/Home.md`를 참고하세요.

## 빌드/배포 준비
```bash
# 타입스크립트 → dist 빌드
npm run build

# 로컬 패킹 확인
npm pack
```

## 라이선스
AGPL
