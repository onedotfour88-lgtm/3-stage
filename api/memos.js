import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const memoryStore = new Map();

function parseToken(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

async function getAuthUser(req) {
  const token = parseToken(req);
  if (!token) return null;

  const supabaseUrl = process.env.SUPABASE_URL || 'https://igumgbitelfytidliydi.supabase.co';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_8J_Z3OYMltWvyo5GbHOr_w_7SKxVPTE';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch (err) {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 무로그인 요청 시 401 반환
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: 로그인 토큰이 유효하지 않거나 없습니다.' });
  }

  const owner_id = user.id;
  if (!memoryStore.has(owner_id)) {
    memoryStore.set(owner_id, []);
  }
  const userMemos = memoryStore.get(owner_id);

  const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
  const memoId = urlParts.length > 2 ? urlParts[2] : null;

  // GET
  if (req.method === 'GET') {
    if (memoId) {
      const memo = userMemos.find(m => m.id === memoId);
      if (!memo) return res.status(404).json({ error: 'Memo Not Found' });
      return res.status(200).json({ id: memo.id, title: memo.title, body: memo.body });
    } else {
      return res.status(200).json(userMemos.map(m => ({ id: m.id, title: m.title, body: m.body })));
    }
  }

  // POST
  if (req.method === 'POST') {
    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch(e){}
    }
    const id = bodyData?.id || crypto.randomUUID();
    const title = bodyData?.title || '제목 없음';
    const body = bodyData?.body || '';

    const newMemo = { id, title, body, owner_id };
    userMemos.push(newMemo);
    return res.status(201).json({ id, title, body });
  }

  // PUT
  if (req.method === 'PUT') {
    if (!memoId) return res.status(400).json({ error: 'Missing memo ID' });
    const idx = userMemos.findIndex(m => m.id === memoId);
    if (idx === -1) return res.status(404).json({ error: 'Memo Not Found' });

    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch(e){}
    }
    userMemos[idx].title = bodyData?.title ?? userMemos[idx].title;
    userMemos[idx].body = bodyData?.body ?? userMemos[idx].body;

    return res.status(200).json({ id: userMemos[idx].id, title: userMemos[idx].title, body: userMemos[idx].body });
  }

  // DELETE
  if (req.method === 'DELETE') {
    if (!memoId) return res.status(400).json({ error: 'Missing memo ID' });
    const idx = userMemos.findIndex(m => m.id === memoId);
    if (idx === -1) return res.status(404).json({ error: 'Memo Not Found' });

    userMemos.splice(idx, 1);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}