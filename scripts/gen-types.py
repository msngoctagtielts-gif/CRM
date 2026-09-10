#!/usr/bin/env python3
"""
Sinh src/types/database.types.ts từ catalog của PostgreSQL.

Dùng khi không có Docker (Supabase CLI `gen types` cần Docker). Kết quả tương
đương `npm run db:types`.

    python3 scripts/gen-types.py "postgresql://postgres@127.0.0.1:5433/mnee" \
        > src/types/database.types.ts
"""
import subprocess, sys, json, collections

DB = sys.argv[1] if len(sys.argv) > 1 else "postgresql://postgres@127.0.0.1:5433/mnee"

def q(sql):
    out = subprocess.run(["psql", DB, "-tAF", "\x1f", "-c", sql],
                         capture_output=True, text=True, check=True).stdout
    return [line.split("\x1f") for line in out.strip().split("\n") if line.strip()]

SCALAR = {
    "uuid": "string", "text": "string", "citext": "string", "character varying": "string",
    "timestamp with time zone": "string", "timestamp without time zone": "string",
    "date": "string", "time without time zone": "string", "interval": "string",
    "numeric": "number", "integer": "number", "smallint": "number", "bigint": "number",
    "double precision": "number", "real": "number",
    "boolean": "boolean", "jsonb": "Json", "json": "Json",
    "ARRAY": "unknown[]",
}

enums = collections.OrderedDict()
for name, label in q("""
    select t.typname, e.enumlabel
    from pg_type t join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' order by t.typname, e.enumsortorder"""):
    enums.setdefault(name, []).append(label)

# Kiểu do người dùng định nghĩa: information_schema báo data_type là
# 'USER-DEFINED' nên phải tra theo udt_name.
UDT_SCALAR = {"citext": "string"}

def ts_type(data_type, udt_name):
    if data_type == "ARRAY":
        inner = udt_name.lstrip("_")
        if inner in enums:
            return f'Database["public"]["Enums"]["{inner}"][]'
        return SCALAR.get({"text": "text", "uuid": "uuid"}.get(inner, inner), "string") + "[]"
    if udt_name in enums:
        return f'Database["public"]["Enums"]["{udt_name}"]'
    if udt_name in UDT_SCALAR:
        return UDT_SCALAR[udt_name]
    return SCALAR.get(data_type, "unknown")

# Hàm gọi được qua supabase.rpc(). Chỉ lấy các hàm fn_* do ứng dụng gọi.
funcs = []
for fname, argstr, rettype in q("""
    select p.proname,
           coalesce(pg_get_function_arguments(p.oid), ''),
           pg_get_function_result(p.oid)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'fn\\_%'
    order by p.proname"""):
    args = []
    for part in [a.strip() for a in argstr.split(",") if a.strip()]:
        tokens = part.split()
        if not tokens:
            continue
        name = tokens[0]
        if name in ("IN", "OUT", "INOUT", "VARIADIC"):
            tokens = tokens[1:]
            name = tokens[0] if tokens else ""
        rest = " ".join(tokens[1:])
        pg = rest.split(" DEFAULT ")[0].strip()
        optional = " DEFAULT " in rest
        ts = {"uuid": "string", "text": "string", "integer": "number", "numeric": "number",
              "date": "string", "boolean": "boolean"}.get(pg, "unknown")
        if name:
            args.append(f'{name}{"?" if optional else ""}: {ts}')
    ret = "unknown"
    if rettype.startswith("TABLE") or rettype.startswith("SETOF"):
        ret = "unknown[]"
    elif rettype in ("uuid", "text"):
        ret = "string"
    elif rettype in ("numeric", "integer"):
        ret = "number"
    elif rettype == "void":
        ret = "undefined"
    funcs.append((fname, "{ " + "; ".join(args) + " }" if args else "Record<string, never>", ret))

# Quan hệ khoá ngoại — postgrest-js cần để gõ kiểu cho truy vấn lồng
# dạng select('*, lessons(lesson_date)').
rels = collections.OrderedDict()
for tbl, fkname, fkcols, reftbl, refcols, is_unique in q("""
    select c.conrelid::regclass::text,
           c.conname,
           (select string_agg(a.attname, ',' order by k.ord)
              from unnest(c.conkey) with ordinality k(attnum, ord)
              join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum),
           c.confrelid::regclass::text,
           (select string_agg(a.attname, ',' order by k.ord)
              from unnest(c.confkey) with ordinality k(attnum, ord)
              join pg_attribute a on a.attrelid = c.confrelid and a.attnum = k.attnum),
           exists (
             select 1 from pg_index i
             where i.indrelid = c.conrelid and i.indisunique
               and i.indnatts = array_length(c.conkey, 1)
               and i.indkey::int2[] @> c.conkey and c.conkey @> i.indkey::int2[]
           )::text
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f' and n.nspname = 'public'
    order by 1, 2"""):
    rels.setdefault(tbl, []).append(
        '{ foreignKeyName: "%s"; columns: ["%s"]; isOneToOne: %s; referencedRelation: "%s"; referencedColumns: ["%s"] }'
        % (fkname, '", "'.join(fkcols.split(",")), "true" if is_unique == "true" else "false",
           reftbl, '", "'.join(refcols.split(","))))

