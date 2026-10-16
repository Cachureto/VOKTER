import { query, withTransaction } from '../../db/pool.js';
import { conflict, notFound } from '../../utils/httpError.js';
import { notifyDropLive } from '../notifications/notifications.service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapDrop = (d, products, waitlistCount) => ({
  id: d.id,
  name: d.name,
  slug: d.slug,
  description: d.description,
  coverUrl: d.cover_url,
  launchAt: d.launch_at,
  endsAt: d.ends_at,
  status: d.status,
  waitlistCount: Number(waitlistCount ?? 0),
  products,
});

async function getDropProducts(dropId) {
  const { rows } = await query(
    `SELECT p.id, p.slug, p.name, p.price_cents, p.stock,
            (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY position LIMIT 1) AS cover_url,
            dp.allocation, dp.max_per_user
     FROM drop_products dp
     JOIN products p ON p.id = dp.product_id
     WHERE dp.drop_id = $1`,
    [dropId],
  );
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    priceCents: Number(p.price_cents),
    stock: p.stock,
    coverUrl: p.cover_url,
    allocation: p.allocation,
    maxPerUser: p.max_per_user,
  }));
}

export async function listDrops({ status }) {
  const params = [];
  const conditions = [];
  if (status) {
    params.push(status);
    conditions.push(`d.status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT d.*, COUNT(w.user_id) FILTER (WHERE w.status = 'waiting') AS waitlist_count
     FROM drops d
     LEFT JOIN drop_waitlist w ON w.drop_id = d.id
     ${where}
     GROUP BY d.id
     ORDER BY d.launch_at ASC`,
    params,
  );

  return Promise.all(
    rows.map(async (d) => mapDrop(d, await getDropProducts(d.id), d.waitlist_count)),
  );
}

export async function getDrop(idOrSlug) {
  const isId = UUID_RE.test(idOrSlug);
  const { rows } = await query(`SELECT * FROM drops WHERE ${isId ? 'id' : 'slug'} = $1`, [idOrSlug]);
  const drop = rows[0];
  if (!drop) throw notFound('Drop no encontrado');

  const [{ rows: wl }, products] = await Promise.all([
    query(`SELECT COUNT(*) FILTER (WHERE status = 'waiting') AS c FROM drop_waitlist WHERE drop_id = $1`, [drop.id]),
    getDropProducts(drop.id),
  ]);
  return mapDrop(drop, products, wl[0].c);
}

export async function createDrop(input) {
  const dropId = await withTransaction(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO drops (name, slug, description, cover_url, launch_at, ends_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [input.name, input.slug, input.description, input.coverUrl ?? null, input.launchAt, input.endsAt ?? null],
    );
    const id = rows[0].id;
    for (const productId of input.productIds) {
      await db.query('INSERT INTO drop_products (drop_id, product_id) VALUES ($1,$2)', [id, productId]);
    }
    return id;
  });

  return getDrop(dropId);
}

const DROP_COLUMNS = {
  name: 'name',
  description: 'description',
  coverUrl: 'cover_url',
  launchAt: 'launch_at',
  endsAt: 'ends_at',
};

export async function updateDrop(idOrSlug, input) {
  const isId = UUID_RE.test(idOrSlug);
  const { rows: current } = await query(`SELECT id FROM drops WHERE ${isId ? 'id' : 'slug'} = $1`, [idOrSlug]);
  if (!current[0]) throw notFound('Drop no encontrado');
  const dropId = current[0].id;

  await withTransaction(async (db) => {
    const sets = [];
    const params = [];
    for (const [key, column] of Object.entries(DROP_COLUMNS)) {
      if (input[key] === undefined) continue;
      params.push(input[key]);
      sets.push(`${column} = $${params.length}`);
    }
    if (sets.length) {
      params.push(dropId);
      await db.query(`UPDATE drops SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
    }

    if (input.productIds) {
      await db.query('DELETE FROM drop_products WHERE drop_id = $1', [dropId]);
      for (const productId of input.productIds) {
        await db.query('INSERT INTO drop_products (drop_id, product_id) VALUES ($1,$2)', [dropId, productId]);
      }
    }
  });

  return getDrop(dropId);
}

export async function updateDropStatus(idOrSlug, status) {
  const isId = UUID_RE.test(idOrSlug);
  const { rows } = await query(`UPDATE drops SET status = $1 WHERE ${isId ? 'id' : 'slug'} = $2 RETURNING id`, [
    status,
    idOrSlug,
  ]);
  if (!rows[0]) throw notFound('Drop no encontrado');

  // Al ponerse en vivo se avisa a la lista de espera. No se espera el envío ni
  // se deja que un fallo de push tumbe la respuesta del admin.
  if (status === 'live') {
    notifyDropLive(rows[0].id).catch((err) =>
      console.error('No se pudo notificar el drop en vivo:', err.message),
    );
  }

  return getDrop(rows[0].id);
}

export async function joinWaitlist(idOrSlug, userId) {
  const drop = await getDrop(idOrSlug);
  if (['ended', 'cancelled'].includes(drop.status)) throw conflict('Este drop ya no acepta inscripciones');

  await query(
    `INSERT INTO drop_waitlist (drop_id, user_id) VALUES ($1,$2)
     ON CONFLICT (drop_id, user_id) DO NOTHING`,
    [drop.id, userId],
  );
  return { joined: true, dropId: drop.id };
}

export async function leaveWaitlist(idOrSlug, userId) {
  const drop = await getDrop(idOrSlug);
  await query('DELETE FROM drop_waitlist WHERE drop_id = $1 AND user_id = $2', [drop.id, userId]);
}
