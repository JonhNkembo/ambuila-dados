-- =====================================================================
-- AMBÚILA DATA – Dados iniciais (DEMONSTRAÇÃO) extraídos do modelo HTML
-- Executar depois de 0001_schema.sql e 0002_rls.sql
-- =====================================================================

insert into public.categories (id, icon, description, sort_order) values
('Demografia', 'users', 'População, sexo, idade, agregados familiares e densidade por comuna.', 1),
('Educação', 'graduation-cap', 'Rede escolar, alunos, docentes, salas de aula e taxas de escolarização.', 2),
('Saúde', 'heart-pulse', 'Unidades sanitárias, profissionais de saúde, camas e cobertura vacinal.', 3),
('Economia e negócios', 'briefcase', 'Empresas, mercados, comércio, emprego formal e licenciamento.', 4),
('Agricultura', 'sprout', 'Cooperativas, áreas cultivadas, produção e culturas estratégicas.', 5),
('Infraestruturas', 'construction', 'Estradas, pontes, água, energia e edifícios públicos.', 6),
('Ambiente e recursos naturais', 'trees', 'Áreas florestais, recursos hídricos, saneamento e gestão de resíduos.', 7),
('Cultura e património', 'landmark', 'Sítios históricos, tradições, grupos culturais e património imaterial.', 8),
('Administração pública', 'building-2', 'Serviços públicos, funcionários, registo civil e atendimento ao cidadão.', 9),
('Ciência e investigação', 'microscope', 'Estudos, projectos de investigação e parcerias académicas.', 10);

insert into public.communes (name, code, area_km2, status) values
('Sede de Ambuíla (Nova Ambuíla)', 'AMB-01', 2450, 'Activa'),
('Quipedro', 'AMB-02', 1890, 'Activa');

insert into public.institutions (name, type, commune, contact) values
('Administração Municipal de Ambuíla (GEPE)', 'Órgão Municipal', 'Sede de Ambuíla (Nova Ambuíla)', 'gepe@ambuila.uige.gov.ao'),
('Direcção Municipal de Educação de Ambuíla', 'Direcção Sectorial', 'Sede de Ambuíla (Nova Ambuíla)', 'educacao@ambuila.uige.gov.ao'),
('Direcção Municipal de Saúde de Ambuíla', 'Direcção Sectorial', 'Sede de Ambuíla (Nova Ambuíla)', 'saude@ambuila.uige.gov.ao'),
('Repartição Municipal de Agricultura e Desenvolvimento Rural', 'Repartição Técnica', 'Quipedro', 'agricultura@ambuila.uige.gov.ao'),
('Repartição de Comércio, Indústria e Recursos', 'Repartição Técnica', 'Sede de Ambuíla (Nova Ambuíla)', 'economia@ambuila.uige.gov.ao');

