import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const isPlaceholder =
  !process.env.SUPABASE_URL ||
  process.env.SUPABASE_URL.includes('placeholder-project-id') ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_service_role_key');

// In-memory Database state populated with seeds for instant prototype access
const memoryDb = {
  users: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'alice@briefforge.dev',
      password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHiy', // "demo1234"
      name: 'Alice Morgan',
      role: 'admin',
      created_at: new Date().toISOString(),
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'bob@briefforge.dev',
      password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHiy', // "demo1234"
      name: 'Bob Chen',
      role: 'user',
      created_at: new Date().toISOString(),
    },
  ],
  clients: [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      user_id: '11111111-1111-1111-1111-111111111111',
      name: 'Nike',
      industry: 'Sportswear',
      notes: 'Global brand, focus on empowerment and performance. Brand voice: bold, energetic.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      user_id: '11111111-1111-1111-1111-111111111111',
      name: 'Starbucks',
      industry: 'Food & Beverage',
      notes: 'Premium coffee brand. Warm, inviting, community-focused voice.',
      created_at: new Date().toISOString(),
    },
  ],
  briefs: [
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      user_id: '11111111-1111-1111-1111-111111111111',
      client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Air Max Spring Launch 2025',
      raw_brief:
        'We are launching the new Nike Air Max 360 for Spring 2025. The campaign should capture the feeling of limitless movement and urban energy.',
      product: 'Nike Air Max 360',
      audience: 'Urban millennials 18–34 who are active and fashion-conscious',
      goal: 'Drive pre-order sign-ups and brand awareness for the Spring launch',
      key_message: 'Move without limits — the Air Max 360 is built for those who never stop.',
      tone: 'Bold',
      platforms: ['instagram', 'twitter', 'linkedin', 'facebook', 'tiktok'],
      deadline: '2025-04-01',
      brand_guidelines:
        'Use brand colors: black, white, neon orange. No competitor mentions. Energetic visuals preferred.',
      status: 'complete',
      created_at: new Date().toISOString(),
    },
  ],
  generations: [
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      brief_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      type: 'caption',
      platform: 'instagram',
      content: [
        '🔥 The streets are yours. Air Max 360 — move without limits. #NikeAirMax #SpringLaunch',
        'Built for the ones who never stop. The Air Max 360 just landed. Pre-order link in bio 👟',
        'Urban energy. Limitless movement. The Air Max 360 redefines what it means to run the city. 🏙️ #NeverStopMoving',
        'Spring has a new soundtrack and it sounds like Air Max. Drop your city below 🌆 #AirMax360',
        'When comfort meets culture — the Air Max 360 is here. Pre-order now before they sell out 🔥',
      ],
      model_used: 'mistral:7b-instruct',
      tokens_used: 480,
      created_at: new Date().toISOString(),
    },
  ],
};

class MockQueryBuilder {
  constructor(table, db) {
    this.table = table;
    this.db = db;
    this.filters = [];
    this.orderCol = null;
    this.orderAsc = true;
    this.rangeFrom = null;
    this.rangeTo = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.hasCount = false;
  }

  select(columns, options) {
    if (options && options.count) {
      this.hasCount = true;
    }
    return this;
  }

  eq(col, val) {
    this.filters.push({ type: 'eq', col, val });
    return this;
  }

  gte(col, val) {
    this.filters.push({ type: 'gte', col, val });
    return this;
  }

  lte(col, val) {
    this.filters.push({ type: 'lte', col, val });
    return this;
  }

  or(expr) {
    this.filters.push({ type: 'or', expr });
    return this;
  }

  order(col, options) {
    this.orderCol = col;
    if (options && options.ascending === false) {
      this.orderAsc = false;
    }
    return this;
  }

  range(from, to) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async insert(rows) {
    const tableData = this.db[this.table];
    const newRows = (Array.isArray(rows) ? rows : [rows]).map((row) => {
      const newRow = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...row,
      };
      tableData.push(newRow);
      return newRow;
    });

    const result = Array.isArray(rows) ? newRows : newRows[0];
    return { data: result, error: null };
  }

  async update(values) {
    const tableData = this.db[this.table];
    const matches = this._filter(tableData);
    matches.forEach((row) => {
      Object.assign(row, values);
    });
    return { data: matches, error: null };
  }

  async delete(options) {
    const tableData = this.db[this.table];
    const matches = this._filter(tableData);
    const count = matches.length;

    this.db[this.table] = tableData.filter((row) => !matches.includes(row));
    return { error: null, count };
  }

  then(onfulfilled, onrejected) {
    return this.exec().then(onfulfilled, onrejected);
  }

  async exec() {
    let list = [...this.db[this.table]];
    list = this._filter(list);

    if (this.orderCol) {
      list.sort((a, b) => {
        const valA = a[this.orderCol];
        const valB = b[this.orderCol];
        if (typeof valA === 'string') {
          return this.orderAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return this.orderAsc ? valA - valB : valB - valA;
      });
    }

    const totalCount = list.length;

    if (this.rangeFrom !== null && this.rangeTo !== null) {
      list = list.slice(this.rangeFrom, this.rangeTo + 1);
    }

    // Join clients(name) relation mockup
    if (this.table === 'briefs') {
      list = list.map((brief) => {
        const client = this.db.clients.find((c) => c.id === brief.client_id);
        return {
          ...brief,
          clients: client ? { name: client.name } : null,
        };
      });
    }

    // Single result formatting
    if (this.isSingle) {
      if (list.length === 0) {
        return { data: null, error: { code: 'PGRST116', message: 'Row not found' } };
      }
      return { data: list[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: list.length > 0 ? list[0] : null, error: null };
    }

    return { data: list, count: totalCount, error: null };
  }

  _filter(list) {
    let result = [...list];
    for (const f of this.filters) {
      if (f.type === 'eq') {
        result = result.filter((item) => item[f.col] === f.val);
      } else if (f.type === 'gte') {
        result = result.filter((item) => new Date(item[f.col]) >= new Date(f.val));
      } else if (f.type === 'lte') {
        result = result.filter((item) => new Date(item[f.col]) <= new Date(f.val));
      } else if (f.type === 'or') {
        const match = f.expr.match(/%([^%]+)%/);
        if (match) {
          const keyword = match[1].toLowerCase();
          result = result.filter(
            (item) =>
              (item.title && item.title.toLowerCase().includes(keyword)) ||
              (item.product && item.product.toLowerCase().includes(keyword)) ||
              (item.audience && item.audience.toLowerCase().includes(keyword))
          );
        }
      }
    }
    return result;
  }
}

class MockSupabaseClient {
  constructor(db) {
    this.db = db;
  }

  from(table) {
    return new MockQueryBuilder(table, this.db);
  }
}

let supabase;

if (isPlaceholder) {
  console.log('[Supabase] Initialising in-memory Mock Database fallback.');
  supabase = new MockSupabaseClient(memoryDb);
} else {
  console.log('[Supabase] Initialising real Supabase connection.');
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default supabase;
