import React, { createContext, useContext, useState } from 'react';

const ArticleContext = createContext();

export const useArticle = () => {
  const context = useContext(ArticleContext);
  if (!context) {
    throw new Error('useArticle must be used within ArticleProvider');
  }
  return context;
};

export const ArticleProvider = ({ children }) => {
  const [articleStats, setArticleStats] = useState({});

  const updateArticleStats = (articleId, stats) => {
    setArticleStats(prev => ({
      ...prev,
      [articleId]: { ...prev[articleId], ...stats }
    }));
  };

  const getArticleStats = (articleId) => {
    return articleStats[articleId] || {};
  };

  return (
    <ArticleContext.Provider value={{
      updateArticleStats,
      getArticleStats
    }}>
      {children}
    </ArticleContext.Provider>
  );
};