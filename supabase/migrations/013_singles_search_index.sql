-- Indexes for server-side singles filtering and pagination

-- Composite index for the most common filter combination
create index if not exists singles_filter_idx
  on singles (status, gender, hashkafa, plans);

-- Index for name-based sorting and searching
create index if not exists singles_name_idx
  on singles (first_name, last_name);

-- GIN index for full-text search across name + city
create index if not exists singles_search_gin
  on singles using gin (
    to_tsvector('english',
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name,  '') || ' ' ||
      coalesce(city,       '')
    )
  );
