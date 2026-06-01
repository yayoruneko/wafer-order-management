import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setSession } from '../auth/tokenStorage'; // 👈 改引入這個大絕招方法

export default function OAuth2Redirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. 從網址列抓取 ?token= 後面的超長 JWT 字串
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      try {
        // 2. 這是最酷的部分：JWT 的中間段就是 payload，我們直接用原生 JavaScript 將它解碼
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // 從你剛剛日誌裡的 Token 結構可以看到，裡面有 sub (Email) 和 role (權限)
        const mockUser = {
          username: payload.sub,      // 例如：miracul9228@gmail.com
          role: payload.role,          // 例如：VIEWER
          displayName: payload.sub.split('@')[0] // 拔出 @ 前面的字當名字
        };

        // 3. 呼叫你們系統最強的儲存方法，把 Token、User 一次填滿！

        setSession({
          accessToken: token,
          refreshToken: null, // OAuth2 暫時沒傳的話放 null
          user: mockUser,
          remember: true
        });

        // 4. 身分證明，強制重刷首頁，
        window.location.replace('/');
      } catch (e) {
        console.error('解析 Token 失敗', e);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, location]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F5F1E8' }}>
      <h2 style={{ color: '#444', fontFamily: 'sans-serif' }}>SSO 登入成功，正在建立身分驗證...</h2>
    </div>
  );
}