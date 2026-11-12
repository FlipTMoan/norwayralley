#!/usr/bin/env python3
"""Build a game-ready 3d_terrain scene into public/terrain/scenes/.

This is a thin wrapper around the bundled 3d_terrain builder:

    python3 scripts/build-scene.py 58.98634 6.19051 --name preikestolen --title "Preikestolen (demo)"

It writes the DTM, the Kartverket topo basemap, the scene.json and the scene
catalog entry, then prints the URL the game uses to open the new place.
The builder needs the Python packages in 3d_terrain/requirements.txt
(numpy, scipy, rasterio, pyproj, shapely, affine, Pillow).

Kartverket's WCS was returning HTTP 500 when this was written. If the builder
fails while downloading terrain, the existing demo scene still works; try the
builder again later when the height service is back.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILDER = os.path.join(ROOT, "3d_terrain", "viz3d.py")
SITE = os.path.join(ROOT, "public", "terrain")
REQUIRED = ("numpy", "scipy", "rasterio", "pyproj", "shapely", "affine", "PIL")


def check_dependencies():
    missing = []
    for name in REQUIRED:
        try:
            __import__(name)
        except Exception:
            missing.append(name)
    if missing:
        print("Missing Python packages: " + ", ".join(missing), file=sys.stderr)
        print("Install them with:", file=sys.stderr)
        print("  python3 -m pip install -r 3d_terrain/requirements.txt", file=sys.stderr)
        return False
    return True


def main():
    parser = argparse.ArgumentParser(description="Build a 3d_terrain scene for Retro Norway Rally")
    parser.add_argument("lat", type=float, help="centre latitude (EPSG:4326)")
    parser.add_argument("lon", type=float, help="centre longitude (EPSG:4326)")
    parser.add_argument("--name", default="preikestolen", help="scene folder name (no spaces)")
    parser.add_argument("--title", default=None, help="title shown in the game and catalog")
    parser.add_argument("--radius", type=float, default=1000.0, help="view radius in metres (default 1000)")
    parser.add_argument("--res", type=int, choices=(1, 10), default=1, help="height model resolution (default 1 m)")
    args = parser.parse_args()

    if not os.path.exists(BUILDER):
        print(f"Builder not found: {BUILDER}", file=sys.stderr)
        return 1
    if not check_dependencies():
        return 1

    out = tempfile.mkdtemp(prefix="rally-scene-")
    cmd = [
        sys.executable, BUILDER, str(args.lat), str(args.lon),
        "--name", args.name,
        "--radius", str(args.radius),
        "--res", str(args.res),
        "--site", SITE,
        "--out", out,
    ]
    if args.title:
        cmd += ["--title", args.title]
    print("Building scene:", " ".join(cmd))
    result = subprocess.run(cmd, cwd=ROOT)
    if result.returncode != 0:
        print("The 3d_terrain builder failed. See the message above.", file=sys.stderr)
        return result.returncode

    scene_dir = os.path.join(SITE, "scenes", args.name)
    catalog_path = os.path.join(SITE, "scenes", "index.json")
    try:
        with open(catalog_path) as fh:
            catalog = json.load(fh)
    except Exception:
        catalog = []
    entry = {
        "name": args.name,
        "title": args.title or args.name.replace("_", " "),
        "path": f"scenes/{args.name}/",
    }
    catalog = [s for s in catalog if s.get("name") != args.name] + [entry]
    with open(catalog_path, "w") as fh:
        json.dump(catalog, fh, indent=1)

    print()
    print(f"Scene ready: {scene_dir}")
    print(f"Open the game at: http://localhost:5173/?scene={args.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
