import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-6">
        <AlertTriangle className="w-16 h-16 text-red-500" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Trang không tìm thấy</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        Đường dẫn bạn truy cập không tồn tại hoặc đã bị xóa. Vui lòng kiểm tra lại URL.
      </p>
      <Link to="/">
        <Button className="gap-2">
          <Home size={18} />
          Về Trang Chủ
        </Button>
      </Link>
    </div>
  );
};