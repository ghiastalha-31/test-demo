import React from 'react';
import { render, act } from '@testing-library/react';
import { DataProvider, useData } from '../state/DataContext';

// Mock fetch globally
global.fetch = jest.fn();

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

function TestComponent() {
  const { items, total, fetchItems } = useData();

  React.useEffect(() => {
    fetchItems({ page: 1, limit: 20, q: '' });
  }, [fetchItems]);

  return (
    <div>
      <p data-testid="items-count">{items.length}</p>
      <p data-testid="total-count">{total}</p>
    </div>
  );
}

describe('DataContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and sets items + total on success', async () => {
    const mockData = [{ id: 1, name: 'Item 1' }];
    fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue(mockData),
    });

    const { getByTestId } = render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await act(async () => {}); // Wait for useEffect + fetch to resolve

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/items?page=1&limit=20&q='),
      expect.any(Object)
    );
    expect(getByTestId('items-count').textContent).toBe('1');
    expect(getByTestId('total-count').textContent).toBe('1');
  });

  it('handles fetch errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByTestId } = render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await act(async () => {}); // Wait for error to be caught

    expect(getByTestId('items-count').textContent).toBe('0');
    expect(getByTestId('total-count').textContent).toBe('0');
  });

  it('aborts previous fetch when a new one starts', async () => {
    const abortController = { abort: jest.fn(), signal: {} };
    global.AbortController = jest.fn(() => abortController);

    fetch.mockResolvedValue({ json: jest.fn().mockResolvedValue([]) });

    function MultiFetchComponent() {
      const { fetchItems } = useData();
      React.useEffect(() => {
        fetchItems({ page: 1 });
        fetchItems({ page: 2 });
      }, [fetchItems]);
      return null;
    }

    render(
      <DataProvider>
        <MultiFetchComponent />
      </DataProvider>
    );

    await act(async () => {});

    expect(abortController.abort).toHaveBeenCalledTimes(1);
  });
});
