-- Insert sample email list
INSERT INTO email_lists (name, description)
VALUES ('Lista Principal', 'Lista principal de contactos')
ON CONFLICT DO NOTHING;

-- Insert sample contacts
INSERT INTO contacts (email, first_name, last_name)
VALUES 
  ('test1@example.com', 'Usuario', 'Prueba 1'),
  ('test2@example.com', 'Usuario', 'Prueba 2'),
  ('test3@example.com', 'Usuario', 'Prueba 3')
ON CONFLICT (email) DO NOTHING;
