CREATE TABLE IF NOT EXISTS noteful_folders (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY, 
    date_created TIMESTAMPTZ NOT NULL DEFAULT now() ,
    folder_name TEXT NOT NULL 
);

CREATE TABLE IF NOT EXISTS noteful_notes (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY, 
    date_created TIMESTAMPTZ NOT NULL DEFAULT now() ,
    note_name TEXT NOT NULL, 
    content TEXT NOT NULL ,
    folder_id INTEGER REFERENCES noteful_folders(id) ON DELETE CASCADE NOT NULL
);