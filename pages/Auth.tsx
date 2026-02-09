import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { Button } from '../components/Button';
import { User } from '../types';

export const Auth: React.FC<{ isRegister?: boolean }> = ({ isRegister = false }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (isRegister) {
      // Fake register: just save to a separate users list if we were real, 
      // but for this simplified scope, we just log them in immediately as if registered.
      const newUser: User = { username, password };
      // In a real local-only app, you'd check if user exists in a "users" array in localStorage.
      // Here we simplify:
      localStorage.setItem(`user_${username}`, JSON.stringify(newUser));
      login(newUser);
      navigate('/thu-vien');
    } else {
      // Fake login
      const stored = localStorage.getItem(`user_${username}`);
      if (stored) {
        const user = JSON.parse(stored);
        if (user.password === password) {
          login(user);
          navigate('/thu-vien');
        } else {
          setError('Sai mật khẩu');
        }
      } else {
        // For UX in this demo, auto-register if not found or show error
        setError('Tài khoản không tồn tại. Vui lòng đăng ký.');
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-lg shadow-xl border border-gray-800">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">
          {isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
        </h2>
        
        {error && <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded p-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded p-2 focus:border-primary focus:outline-none"
            />
          </div>

          <Button type="submit" className="w-full mt-4">
            {isRegister ? 'Đăng Ký' : 'Đăng Nhập'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <button 
            onClick={() => navigate(isRegister ? '/dang-nhap' : '/dang-ky')}
            className="text-primary hover:underline"
          >
            {isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
          </button>
        </p>
      </div>
    </div>
  );
};