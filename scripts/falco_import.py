#!/usr/bin/env python3
"""
Falco YAML -> Log Guardian host rules (v2 — macro + list expansion).

  python3 scripts/falco_import.py rules/falco/ vendor/falco-rules/rules -o rules/generated-falco-host.json
  python3 scripts/falco_import.py rules/falco/ --max 256

Requires: pip install pyyaml (strongly recommended)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None

SIG_MAP = {
    "execve": "INC_SIG_EBPF_EXECVE",
    "openat": "INC_SIG_EBPF_LINEAGE",
    "write": "INC_SIG_EBPF_LINEAGE",
    "connect": "INC_SIG_EBPF_OUTBOUND",
}

# Falco evt/macro hints -> Guardian lineage type
TYPE_HINTS: list[tuple[str, str]] = [
    ("spawned_process", "execve"),
    ("execveat", "execve"),
    ("execve", "execve"),
    ("open_read", "openat"),
    ("open_write", "write"),
    ("openat2", "openat"),
    ("openat", "openat"),
    ("open ", "openat"),
    ("write", "write"),
    ("connect", "connect"),
    ("kernel_module", "execve"),
    ("create_symlink", "write"),
    ("create_hardlink", "write"),
]


def normalize_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip())


def parse_list_items(raw) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, list):
        out: list[str] = []
        for x in raw:
            if x is None:
                continue
            s = str(x).strip().strip("'\"")
            if s and s not in ("...",):
                out.append(s)
        return out
    return []


def load_falco_documents(paths: list[Path]) -> tuple[dict[str, list[str]], dict[str, str], list[dict]]:
    """Scan all YAML files; merge lists, macros, rules."""
    lists: dict[str, list[str]] = {}
    macros: dict[str, str] = {}
    rules: list[dict] = []

    if not yaml:
        return lists, macros, rules

    for path in paths:
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
            docs = yaml.safe_load(text)
        except (OSError, yaml.YAMLError) as e:
            print(f"[WARN] {path}: {e}", file=sys.stderr)
            continue

        if not docs:
            continue
        if not isinstance(docs, list):
            docs = [docs]

        for doc in docs:
            if not isinstance(doc, dict):
                continue
            if "list" in doc:
                name = str(doc["list"]).strip()
                items = parse_list_items(doc.get("items"))
                if name and items:
                    lists[name] = items
            elif "macro" in doc:
                name = str(doc["macro"]).strip()
                cond = doc.get("condition")
                if name and cond:
                    macros[name] = normalize_ws(str(cond))
            elif "rule" in doc:
                cond = doc.get("condition")
                if cond:
                    rules.append(
                        {
                            "rule": str(doc["rule"]).strip(),
                            "condition": normalize_ws(str(cond)),
                            "desc": str(doc.get("desc", ""))[:200],
                            "source_file": path.name,
                        }
                    )

    return lists, macros, rules


def expand_list_refs(expr: str, lists: dict[str, list[str]]) -> str:
    """Expand `in (list_name)` to literal item tuples."""

    def repl(m: re.Match) -> str:
        name = m.group(1)
        if name not in lists:
            return m.group(0)
        items = lists[name]
        quoted = ", ".join(items)
        return f"in ({quoted})"

    prev = None
    s = expr
    while prev != s:
        prev = s
        s = re.sub(
            r"\bin\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)",
            repl,
            s,
        )
    return s


def preexpand_macro_defs(macros: dict[str, str], rounds: int = 12) -> dict[str, str]:
    """Expand macro bodies once (shared cache), cap size to avoid blow-up."""
    cache = dict(macros)
    for _ in range(rounds):
        changed = False
        for name in list(cache.keys()):
            s = cache[name]
            if len(s) > 4000:
                continue
            for oname in sorted(cache.keys(), key=len, reverse=True):
                if oname == name:
                    continue
                pat = r"\b" + re.escape(oname) + r"\b"
                if re.search(pat, s):
                    s = re.sub(pat, f"({cache[oname]})", s)
                    changed = True
            s = normalize_ws(s)
            if len(s) > 4000:
                s = s[:4000]
            cache[name] = s
        if not changed:
            break
    return cache


def macro_refs(expr: str) -> set[str]:
    return set(re.findall(r"\b([A-Za-z_][A-Za-z0-9_]*)\b", expr))


def shallow_expand(
    expr: str,
    macro_cache: dict[str, str],
    lists: dict[str, list[str]],
    max_depth: int = 6,
    max_len: int = 12000,
) -> str:
    """Expand only macros referenced in expr (BFS), not full ruleset."""
    s = expr
    for _ in range(max_depth):
        refs = macro_refs(s) & set(macro_cache.keys())
        if not refs:
            break
        for name in sorted(refs, key=len, reverse=True):
            pat = r"\b" + re.escape(name) + r"\b"
            if re.search(pat, s):
                s = re.sub(pat, f"({macro_cache[name]})", s)
        s = expand_list_refs(s, lists)
        s = normalize_ws(s)
        if len(s) > max_len:
            s = s[:max_len]
            break
    return s


# Macro name in raw condition -> list key (no full expansion needed)
MACRO_LIST_HINTS: dict[str, str] = {
    "shell_procs": "shell_binaries",
    "protected_shell_spawner": "protected_shell_spawning_binaries",
}


def infer_lists_from_raw(raw: str, lists: dict[str, list[str]]) -> tuple[list[str], list[str]]:
    procs: list[str] = []
    details: list[str] = []
    for m in re.finditer(r"proc\.name\s+in\s*\(([A-Za-z_][A-Za-z0-9_]*)\)", raw):
        lname = m.group(1)
        if lname in lists:
            procs.extend(lists[lname][:8])
    for m in re.finditer(r"fd\.name\s+in\s*\(([A-Za-z_][A-Za-z0-9_]*)\)", raw):
        lname = m.group(1)
        if lname in lists:
            details.extend(lists[lname][:6])
    for macro, lkey in MACRO_LIST_HINTS.items():
        if macro in raw and lkey in lists:
            procs.extend(lists[lkey][:8])
    if "sensitive_files" in raw or "sensitive_file_names" in raw:
        details.extend(lists.get("sensitive_file_names", [])[:6])
    return procs, details


def detect_event_type(expanded: str) -> str:
    low = expanded.lower()
    for hint, gtype in TYPE_HINTS:
        if hint in low:
            return gtype
    return "execve"


def extract_proc_names(expanded: str) -> list[str]:
    names: list[str] = []
    for m in re.finditer(r"proc\.name\s+in\s*\(([^)]+)\)", expanded, re.I):
        chunk = m.group(1)
        for part in chunk.split(","):
            p = part.strip().strip("'\"")
            if re.match(r"^[a-zA-Z0-9._+-]+$", p) and len(p) <= 31:
                names.append(p)
    for m in re.finditer(r"proc\.name\s*=\s*([a-zA-Z0-9._+-]+)", expanded, re.I):
        names.append(m.group(1))
    seen: set[str] = set()
    out: list[str] = []
    for n in names:
        k = n.lower()
        if k not in seen:
            seen.add(k)
            out.append(n)
    return out


def extract_detail_subs(expanded: str) -> list[str]:
    subs: list[str] = []
    patterns = [
        r"fd\.name\s+contains\s+([a-zA-Z0-9_./~+-]+)",
        r"fd\.name\s+startswith\s+([a-zA-Z0-9_./~+-]+)",
        r"fd\.directory\s+in\s*\(([^)]+)\)",
        r"fd\.sport\s*=\s*(\d+)",
        r"proc\.cmdline\s+contains\s+([a-zA-Z0-9_./~+-]+)",
    ]
    for pat in patterns:
        for m in re.finditer(pat, expanded, re.I):
            g = m.group(1).strip().strip("'\"")
            if pat.endswith(r"(\d+)"):
                subs.append(f":{g}")
            elif "," in g and "fd.directory" in pat:
                for part in g.split(","):
                    p = part.strip().strip("'\"")
                    if p:
                        subs.append(p)
            elif g:
                subs.append(g)
    seen: set[str] = set()
    out: list[str] = []
    for s in subs:
        if s not in seen:
            seen.add(s)
            out.append(s[:95])
    return out


def condition_to_guardian_rules(
    rule_name: str,
    raw: str,
    expanded: str,
    lists: dict[str, list[str]],
    source_file: str,
) -> list[dict]:
    """One Falco rule -> one or more Guardian host rules."""
    if re.search(r"^\(?\s*never_true\s*\)?$", raw):
        return []

    gtype = detect_event_type(raw + " " + expanded[:2000])
    procs = extract_proc_names(expanded)
    details = extract_detail_subs(expanded)
    hint_procs, hint_details = infer_lists_from_raw(raw, lists)
    procs = _uniq(procs + hint_procs)
    details = _uniq(details + hint_details)

    if not procs and not details:
        return []

    out: list[dict] = []
    base = {
        "name": rule_name[:120],
        "type": gtype,
        "inc_sig": SIG_MAP.get(gtype, "INC_SIG_EBPF_LINEAGE"),
        "source": "falco_import_v2",
        "source_file": source_file,
    }

    if procs and details:
        for p in procs[:4]:
            for d in details[:3]:
                r = {**base, "comm_sub": p, "detail_sub": d}
                r["name"] = f"{rule_name[:90]}|{p}|{d[:20]}"[:120]
                out.append(r)
    elif procs:
        for p in procs[:8]:
            r = {**base, "comm_sub": p, "detail_sub": None}
            r["name"] = f"{rule_name[:100]}|{p}"[:120]
            out.append(r)
    else:
        for d in details[:6]:
            r = {**base, "comm_sub": None, "detail_sub": d}
            r["name"] = f"{rule_name[:100]}|{d[:20]}"[:120]
            out.append(r)

    return out


def _uniq(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for x in items:
        k = x.lower()
        if k not in seen:
            seen.add(k)
            out.append(x)
    return out


def collect_paths(inputs: list[Path]) -> list[Path]:
    paths: list[Path] = []
    for inp in inputs:
        if inp.is_dir():
            paths.extend(sorted(inp.rglob("*.yaml")))
            paths.extend(sorted(inp.rglob("*.yml")))
        elif inp.is_file():
            paths.append(inp)
    # Skip test/registry noise
    skip = ("/testdata/", "/tests/", "registry.yaml", ".pre-commit")
    return [p for p in paths if not any(x in str(p) for x in skip)]


def fallback_load_rules(path: Path) -> list[dict]:
    """No PyYAML: line parser for local packs only."""
    docs: list[dict] = []
    current: dict = {}
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        stripped = line.strip()
        if stripped.startswith("- rule:") or stripped.startswith("rule:"):
            if current:
                docs.append(current)
            name = stripped.split(":", 1)[1].strip().strip("'\"")
            current = {"rule": name, "source_file": path.name}
        elif "condition:" in line and current:
            current["condition"] = line.split("condition:", 1)[1].strip()
    if current:
        docs.append(current)
    return docs


def main() -> int:
    ap = argparse.ArgumentParser(description="Falco YAML -> Guardian host rules v2")
    ap.add_argument("inputs", nargs="+", type=Path)
    ap.add_argument("-o", "--output", type=Path, default=Path("rules/generated-falco-host.json"))
    ap.add_argument("--max", type=int, default=256, help="Max Guardian rules output")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    paths = collect_paths(args.inputs)
    if not paths:
        print("[ERR] YAML dosyasi bulunamadi.", file=sys.stderr)
        return 1

    guardian_rules: list[dict] = []
    seen_key: set[str] = set()
    stats = {"files": len(paths), "falco_rules": 0, "macros": 0, "lists": 0, "skipped": 0}

    if yaml:
        lists, macros, falco_rules = load_falco_documents(paths)
        stats["macros"] = len(macros)
        stats["lists"] = len(lists)
        stats["falco_rules"] = len(falco_rules)

        macro_cache = preexpand_macro_defs(macros)

        if args.verbose:
            print(
                f"[INFO] {len(paths)} files, {len(macro_cache)} macros, {len(lists)} lists, {len(falco_rules)} falco rules",
                file=sys.stderr,
            )

        for fr in falco_rules:
            raw = fr["condition"]
            expanded = shallow_expand(raw, macro_cache, lists)
            converted = condition_to_guardian_rules(
                fr["rule"], raw, expanded, lists, fr.get("source_file", "")
            )
            if not converted:
                stats["skipped"] += 1
                continue
            for r in converted:
                key = f"{r['type']}|{r.get('comm_sub') or ''}|{r.get('detail_sub') or ''}|{r['name'][:40]}"
                if key in seen_key:
                    continue
                seen_key.add(key)
                guardian_rules.append(r)
                if len(guardian_rules) >= args.max:
                    break
            if len(guardian_rules) >= args.max:
                break
    else:
        print("[WARN] PyYAML yok — sadece basit yerel YAML.", file=sys.stderr)
        for p in paths:
            if "vendor" in str(p):
                continue
            for doc in fallback_load_rules(p):
                stats["falco_rules"] += 1
                expanded = doc.get("condition", "")
                converted = condition_to_guardian_rules(
                    doc["rule"], expanded, expanded, {}, p.name
                )
                for r in converted:
                    key = f"{r['type']}|{r.get('comm_sub') or ''}|{r.get('detail_sub') or ''}"
                    if key in seen_key:
                        continue
                    seen_key.add(key)
                    guardian_rules.append(r)
                    if len(guardian_rules) >= args.max:
                        break

    if not guardian_rules:
        print("[ERR] Donusturulebilir kural yok.", file=sys.stderr)
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": "2",
        "engine": "falco_import_v2",
        "stats": stats,
        "rules": guardian_rules,
        "count": len(guardian_rules),
    }
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    lst_path = args.output.with_suffix(".lst")
    lst_lines = ["# type|comm|detail|name|inc_sig"]
    for r in guardian_rules:
        lst_lines.append(
            f"{r['type']}|{r.get('comm_sub') or ''}|{r.get('detail_sub') or ''}|{r['name']}|{r['inc_sig']}"
        )
    lst_path.write_text("\n".join(lst_lines) + "\n", encoding="utf-8")

    print(f"[OK] {len(guardian_rules)} guardian rules -> {args.output}")
    print(f"[OK] loader lst -> {lst_path}")
    print(f"[OK] stats: {stats['falco_rules']} falco rules, {stats['macros']} macros, {stats['lists']} lists, {stats['skipped']} skipped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
