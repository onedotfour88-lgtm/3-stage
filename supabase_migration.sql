-- 1. memos 테이블 생성 (owner_id는 uuid 타입으로 설정하되 auth.users 외래키 미설정)
CREATE TABLE IF NOT EXISTS public.memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID
);

-- 2. Row Level Security (RLS) 활성화
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

-- 3. anon 및 authenticated 역할의 모든 테이블 접근 권한(SELECT, INSERT, UPDATE, DELETE) 차단 정책
-- (기본적으로 RLS가 켜지면 정책이 없을 때 접근 불가이지만 명시적 차단/제한 정책을 설정합니다)
CREATE POLICY "No access for anon and authenticated" 
ON public.memos 
FOR ALL 
TO anon, authenticated 
USING (false);

-- 4. 기존 data.json의 가상 메모 3건 데이터 이전 (서비스 키로만 접근 가능)
INSERT INTO public.memos (title, content) VALUES
('프로젝트 일정 점검', '다음 주 보안 감사 전까지 백엔드 API 모듈 최적화 및 테스트 완료할 것.'),
('서버 인프라 점검', 'Vercel 서버리스 함수 호출 제한 및 환경변수 설정 상태 재확인 필요.'),
('팀 내부 미팅 공유', '금요일 오후 보안 정책 가이드라인 개정 건으로 전체 팀원 회의 예정.');