cols = collections.OrderedDict()
for tbl, kind, col, data_type, udt, nullable, default, identity in q("""
    select c.table_name,
           case when t.table_type = 'VIEW' then 'view' else 'table' end,
           c.column_name, c.data_type, c.udt_name, c.is_nullable,
           coalesce(c.column_default, ''), coalesce(c.is_identity, 'NO')
    from information_schema.columns c
    join information_schema.tables t
      on t.table_name = c.table_name and t.table_schema = c.table_schema
    where c.table_schema = 'public'
      and t.table_type in ('BASE TABLE','VIEW')
    order by t.table_type desc, c.table_name, c.ordinal_position"""):
    cols.setdefault((tbl, kind), []).append(
        dict(name=col, ts=ts_type(data_type, udt),
             nullable=nullable == "YES", has_default=bool(default) or identity == "YES",
             generated=default.startswith("GENERATED") if default else False))

L = ['export type Json =',
     '  | string | number | boolean | null',
     '  | { [key: string]: Json | undefined }',
     '  | Json[]', '', 'export type Database = {', '  public: {', '    Tables: {']

def emit(table, columns, mode):
    out = [f'      {table}: {{']
    out.append('        Row: {')
    for c in columns:
        out.append(f'          {c["name"]}: {c["ts"]}{" | null" if c["nullable"] else ""}')
    out.append('        }')
    if mode == "table":
        out.append('        Insert: {')
        for c in columns:
            opt = "?" if (c["has_default"] or c["nullable"]) else ""
            out.append(f'          {c["name"]}{opt}: {c["ts"]}{" | null" if c["nullable"] else ""}')
        out.append('        }')
        out.append('        Update: {')
        for c in columns:
            out.append(f'          {c["name"]}?: {c["ts"]}{" | null" if c["nullable"] else ""}')
        out.append('        }')
    # supabase-js yêu cầu khoá Relationships trên mọi bảng và view.
    table_rels = rels.get(table, [])
    if table_rels:
        out.append('        Relationships: [')
        for r in table_rels:
            out.append(f'          {r},')
        out.append('        ]')
    else:
        out.append('        Relationships: []')
    out.append('      }')
    return out

for (tbl, kind), columns in cols.items():
    if kind == "table":
        L += emit(tbl, columns, "table")
L += ['    }', '    Views: {']
for (tbl, kind), columns in cols.items():
    if kind == "view":
        L += emit(tbl, columns, "view")
L += ['    }', '    Functions: {']
for fname, fargs, fret in funcs:
    L.append('      %s: {' % fname)
    L.append('        Args: %s' % fargs)
    L.append('        Returns: %s' % fret)
    L.append('      }')
L += ['    }', '    Enums: {']
for name, labels in enums.items():
    L.append('      %s: %s' % (name, " | ".join('"%s"' % v for v in labels)))
L += ['    }', '    CompositeTypes: {', '      [_ in never]: never', '    }', '  }', '}', '',
      '/** Hàng của một bảng trong schema public. */',
      'export type Tables<T extends keyof Database["public"]["Tables"]> =',
      '  Database["public"]["Tables"][T]["Row"]',
      '',
      '/** Hàng của một view trong schema public. */',
      'export type Views<T extends keyof Database["public"]["Views"]> =',
      '  Database["public"]["Views"][T]["Row"]',
      '',
      '/** Giá trị của một enum trong schema public. */',
      'export type Enums<T extends keyof Database["public"]["Enums"]> =',
      '  Database["public"]["Enums"][T]',
      '',
      'export type TablesInsert<T extends keyof Database["public"]["Tables"]> =',
      '  Database["public"]["Tables"][T]["Insert"]',
      '',
      'export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =',
      '  Database["public"]["Tables"][T]["Update"]',
      '']
print("// Sinh tự động từ schema PostgreSQL — KHÔNG sửa tay.")
print("// Tạo lại: npm run db:types  (hoặc python3 scripts/gen-types.py <DB_URL>)")
print()
print("\n".join(L))
