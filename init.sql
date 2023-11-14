CREATE TABLE guild (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE encounter (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  date VARCHAR(255),
  link VARCHAR(255),
  guild_id INTEGER,
  FOREIGN KEY (guild_id) REFERENCES guild (id)
);

CREATE TABLE player (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    guild_id INTEGER,
    FOREIGN KEY (guild_id) REFERENCES guild (id)
);

CREATE TABLE encounter_notification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER
);

CREATE TABLE item (
    id SERIAL,
    title VARCHAR(255),
    link VARCHAR(255),
    encounter_id INTEGER,
    FOREIGN KEY (encounter_id) REFERENCES encounter (id)
);
