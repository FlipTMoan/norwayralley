using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>A building footprint: the outer ring with the most vertices (buildings.js ignores holes and courtyards).</summary>
    public sealed class Building
    {
        public long Id;
        public List<Utm33> Polygon = new List<Utm33>();
        public Dictionary<string, string> Tags = new Dictionary<string, string>();
    }

    /// <summary>
    /// A land-use / natural polygon (fields, forest, water, wetland, built-up, rock …), as buildings.js
    /// <c>areas</c>: <see cref="Kind"/> is the landuse or natural value, water and wetland polygons are
    /// in here too (<see cref="IsWater"/>).
    /// </summary>
    public sealed class Area
    {
        public string Kind, Leaf, Water, Wetland, Name;
        public List<List<Utm33>> Rings = new List<List<Utm33>>();
        public bool IsWater => Kind == "water";
    }

    /// <summary>River / stream centre line (buildings.js <c>waterways</c>).</summary>
    public sealed class Waterway
    {
        public string Kind, Name;
        public float Width;
        public List<Utm33> Points = new List<Utm33>();
    }

    /// <summary>A <c>power=line|minor_line</c> way (not in the JS game; added for the Unity scenery).</summary>
    public sealed class PowerLine
    {
        public long Id;
        public string Kind;
        public List<Utm33> Points = new List<Utm33>();
    }

    public sealed class Features
    {
        public List<Building> Buildings = new List<Building>();
        public List<Area> Areas = new List<Area>();
        public List<Waterway> Waterways = new List<Waterway>();
        public List<PowerLine> PowerLines = new List<PowerLine>();
    }

    public interface IFeatureSource
    {
        Task<Features> FetchFeatures(Bounds25833 bounds, CancellationToken ct);
    }
}
