const { getPool } = require('./db');

const TABLES = new Set(['users', 'customers', 'extinguishers', 'notifications', 'escalations']);

function assertTable(table) {
  if (!TABLES.has(table)) throw new Error(`Invalid table: ${table}`);
}

function nowStr() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function formatRow(row) {
  if (!row) return null;
  const out = { ...row };
  for (const [key, val] of Object.entries(out)) {
    if (val instanceof Date) {
      if (key === 'purchase_date' || key === 'expiry_date') {
        out[key] = val.toISOString().slice(0, 10);
      } else {
        out[key] = val.toISOString().replace('T', ' ').slice(0, 19);
      }
    }
  }
  return out;
}

const store = {
  async insert(table, record) {
    assertTable(table);
    const data = { ...record, created_at: record.created_at || nowStr() };
    const cols = Object.keys(data);
    const vals = Object.values(data);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const { rows } = await getPool().query(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      vals
    );
    return formatRow(rows[0]);
  },

  async insertWithId(table, record) {
    assertTable(table);
    const data = { ...record, created_at: record.created_at || nowStr() };
    const cols = Object.keys(data);
    const vals = Object.values(data);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const { rows } = await getPool().query(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      vals
    );
    return formatRow(rows[0]);
  },

  async update(table, id, changes) {
    assertTable(table);
    const keys = Object.keys(changes);
    if (keys.length === 0) return this.findById(table, id);

    const sets = keys.map((k, i) => `${k} = $${i + 1}`);
    const vals = [...Object.values(changes), id];
    const { rows } = await getPool().query(
      `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    return formatRow(rows[0]) || null;
  },

  async delete(table, id) {
    assertTable(table);
    const { rowCount } = await getPool().query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return rowCount > 0;
  },

  async deleteWhere(table, filter) {
    assertTable(table);
    const keys = Object.keys(filter);
    if (keys.length === 0) return;
    const vals = Object.values(filter);
    const where = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    await getPool().query(`DELETE FROM ${table} WHERE ${where}`, vals);
  },

  async findById(table, id) {
    assertTable(table);
    const { rows } = await getPool().query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return formatRow(rows[0]) || null;
  },

  async findOne(table, filter) {
    assertTable(table);
    const keys = Object.keys(filter);
    const vals = Object.values(filter);
    const where = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    const { rows } = await getPool().query(`SELECT * FROM ${table} WHERE ${where} LIMIT 1`, vals);
    return formatRow(rows[0]) || null;
  },

  async findAll(table, filter = {}) {
    assertTable(table);
    const keys = Object.keys(filter);
    let query = `SELECT * FROM ${table}`;
    const vals = Object.values(filter);
    if (keys.length) {
      const where = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
      query += ` WHERE ${where}`;
    }
    const { rows } = await getPool().query(query, vals);
    return rows.map(formatRow);
  },

  async count(table, filter = {}) {
    assertTable(table);
    const keys = Object.keys(filter);
    let query = `SELECT COUNT(*)::int AS count FROM ${table}`;
    const vals = Object.values(filter);
    if (keys.length) {
      const where = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
      query += ` WHERE ${where}`;
    }
    const { rows } = await getPool().query(query, vals);
    return rows[0].count;
  },

  async raw(table) {
    assertTable(table);
    const { rows } = await getPool().query(`SELECT * FROM ${table}`);
    return rows.map(formatRow);
  },

  async isEmpty(table) {
    return (await this.count(table)) === 0;
  },
};

module.exports = store;
