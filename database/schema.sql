create table users (
  id bigserial primary key,
  wechat_openid varchar(128) unique not null,
  unionid varchar(128),
  nickname varchar(128),
  avatar_url text,
  university_id bigint,
  programme_id bigint,
  major_id bigint,
  minor_id bigint,
  curriculum_year varchar(16),
  current_year int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table universities (
  id bigserial primary key,
  code varchar(32) unique not null,
  name_en varchar(255) not null,
  name_zh varchar(255),
  official_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table faculties (
  id bigserial primary key,
  university_id bigint not null references universities(id),
  name_en varchar(255) not null,
  name_zh varchar(255),
  official_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table programmes (
  id bigserial primary key,
  university_id bigint not null references universities(id),
  faculty_id bigint references faculties(id),
  code varchar(64) not null,
  name_en varchar(255) not null,
  name_zh varchar(255),
  degree_level varchar(32) not null,
  normal_duration_years int,
  total_credit_required numeric(8, 2),
  curriculum_year varchar(16) not null,
  official_url text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_id, code, curriculum_year)
);

create table majors (
  id bigserial primary key,
  programme_id bigint not null references programmes(id),
  code varchar(64) not null,
  name_en varchar(255) not null,
  name_zh varchar(255),
  official_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_id, code)
);

create table courses (
  id bigserial primary key,
  university_id bigint not null references universities(id),
  faculty_id bigint references faculties(id),
  department varchar(255),
  course_code varchar(64) not null,
  title_en varchar(255) not null,
  title_zh varchar(255),
  credits numeric(8, 2) not null,
  course_level varchar(32),
  language varchar(64),
  description text,
  semester varchar(128),
  is_exchange_friendly boolean,
  official_url text not null,
  source_updated_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_id, course_code)
);

create table programme_requirements (
  id bigserial primary key,
  programme_id bigint not null references programmes(id),
  major_id bigint references majors(id),
  curriculum_year varchar(16) not null,
  requirement_type varchar(64) not null,
  name varchar(255) not null,
  required_credits numeric(8, 2),
  required_course_count int,
  rule_json jsonb not null default '{}'::jsonb,
  official_url text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table requirement_courses (
  id bigserial primary key,
  requirement_id bigint not null references programme_requirements(id) on delete cascade,
  course_id bigint not null references courses(id),
  is_required boolean not null default false,
  group_name varchar(128),
  recommended_year int,
  recommended_semester varchar(64),
  unique (requirement_id, course_id)
);

create table course_prerequisites (
  id bigserial primary key,
  course_id bigint not null references courses(id) on delete cascade,
  prerequisite_course_id bigint references courses(id),
  prerequisite_text text not null,
  rule_json jsonb,
  created_at timestamptz not null default now()
);

create table course_exclusions (
  id bigserial primary key,
  course_id bigint not null references courses(id) on delete cascade,
  excluded_course_id bigint references courses(id),
  exclusion_text text not null,
  created_at timestamptz not null default now()
);

create table user_completed_courses (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  course_id bigint references courses(id),
  course_code_text varchar(64),
  credits numeric(8, 2),
  grade varchar(16),
  completed_term varchar(64),
  created_at timestamptz not null default now()
);

create table user_favorite_courses (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  course_id bigint not null references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table course_reviews (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  course_id bigint not null references courses(id) on delete cascade,
  difficulty_score int check (difficulty_score between 1 and 5),
  workload_score int check (workload_score between 1 and 5),
  grading_score int check (grading_score between 1 and 5),
  comment text,
  status varchar(32) not null default 'pending',
  created_at timestamptz not null default now()
);

create table study_plans (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  name varchar(255) not null,
  target_graduation_year varchar(16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table study_plan_courses (
  id bigserial primary key,
  study_plan_id bigint not null references study_plans(id) on delete cascade,
  course_id bigint not null references courses(id),
  planned_year int,
  planned_semester varchar(64),
  status varchar(32) not null default 'planned',
  unique (study_plan_id, course_id)
);

create index idx_courses_search on courses using gin (
  to_tsvector('english', course_code || ' ' || title_en || ' ' || coalesce(title_zh, ''))
);

create index idx_requirements_programme_major on programme_requirements(programme_id, major_id, curriculum_year);
