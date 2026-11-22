#!/usr/bin/env python3
"""Bake Artsdatabanken's "Bioklimatiske soner og seksjoner" (test version 2026, published by Miljødirektoratet, NLOD 2.0)
into Assets/_Rally/Runtime/Geo/Resources/bioclimate.bytes, the 1 km grid Rally.Geo.Bioclimate reads.

The map service (kart2.miljodirektoratet.no .../bioklimatiske_soner_seksjoner/MapServer, EPSG:25833) is asked for one
image per layer at 500 m with a renderer that paints class k as red = 30 k; each 1 km cell takes the most common clean
class of its 2 x 2 pixels (antialiased border pixels are ignored), empty cells within 20 km of a classed one take the
nearest class (coast, small islands), the rest stay 0 (outside Norway).

Output: W x H bytes, rows south -> north, byte = zone (1 BN .. 7 HA) | section (1 O3 .. 5 C1) << 4.
Usage: python3 -I bake_bioclimate.py OUT.bytes   (needs numpy and Pillow; network)
"""
import io, json, sys, urllib.parse, urllib.request
import numpy as np
from PIL import Image

URL = "https://kart2.miljodirektoratet.no/arcgis/rest/services/interne_tjenester/bioklimatiske_soner_seksjoner/MapServer/export"
X0, Y0, X1, Y1, CELL = -80000, 6440000, 1120000, 7944000, 1000   # Bioclimate.cs
W, H = (X1 - X0) // CELL, (Y1 - Y0) // CELL


def export(layer, field, codes):
    infos = [{"value": c, "symbol": {"type": "esriSFS", "style": "esriSFSSolid", "color": [(i + 1) * 30, 0, 0, 255], "outline": None}}
             for i, c in enumerate(codes)]
    dl = [{"id": layer, "source": {"type": "mapLayer", "mapLayerId": layer},
           "drawingInfo": {"renderer": {"type": "uniqueValue", "field1": field, "uniqueValueInfos": infos}}}]
    q = {"bbox": f"{X0},{Y0},{X1},{Y1}", "bboxSR": 25833, "imageSR": 25833, "size": f"{W * 2},{H * 2}", "format": "png24",
         "transparent": "true", "dpi": 96, "dynamicLayers": json.dumps(dl), "f": "image"}
    a = np.array(Image.open(io.BytesIO(urllib.request.urlopen(URL + "?" + urllib.parse.urlencode(q), timeout=300).read())).convert("RGBA"))
    r, g, alpha = a[..., 0].astype(int), a[..., 1], a[..., 3]
    k = np.where((alpha == 255) & (g == 0) & (r % 30 == 0), r // 30, 0)[::-1]   # rows south -> north
    blocks = k.reshape(H, 2, W, 2).transpose(0, 2, 1, 3).reshape(H, W, 4)
    out = np.zeros((H, W), np.uint8)
    for c in range(1, len(codes) + 1):   # mode of the clean pixels (ties: the higher class)
        n = (blocks == c).sum(-1)
        best = (blocks == out[..., None]).sum(-1) * (out > 0)
        out = np.where(n >= np.maximum(best, 1), c, out)
    for _ in range(20):                  # fill gaps by the nearest classed cell
        empty = out == 0
        if not empty.any(): break
        grown = out.copy()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            s = np.roll(out, (dy, dx), (0, 1))
            grown = np.where((grown == 0) & (s > 0), s, grown)
        out = grown
    return out


zone = export(0, "sone_kode", [f"6SO-{i}" for i in range(1, 8)])
section = export(1, "seksjon_kode", [f"6SE-{i}" for i in range(1, 6)])
data = (zone | (section << 4)).astype(np.uint8)
open(sys.argv[1], "wb").write(data.tobytes())
print(W, H, "zones", np.bincount(zone.ravel(), minlength=8), "sections", np.bincount(section.ravel(), minlength=6))
