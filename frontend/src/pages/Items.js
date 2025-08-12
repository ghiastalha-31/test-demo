import React, { useEffect, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';

function Items() {
  const { items, total, fetchItems } = useData();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchItems({ page, limit: 20, q }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [page, q, fetchItems]);


  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="items-container">
      <div className="items-controls">
        <input
          type="text"
          placeholder="Search..."
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
      </div>

      {loading ? (
        <div className="loading">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      ) : (
        <ul className="items-list">
          {items && items.map((item) => (
            <li key={item.id}>
              <Link to={`/items/${item.id}`}>{item.name}</Link>
            </li>
          ))}
        </ul>
      )}

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export default Items;
