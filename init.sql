CREATE TABLE encounters (
  title VARCHAR(255),
  date VARCHAR(255),
  link VARCHAR(255),
  guild VARCHAR(255)
);

CREATE TABLE guild (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE player (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    guild_id INTEGER,
    FOREIGN KEY (guild_id) REFERENCES guild (id)
);
