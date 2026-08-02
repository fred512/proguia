-- Armazenamento das fotos de perfil.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guide-photos',
  'guide-photos',
  true,
  3145728, -- 3 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- O bucket é público para leitura: a foto aparece no site sem sessão.
create policy "guide_photos_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'guide-photos');

-- Escrita restrita à própria pasta. O caminho do arquivo tem que começar com
-- o uid de quem envia — sem isso, uma guia autenticada sobrescreveria a foto
-- de outra só mudando o nome do arquivo no upload.
create policy "guide_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'guide-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "guide_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'guide-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "guide_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'guide-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
