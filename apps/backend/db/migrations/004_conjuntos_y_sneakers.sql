-- =====================================================================
-- 004 · Conjuntos deportivos y sneakers (30 productos)
--
-- Se aplica con `npm run db:migrate`, que la registra en schema_migrations
-- y no la vuelve a ejecutar. Sirve para Neon y para la base local por igual.
--
-- Por qué una migración y no el dump: `db/dump-latest.sql` es un volcado con
-- --clean, o sea que hace DROP de las 16 tablas antes de recrearlas. Contra
-- producción eso borraría cuentas, pedidos y sesiones. Esto solo agrega.
--
-- Todo es idempotente: se puede correr varias veces sin duplicar ni romper.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 1. Los 30 productos.
--
-- ON CONFLICT DO NOTHING sin columna: cubre las tres restricciones únicas a
-- la vez (slug, authenticity_code y la clave primaria). Con `(slug)` a secas,
-- una fila con slug nuevo pero código repetido reventaría la migración.
-- ---------------------------------------------------------------------
INSERT INTO products (id, name, slug, category_id, brand, description, price_cents, stock, authenticity_code) VALUES
  ('109bd2db-2dfb-43ee-80b3-040bf09bedde', 'Under Armour Valsetz', 'under-armour-valsetz', 1, 'Under Armour', 'Bota táctica Under Armour Valsetz, resistente para uso urbano y outdoor. Tallas 38-44.', 210000, 11, 'VKT-VOKTER-UAVALSETZ-01'),
  ('5e8ea8c8-0d78-491a-979c-0c30a2eef8a5', 'Hoka Clifton 10', 'hoka-clifton-10', 1, 'Hoka', 'Tenis running Hoka Clifton 10, amortiguación suave para uso diario. Tallas 38-44.', 240000, 12, 'VKT-VOKTER-HOKACLIF10-01'),
  ('551d642c-f850-457c-a8c2-2e5dcea59068', 'Skechers Mocasín', 'skechers-mocasin', 1, 'Skechers', 'Mocasín casual Skechers, cómodo para uso diario. Tallas 38-44.', 210000, 20, 'VKT-VOKTER-SKECMOC01-01'),
  ('4456a81a-50f8-4e56-9e00-85a0c55a3343', 'Hoka Skyflow', 'hoka-skyflow', 1, 'Hoka', 'Tenis running Hoka Skyflow, ligero y responsivo para entrenamiento. Tallas 38-44.', 270000, 9, 'VKT-VOKTER-HOKASKYFLOW-01'),
  ('0abcd794-108a-489f-896b-da7c610e8859', 'Hoka Gaviota', 'hoka-gaviota', 1, 'Hoka', 'Tenis running Hoka Gaviota, soporte y estabilidad para pisada pronada. Tallas 38-44.', 260000, 14, 'VKT-VOKTER-HOKAGAVIOTA-01'),
  ('27f93f64-a93c-4205-b23e-804bd29b4f24', 'Hoka Bondi 9', 'hoka-bondi-9', 1, 'Hoka', 'Tenis running Hoka Bondi 9, máxima amortiguación para largas distancias. Tallas 38-44.', 270000, 10, 'VKT-VOKTER-HOKABONDI9-01'),
  ('6ca1ec68-b68f-4c30-9ca9-aa5674f749f5', 'LV Skate Sneakers', 'lv-skate-sneakers', 1, '', 'Tenis LV Skate Sneakers Tallas 35-43.', 210000, 11, 'VKT-VOKTER-URBAN01-01'),
  ('421910b4-9127-4238-a06b-59f6dd585caa', 'LV Trainer', 'lv-trainer', 1, 'Louis Vuitton', 'Tenis LV Trainer Tallas 35-43.', 190000, 12, 'VKT-VOKTER-VELCRO01-01'),
  ('466ef47d-5938-4a9a-80ae-6e3ad60c5bd9', 'Valentino V17n Bond', 'valentino-v17n-bond', 1, 'Valentino', 'Tenis Valentino V17n Bond. Tallas 35-43.', 170000, 15, 'VKT-VOKTER-CASUAL01-01'),
  ('599d4dc6-0d7f-4d86-9e7e-6271f90233a6', 'LV Archlight Trainer', 'lv-archlight-trainer', 1, 'Louis Vuitton', 'Tenis LV Archlight Trainer. Tallas 35-43.', 270000, 9, 'VKT-VOKTER-CHUNK01-01'),
  ('2c40c6b9-93aa-4805-bff6-b360063a3759', 'Valentino Garavani Diamante', 'valentino-garavani-diamante', 1, 'Valentino', 'Tenis Valentino Garavani Diamante. Tallas 35-43.', 270000, 10, 'VKT-VOKTER-SKATE02-01'),
  ('99136778-2b83-4e0f-a8d0-3901759011d2', 'Valentino Open Sneaker', 'valentino-open-sneaker', 1, 'Valentino', 'Tenis Valentino Open Sneaker. Tallas 35-43.', 180000, 13, 'VKT-VOKTER-TRAIN03-01'),
  ('34ae980e-ada8-4082-a087-c6ff9ce93e6f', 'Nike Conjunto Verde/Negro', 'nike-conjunto-verde-negro', 2, 'Nike', 'Conjunto deportivo Nike acolchado, verde y negro. Tallas S-XL.', 145000, 14, 'VKT-VOKTER-NIKEVERDE-01'),
  ('ec514607-8a58-4bad-8597-58c126562394', 'Nike 6976 Conjunto', 'nike-6976-conjunto', 2, 'Nike', 'Conjunto deportivo Nike, chaqueta y pantalón. Tallas XL-4XL.', 165000, 12, 'VKT-VOKTER-NIKE6976-01'),
  ('4fd1cc0c-9e3c-4ea7-b7fd-acd98a63e412', 'Adidas H-685 Conjunto Dama', 'adidas-h685-conjunto-dama', 2, 'Adidas', 'Conjunto deportivo Adidas para dama, buso y leggins. Tallas S-XL.', 150000, 15, 'VKT-VOKTER-ADIH685-01'),
  ('03bfc3c9-b6ea-43f8-ab2c-f77eff53be53', 'Nike N8805 Conjunto', 'nike-n8805-conjunto', 2, 'Nike', 'Conjunto deportivo Nike, chaqueta y pantalón. Tallas XL-4XL.', 165000, 12, 'VKT-VOKTER-NIKEN8805-01'),
  ('03ea46be-6558-4f6f-8237-3e54d61ad3e7', 'Nike Conjunto Rosa/Negro', 'nike-conjunto-rosa-negro', 2, 'Nike', 'Conjunto deportivo Nike acolchado, rosa y negro. Tallas S-XL.', 145000, 14, 'VKT-VOKTER-NIKEROSA-01'),
  ('a7d60352-d1c3-4320-a79d-00c79fa7c829', 'Nike H-89 Conjunto Dama', 'nike-h89-conjunto-dama', 2, 'Nike', 'Conjunto deportivo Nike para dama, buso y leggins. Tallas S-XL.', 150000, 15, 'VKT-VOKTER-NIKEH89-01'),
  ('8d593b0b-5dd9-474b-8679-60833dd373b3', 'Puma 3503 Conjunto', 'puma-3503-conjunto', 2, 'Puma', 'Conjunto deportivo Puma, chaqueta y pantalón. Tallas XL-4XL.', 150000, 12, 'VKT-VOKTER-PUMA3503-01'),
  ('1d1556cf-c563-4eff-a076-c83618811786', 'Nike H-88 Conjunto Dama', 'nike-h88-conjunto-dama', 2, 'Nike', 'Conjunto deportivo Nike para dama, buso y leggins. Tallas S-XL.', 150000, 15, 'VKT-VOKTER-NIKEH88-01'),
  ('ff1eac27-6445-4bec-9f19-77af21b1efc2', 'On Running 6976 Conjunto', 'on-running-6976-conjunto', 2, 'On Running', 'Conjunto deportivo On Running, chaqueta y pantalón. Tallas XL-4XL.', 180000, 8, 'VKT-VOKTER-ONRUN6976-01'),
  ('4a70bfa1-920c-4e9a-af62-edbd2169502b', 'Jordan 2333 Conjunto', 'jordan-2333-conjunto', 2, 'Jordan', 'Conjunto deportivo Jordan, chaqueta y pantalón. Tallas XL-4XL.', 195000, 7, 'VKT-VOKTER-JORDAN2333-01'),
  ('c723d874-7e3d-43cd-8de9-895fb936c33b', 'Adidas 3 Franjas Teal', 'adidas-3-franjas-teal', 2, 'Adidas', 'Conjunto deportivo Adidas 3 franjas para dama. Tallas S-XL.', 140000, 16, 'VKT-VOKTER-ADI3FTEAL-01'),
  ('f150a5ca-f751-4156-ac3d-9b0f603aa9e2', 'Nike Conjunto Aqua/Negro', 'nike-conjunto-aqua-negro', 2, 'Nike', 'Conjunto deportivo Nike acolchado, aqua y negro. Tallas S-XL.', 145000, 14, 'VKT-VOKTER-NIKEAQUA-01'),
  ('9b1fe65d-16ec-4214-ab2e-188ce3d795a9', 'Puma 3508 Conjunto', 'puma-3508-conjunto', 2, 'Puma', 'Conjunto deportivo Puma, chaqueta y pantalón. Tallas XL-4XL.', 150000, 12, 'VKT-VOKTER-PUMA3508-01'),
  ('10bdbbab-d302-43ed-b0e7-b8f559251de0', 'Adidas 3 Franjas Lila', 'adidas-3-franjas-lila', 2, 'Adidas', 'Conjunto deportivo Adidas 3 franjas para dama. Tallas S-XL.', 140000, 16, 'VKT-VOKTER-ADI3FLILA-01'),
  ('a6354a85-c98d-4aa9-84d8-b2e15b459cd7', 'Under Armour 6976 Conjunto', 'under-armour-6976-conjunto', 2, 'Under Armour', 'Conjunto deportivo Under Armour, chaqueta y pantalón. Tallas XL-4XL.', 170000, 10, 'VKT-VOKTER-UA6976-01'),
  ('c71e8800-2b35-4e77-869e-ad3d900f601a', 'Adidas 3 Franjas Verde', 'adidas-3-franjas-verde', 2, 'Adidas', 'Conjunto deportivo Adidas 3 franjas para dama. Tallas S-XL.', 140000, 16, 'VKT-VOKTER-ADI3FVERDE-01'),
  ('5161b758-5094-4594-8fa7-823527c935e1', 'Camisa Selección Colombia', 'camisa-seleccion-colombia', 2, '', 'Camiseta de fútbol Selección Colombia. Tallas S-XL.', 120000, 20, 'VKT-VOKTER-COLJER01-01'),
  ('0014a4bd-7718-45ae-a56d-efdcf848a1ae', 'Lacoste 2335 Conjunto', 'lacoste-2335-conjunto', 2, 'Lacoste', 'Conjunto deportivo Lacoste, chaqueta y pantalón. Tallas XL-4XL.', 185000, 6, 'VKT-VOKTER-LACOSTE2335-01')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Slugs cortados.