insert into public.datasets (name, description, category, institution, commune, source, year, collected_at, updated_at, author, file_name, license, status, is_demo, metrics) values
('Estimativa Demográfica Municipal por Comuna (Série Base)', 'Consolidação demonstrativa da população residente, agregados familiares e distribuição territorial nas comunas de Sede de Ambuíla (Nova Ambuíla) e Quipedro.', 'Demografia', 'Administração Municipal de Ambuíla (GEPE)', 'Sede de Ambuíla (Nova Ambuíla)', 'Gabinete de Estudos, Planeamento e Estatística', 2025, '2025-11-10', '2026-01-15', 'Dr. António Mateus', 'demografia_ambuila_2025.csv', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"populacao":24800,"agregados":4650,"taxaCrescimento":2.6}'::jsonb),
('Censo Demográfico Complementar – Comuna de Quipedro', 'Levantamento demonstrativo de agregados familiares e população residente nas regedorias da Comuna de Quipedro.', 'Demografia', 'Administração Municipal de Ambuíla (GEPE)', 'Quipedro', 'Administração Comunal de Quipedro', 2026, '2026-02-12', '2026-03-01', 'Eng.ª Joana Nzinga', 'demografia_quipedro_2026.xlsx', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"populacao":14200,"agregados":2710,"taxaCrescimento":2.3}'::jsonb),
('Cadastro da Rede Escolar, Alunos e Docentes – Ambuíla Sede', 'Levantamento das escolas primárias e do I Ciclo do ensino secundário na Sede Municipal (Nova Ambuíla), salas de aula, docentes colocados e alunos matriculados.', 'Educação', 'Direcção Municipal de Educação de Ambuíla', 'Sede de Ambuíla (Nova Ambuíla)', 'Direcção Municipal de Educação', 2026, '2026-03-05', '2026-03-20', 'Prof. Manuel Kiaku', 'rede_escolar_sede_2026.csv', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"escolas":18,"alunos":5420,"professores":164,"salas":82}'::jsonb),
('Levantamento Escolar da Comuna de Quipedro', 'Registo das infraestruturas escolares e efectivos discentes na Comuna de Quipedro.', 'Educação', 'Direcção Municipal de Educação de Ambuíla', 'Quipedro', 'Direcção Municipal de Educação', 2026, '2026-04-02', '2026-04-10', 'Prof. Manuel Kiaku', 'escolas_quipedro_2026.xlsx', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"escolas":11,"alunos":2890,"professores":86,"salas":44}'::jsonb),
('Mapeamento das Unidades Sanitárias e Recursos Humanos de Saúde', 'Inventário do Hospital Municipal, Centros de Saúde e Postos Sanitários activos na Sede de Ambuíla.', 'Saúde', 'Direcção Municipal de Saúde de Ambuíla', 'Sede de Ambuíla (Nova Ambuíla)', 'Direcção Municipal de Saúde', 2026, '2026-02-20', '2026-03-14', 'Eng.ª Joana Nzinga', 'unidades_sanitarias_2026.csv', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"unidadesSanitarias":7,"profissionaisSaude":62,"camas":48}'::jsonb),
('Postos de Saúde Rurais – Comuna de Quipedro', 'Submissão técnica sobre postos sanitários periféricos e equipas de enfermagem na Comuna de Quipedro.', 'Saúde', 'Direcção Municipal de Saúde de Ambuíla', 'Quipedro', 'Centro de Saúde de Quipedro', 2026, '2026-05-01', '2026-05-01', 'Prof. Manuel Kiaku', 'postos_quipedro_2026.pdf', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Em Validação', true, '{"unidadesSanitarias":4,"profissionaisSaude":19,"camas":12}'::jsonb),
('Registo Comercial, Mercados e Empresas Licenciadas', 'Levantamento de estabelecimentos comerciais, microempresas e mercados municipais em actividade.', 'Economia e negócios', 'Repartição de Comércio, Indústria e Recursos', 'Sede de Ambuíla (Nova Ambuíla)', 'Repartição Municipal de Comércio', 2025, '2025-10-15', '2025-12-02', 'Lic. Pedro Kiala', 'empresas_mercados_2025.csv', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"empresas":94,"mercados":5,"empregosFormais":410}'::jsonb),
('Produção Agrícola, Cooperativas e Culturas Estratégicas', 'Dados sobre cooperativas camponesas, áreas cultivadas e produção anual de mandioca, café robusta, ginguba e banana.', 'Agricultura', 'Repartição Municipal de Agricultura e Desenvolvimento Rural', 'Quipedro', 'Estação de Desenvolvimento Agrário (EDA)', 2026, '2026-04-18', '2026-05-04', 'Eng.ª Joana Nzinga', 'producao_agricola_2026.xlsx', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"cooperativas":26,"areaCultivadaHa":1840,"producaoToneladas":4620,"principaisCulturas":"Mandioca, Café Robusta, Ginguba, Banana, Feijão"}'::jsonb),
('Inventário de Vias Terciárias, Pontes e Pontos de Água', 'Cadastro das estradas municipais, pontecos reabilitados e furos de água comunitários.', 'Infraestruturas', 'Administração Municipal de Ambuíla (GEPE)', 'Sede de Ambuíla (Nova Ambuíla)', 'Direcção Municipal de Infraestruturas', 2026, '2026-05-10', '2026-05-10', 'Dr. António Mateus', 'infraestruturas_2026.csv', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Submetido', true, '{"estradasKm":78,"pontosAgua":24,"edificiosPublicos":17}'::jsonb),
('Património Histórico da Batalha de Ambuíla (1665) e Sítios Culturais', 'Inventário dos marcos históricos, tradições culturais e património imaterial do Município de Ambuíla.', 'Cultura e património', 'Administração Municipal de Ambuíla (GEPE)', 'Sede de Ambuíla (Nova Ambuíla)', 'Secção Municipal de Cultura e Turismo', 2025, '2025-09-22', '2025-10-05', 'MSc. Beatriz Domingos', 'patrimonio_ambuila.pdf', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"sitiosHistoricos":6,"gruposCulturais":11}'::jsonb);

insert into public.projects (name, sector, commune, year, budget, progress, status, is_demo) values
('Reabilitação do Troço Rodoviário Nova Ambuíla – Quipedro', 'Infraestruturas', 'Quipedro', 2026, '145.000.000 Kz', 65, 'Em Execução', true),
('Ampliação e Apetrechamento da Escola Primária Nº 4', 'Educação', 'Sede de Ambuíla (Nova Ambuíla)', 2026, '58.000.000 Kz', 85, 'Em Execução', true),
('Construção de 8 Furos de Água Potável Comunitários', 'Infraestruturas', 'Quipedro', 2025, '32.000.000 Kz', 100, 'Concluído', true),
('Programa de Fomento ao Café Robusta e Cooperativismo', 'Agricultura', 'Sede de Ambuíla (Nova Ambuíla)', 2026, '44.500.000 Kz', 40, 'Em Execução', true);

insert into public.locations (name, category, commune, lat, lng, description, is_demo) values
('Administração Municipal de Ambuíla', 'Infraestruturas', 'Sede de Ambuíla (Nova Ambuíla)', -7.4333, 14.6667, 'Sede institucional da Administração Municipal em Nova Ambuíla e Gabinete de Estatística.', true),
('Hospital Municipal de Ambuíla', 'Saúde', 'Sede de Ambuíla (Nova Ambuíla)', -7.4365, 14.671, 'Unidade hospitalar de referência municipal com internamento e urgências.', true),
('Escola Secundária do I Ciclo de Ambuíla', 'Educação', 'Sede de Ambuíla (Nova Ambuíla)', -7.4295, 14.6625, 'Estabelecimento público de ensino secundário.', true),
('Centro de Saúde Comunal de Quipedro', 'Saúde', 'Quipedro', -7.512, 14.585, 'Unidade sanitária de referência da Comuna de Quipedro.', true),
('Pólo Agrícola e Cooperativa de Quipedro', 'Agricultura', 'Quipedro', -7.525, 14.602, 'Zona de produção de mandioca, café e apoio técnico agrário.', true),
('Mercado Municipal Central de Ambuíla', 'Infraestruturas', 'Sede de Ambuíla (Nova Ambuíla)', -7.435, 14.664, 'Principal centro de escoamento e comercialização agrícola.', true),
('Obra de Reabilitação Vial Sede – Quipedro', 'Projectos', 'Quipedro', -7.472, 14.624, 'Frente de obra de terraplanagem e drenagem.', true);

-- Fotos, destaques, números em grande e notícias NÃO têm dados iniciais:
-- são inseridos pelo Superadministrador em Painel → Conteúdo do Portal.
