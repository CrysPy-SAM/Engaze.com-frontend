jest.mock("axios", () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }),
  put: jest.fn(),
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
}));

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Engaze application successfully', () => {
  render(<App />);
  const elements = screen.getAllByText(/Engaze/i);
  expect(elements.length).toBeGreaterThan(0);
});
