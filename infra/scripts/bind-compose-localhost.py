#!/usr/bin/env python3
"""Rewrite docker-compose port publish to 127.0.0.1:HOST:CONTAINER."""
from __future__ import annotations

import re
import sys
from pathlib import Path


def bind_localhost(path: Path, host_port: str) -> bool:
    text = path.read_text(errors="ignore")
    out: list[str] = []
    changed = False
    for line in text.splitlines(keepends=True):
        if f"127.0.0.1:{host_port}" in line:
            out.append(line)
            continue
        m = re.match(
            rf'^(\s*-\s*)["\']?(?:0\.0\.0\.0:)?{host_port}:(\d+)["\']?(\s*)$',
            line,
        )
        if m:
            nl = f'{m.group(1)}"127.0.0.1:{host_port}:{m.group(2)}"'
            if line.endswith("\r\n"):
                nl += "\r\n"
            elif line.endswith("\n"):
                nl += "\n"
            out.append(nl)
            changed = True
            continue
        out.append(line)
    if changed:
        path.write_text("".join(out))
    return changed


def main() -> int:
    if len(sys.argv) < 3:
        print(f"usage: {sys.argv[0]} <compose.yml> <host_port> [host_port...]", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    ports = sys.argv[2:]
    any_changed = False
    for port in ports:
        if bind_localhost(path, port):
            any_changed = True
            print(f"OK: {path} -> 127.0.0.1:{port}")
        else:
            print(f"WARN: no change {path} port {port}")
    for line in path.read_text(errors="ignore").splitlines():
        if any(p in line for p in ports):
            print(" ", line.strip())
    return 0 if any_changed else 1


if __name__ == "__main__":
    raise SystemExit(main())