--
-- Seis productos quedaron con el slug sacado de la última palabra del nombre
-- del archivo de la foto ('open', 'trainer', 'lv'...). En Neon no existen
-- todavía y entran ya corregidos arriba; esto arregla la base local, donde sí
-- están mal. La clave es authenticity_code, que no cambia.
-- ---------------------------------------------------------------------
UPDATE products SET slug = 'lv-skate-sneakers' WHERE authenticity_code = 'VKT-VOKTER-URBAN01-01' AND slug = 'lv';
UPDATE products SET slug = 'lv-trainer' WHERE authenticity_code = 'VKT-VOKTER-VELCRO01-01' AND slug = 'trainer';
UPDATE products SET slug = 'valentino-v17n-bond' WHERE authenticity_code = 'VKT-VOKTER-CASUAL01-01' AND slug = 'v17n';
UPDATE products SET slug = 'lv-archlight-trainer' WHERE authenticity_code = 'VKT-VOKTER-CHUNK01-01' AND slug = 'archlight';
UPDATE products SET slug = 'valentino-garavani-diamante' WHERE authenticity_code = 'VKT-VOKTER-SKATE02-01' AND slug = 'garavani';
UPDATE products SET slug = 'valentino-open-sneaker' WHERE authenticity_code = 'VKT-VOKTER-TRAIN03-01' AND slug = 'open';

