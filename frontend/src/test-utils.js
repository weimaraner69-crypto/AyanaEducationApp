/**
 * 統合テスト共通ヘルパー
 * App を MemoryRouter でラップしてレンダリングするユーティリティ
 */
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

/**
 * App コンポーネントを MemoryRouter でラップしてレンダリングするヘルパー
 * @param {string[]} initialEntries - 初期ルートパス（デフォルト: /login）
 */
export const renderApp = (initialEntries = ['/login']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
