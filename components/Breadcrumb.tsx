import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { BreadCrumbItem } from '../types';

interface BreadcrumbProps {
  crumbs?: BreadCrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ crumbs }) => {
  if (!crumbs || crumbs.length === 0) return null;

  return (
    <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap gap-2">
      <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
        <Home size={14} /> Trang chủ
      </Link>
      
      {crumbs.map((crumb, index) => {
        // Skip current item if it's the last one (we render it differently)
        const isLast = index === crumbs.length - 1;

        let link = '#';
        if (crumb.path) {
            link = crumb.path;
        } else if (crumb.slug) {
            // Check if slug is already an absolute path (API quirk)
            if (crumb.slug.startsWith('/')) {
                link = crumb.slug;
            } else {
                link = `/danh-sach/${crumb.slug}`;
            }
        }

        return (
          <React.Fragment key={index}>
            <ChevronRight size={14} className="text-gray-400 dark:text-gray-600" />
            {isLast || crumb.isCurrent ? (
              <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]" title={crumb.name}>
                {crumb.name}
              </span>
            ) : (
              <Link 
                to={link} 
                className="hover:text-primary transition-colors truncate max-w-[150px]"
              >
                {crumb.name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};