-- ---------------------------------------------------------------------
-- 3. Las fotos.
--
-- Se referencia el producto por slug en vez de por UUID para que funcione
-- también si la fila ya existía con otro id.
--
-- DO UPDATE en vez de DO NOTHING a propósito: las seis fotos de LV y
-- Valentino apuntaban a un archivo inexistente (la fila decía
-- '/products/LV Trainer.jpg' y el archivo es 'lv-trainer.png'), así que hay
-- que corregir las que ya estén guardadas, no solo insertar las que falten.
-- ---------------------------------------------------------------------
INSERT INTO product_images (product_id, url, alt_text, "position")
SELECT p.id, v.url, v.alt_text, v.position
FROM (VALUES
  ('under-armour-valsetz', '/products/under-armour-valsetz.jpg', NULL, 0),
  ('hoka-clifton-10', '/products/hoka-clifton-10.jpg', NULL, 0),
  ('skechers-mocasin', '/products/skechers-mocasin.jpg', NULL, 0),
  ('hoka-skyflow', '/products/hoka-skyflow.jpg', NULL, 0),
  ('hoka-gaviota', '/products/hoka-gaviota.jpg', NULL, 0),
  ('hoka-bondi-9', '/products/hoka-bondi-9.jpg', NULL, 0),
  ('lv-skate-sneakers', '/products/lv-skate-sneakers.png', NULL, 0),
  ('lv-trainer', '/products/lv-trainer.png', NULL, 0),
  ('valentino-v17n-bond', '/products/valentino-v17n-bond.png', NULL, 0),
  ('lv-archlight-trainer', '/products/lv-archlight-trainer.png', NULL, 0),
  ('valentino-garavani-diamante', '/products/valentino-garavani-diamante.png', NULL, 0),
  ('valentino-open-sneaker', '/products/valentino-open-sneaker.png', NULL, 0),
  ('nike-conjunto-verde-negro', '/products/nike-conjunto-verde-negro.jpg', NULL, 0),
  ('nike-6976-conjunto', '/products/nike-6976-conjunto.jpg', NULL, 0),
  ('adidas-h685-conjunto-dama', '/products/adidas-h685-conjunto-dama.jpg', NULL, 0),
  ('nike-n8805-conjunto', '/products/nike-n8805-conjunto.jpg', NULL, 0),
  ('nike-conjunto-rosa-negro', '/products/nike-conjunto-rosa-negro.jpg', NULL, 0),
  ('nike-h89-conjunto-dama', '/products/nike-h89-conjunto-dama.jpg', NULL, 0),
  ('puma-3503-conjunto', '/products/puma-3503-conjunto.jpg', NULL, 0),
  ('nike-h88-conjunto-dama', '/products/nike-h88-conjunto-dama.jpg', NULL, 0),
  ('on-running-6976-conjunto', '/products/on-running-6976-conjunto.jpg', NULL, 0),
  ('jordan-2333-conjunto', '/products/jordan-2333-conjunto.jpg', NULL, 0),
  ('adidas-3-franjas-teal', '/products/adidas-3-franjas-teal.jpg', NULL, 0),
  ('nike-conjunto-aqua-negro', '/products/nike-conjunto-aqua-negro.jpg', NULL, 0),
  ('puma-3508-conjunto', '/products/puma-3508-conjunto.jpg', NULL, 0),
  ('adidas-3-franjas-lila', '/products/adidas-3-franjas-lila.jpg', NULL, 0),
  ('under-armour-6976-conjunto', '/products/under-armour-6976-conjunto.jpg', NULL, 0),
  ('adidas-3-franjas-verde', '/products/adidas-3-franjas-verde.jpg', NULL, 0),
  ('camisa-seleccion-colombia', '/products/camisa-seleccion-colombia.jpg', NULL, 0),
  ('lacoste-2335-conjunto', '/products/lacoste-2335-conjunto.jpg', NULL, 0)
) AS v(slug, url, alt_text, "position")
JOIN products p ON p.slug = v.slug
ON CONFLICT (product_id, "position") DO UPDATE
  SET url = EXCLUDED.url, alt_text = EXCLUDED.alt_text;

COMMIT;
