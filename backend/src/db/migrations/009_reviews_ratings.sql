create table if not exists order_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  reviewer_id uuid not null references users(id) on delete cascade,
  performer_id uuid not null references users(id) on delete cascade,
  rating integer not null,
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_reviews_rating_chk check (rating between 1 and 5),
  constraint order_reviews_comment_chk check (length(trim(comment)) >= 10),
  constraint order_reviews_not_self_chk check (reviewer_id <> performer_id),
  unique (order_id, reviewer_id)
);

create index if not exists order_reviews_performer_id_created_at_idx
  on order_reviews(performer_id, created_at desc);
create index if not exists order_reviews_reviewer_id_idx on order_reviews(reviewer_id);
