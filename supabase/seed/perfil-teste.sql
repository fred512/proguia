-- MASSA DE TESTE — não é migração.
--
-- Copia os dados que hoje estão hardcoded em pages/index.vue para a conta
-- tanaportaria@gmail.com, só para exercitar edição, upload e a página pública
-- com conteúdo real. A Marcia terá conta própria via convite.
--
-- Rode no SQL Editor do dashboard. Aqui você é `postgres`, então alcança
-- colunas que o painel não alcança (slug, published).
--
-- Para desfazer: veja o bloco comentado no fim.

do $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where email = 'tanaportaria@gmail.com';
  if v_uid is null then
    raise exception 'Conta tanaportaria@gmail.com não encontrada. Faça login com ela primeiro.';
  end if;

  update public.guides
     set name       = 'Marcia Marianno Machado',
         languages  = 'Português e Español',
         region     = 'Tríplice Fronteira · Paraguai',
         group_limit = 6,
         bio        = 'Guia local especializada na Tríplice Fronteira. Cada experiência é desenhada com atenção ao ritmo, aos interesses e ao tamanho de cada grupo.',
         photo_url  = '/images/marcia-marianno-machado.jpg',
         -- O trigger nunca regera slug existente, de propósito: link já
         -- compartilhado não pode quebrar quando alguém edita o nome. Como
         -- isto é massa de teste, forço para o endereço bater com o nome.
         slug       = 'marcia-marianno-machado',
         published  = true
   where id = v_uid;

  delete from public.routes where guide_id = v_uid;

  insert into public.routes
    (guide_id, title, category, description, price_per_day, capacity, cover_image, highlights, gallery, position)
  values
  (
    v_uid,
    'Compras sem pressa',
    'Compras',
    'Curadoria de lojas, shoppings e achados em Ciudad del Este, no ritmo do seu grupo.',
    320, 6,
    'https://commons.wikimedia.org/wiki/Special:FilePath/Shopping%20Paris%20105451%20HDR.jpg?width=1200',
    array['Shopping Paris', 'Cellshop', 'SAX Department Store'],
    '[
      {"label":"Shopping Paris","image":"https://commons.wikimedia.org/wiki/Special:FilePath/Shopping%20Paris%20105451%20HDR.jpg?width=1200","credit":"Cmasi","license":"CC BY-SA 4.0","source":"https://commons.wikimedia.org/wiki/File:Shopping_Paris_105451_HDR.jpg"},
      {"label":"Shopping del Este","image":"https://commons.wikimedia.org/wiki/Special:FilePath/Shopping%20Del%20Este%20%28Ciudad%20Del%20Este%29%2C%20Paraguay.jpg?width=1200","credit":"Flaviohmg","license":"CC BY-SA 4.0","source":"https://commons.wikimedia.org/wiki/File:Shopping_Del_Este_(Ciudad_Del_Este),_Paraguay.jpg"},
      {"label":"Cellshop","image":"https://commons.wikimedia.org/wiki/Special:FilePath/Cell%20Shop%20081117%20HDR.jpg?width=1200","credit":"Cmasi","license":"CC BY-SA 4.0","source":"https://commons.wikimedia.org/wiki/File:Cell_Shop_081117_HDR.jpg"},
      {"label":"SAX","image":"https://commons.wikimedia.org/wiki/Special:FilePath/SAX%20105148.jpg?width=1200","credit":"Cmasi","license":"CC BY-SA 4.0","source":"https://commons.wikimedia.org/wiki/File:SAX_105148.jpg"}
    ]'::jsonb,
    1
  ),
  (
    v_uid,
    'Gigantes da fronteira',
    'Turismo',
    'Paisagens, histórias e símbolos da região guiados por quem realmente conhece cada detalhe.',
    390, 6,
    'https://commons.wikimedia.org/wiki/Special:FilePath/Itaipu%20Dam.jpg?width=1200',
    array['Itaipu Binacional', 'Marco das Três Fronteiras', 'Cataratas'],
    '[
      {"label":"Itaipu Binacional","image":"https://commons.wikimedia.org/wiki/Special:FilePath/Itaipu%20Dam.jpg?width=1200","credit":"bergie","license":"CC BY-SA 2.0","source":"https://commons.wikimedia.org/wiki/File:Itaipu_Dam.jpg"},
      {"label":"Marco das Três Fronteiras","image":"https://commons.wikimedia.org/wiki/Special:FilePath/Hito%20de%20las%20Tres%20Fronteras%20PARAGUAY.jpg?width=1200","credit":"SamirNosteb, obra derivada de Diego HC","license":"CC BY-SA 3.0","source":"https://commons.wikimedia.org/wiki/File:Hito_de_las_Tres_Fronteras_PARAGUAY.jpg"},
      {"label":"Cataratas do Iguaçu","image":"https://commons.wikimedia.org/wiki/Special:FilePath/Iguaz%C3%BA%20falls.jpg?width=1200","credit":"Enrique von Specht","license":"CC BY-SA 4.0","source":"https://commons.wikimedia.org/wiki/File:Iguaz%C3%BA_falls.jpg"},
      {"label":"Itaipu panorâmica","image":"https://commons.wikimedia.org/wiki/Special:FilePath/Itaipu%20Dam%20-b.jpg?width=1200","credit":"Alicia Nijdam","license":"CC BY 2.0","source":"https://commons.wikimedia.org/wiki/File:Itaipu_Dam_-b.jpg"}
    ]'::jsonb,
    2
  ),
  (
    v_uid,
    'O melhor dos dois mundos',
    'Turismo + Compras',
    'Uma experiência equilibrada entre descobertas, paisagens marcantes e compras inteligentes.',
    450, 5,
    'https://commons.wikimedia.org/wiki/Special:FilePath/1%20iguazu%20falls.jpg?width=1200',
    array['Ciudad del Este', 'Itaipu Binacional', 'Marco das Três Fronteiras'],
    '[
      {"label":"Cataratas do Iguaçu","image":"https://commons.wikimedia.org/wiki/Special:FilePath/1%20iguazu%20falls.jpg?width=1200","credit":"chensiyuan","license":"CC BY-SA 4.0","source":"https://commons.wikimedia.org/wiki/File:1_iguazu_falls.jpg"},
      {"label":"Itaipu Binacional","image":"https://commons.wikimedia.org/wiki/Special:FilePath/Itaipu%20Dam.jpg?width=1200","credit":"bergie","license":"CC BY-SA 2.0","source":"https://commons.wikimedia.org/wiki/File:Itaipu_Dam.jpg"},
      {"label":"Shopping del Este","image":"https://commons.wikimedia.org/wiki/Special:FilePath/Shopping%20Del%20Este%20%28Ciudad%20Del%20Este%29%2C%20Paraguay.jpg?width=1200","credit":"Flaviohmg","license":"CC BY-SA 4.0","source":"https://commons.wikimedia.org/wiki/File:Shopping_Del_Este_(Ciudad_Del_Este),_Paraguay.jpg"},
      {"label":"Marco das Três Fronteiras","image":"https://commons.wikimedia.org/wiki/Special:FilePath/Hito%20de%20las%20Tres%20Fronteras%20PARAGUAY.jpg?width=1200","credit":"SamirNosteb, obra derivada de Diego HC","license":"CC BY-SA 3.0","source":"https://commons.wikimedia.org/wiki/File:Hito_de_las_Tres_Fronteras_PARAGUAY.jpg"}
    ]'::jsonb,
    3
  );

  raise notice 'Perfil e 3 roteiros gravados para %', v_uid;
end $$;

-- Confira:
--   select name, slug, region, published from public.guides;
--   select title, price_per_day, capacity, jsonb_array_length(gallery) from public.routes order by position;

-- Para limpar a massa de teste:
--   delete from public.routes
--    where guide_id = (select id from auth.users where email = 'tanaportaria@gmail.com');
