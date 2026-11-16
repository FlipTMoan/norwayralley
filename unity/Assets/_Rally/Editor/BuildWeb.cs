using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.Editor
{
    /// <summary>
    /// The one web build: Brotli with the decompression fallback (GitHub Pages cannot send
    /// Content-Encoding, so the loader inflates in JS), WebGPU first with WebGL 2 as the fallback,
    /// a 512 MB geometric-growth heap for the tile and scatter buffers, and the Rally template with
    /// the Leaflet map and PeerJS. CI calls <see cref="Build"/> through game-ci's <c>buildMethod</c>;
    /// in the editor use the menu item. Output: <c>unity/Build/Web</c>.
    /// </summary>
    public static class BuildWeb
    {
        public const string OutputDir = "Build/Web";

        [MenuItem("Rally/Build Web (Brotli, WebGPU)")]
        public static void BuildFromMenu()
        {
            var report = Build();
            if (report.summary.result != BuildResult.Succeeded) throw new Exception($"Web build failed: {report.summary.result}");
        }

        public static BuildReport Build()
        {
            ApplyPlayerSettings();
            var scenes = EditorBuildSettings.scenes.Where(s => s.enabled).Select(s => s.path).ToArray();
            if (scenes.Length == 0) throw new Exception("No scenes are enabled in Build Settings.");
            Directory.CreateDirectory(OutputDir);
            var options = new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = OutputDir,
                target = BuildTarget.WebGL,
                options = BuildOptions.None,
            };
            var report = BuildPipeline.BuildPlayer(options);
            Debug.Log($"Web build: {report.summary.result}, {report.summary.totalSize / 1048576} MB in {report.summary.totalTime.TotalSeconds:F0} s → {OutputDir}");
            return report;
        }

        /// <summary>What README.md tells you to click in Player Settings, applied by code so CI and the editor agree.</summary>
        public static void ApplyPlayerSettings()
        {
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Brotli;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.template = "PROJECT:Rally";
            PlayerSettings.WebGL.dataCaching = true;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly;
            PlayerSettings.WebGL.linkerTarget = WebGLLinkerTarget.Wasm;
            // Heap: start at 256 MB, grow geometrically up to 2 GB (tiles, scatter and height copies are large).
            PlayerSettings.WebGL.initialMemorySize = 256;
            PlayerSettings.WebGL.maximumMemorySize = 2048;
            PlayerSettings.WebGL.memoryGrowthMode = WebGLMemoryGrowthMode.Geometric;
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.WebGL, false);
            PlayerSettings.SetGraphicsAPIs(BuildTarget.WebGL, new[] { GraphicsDeviceType.WebGPU, GraphicsDeviceType.OpenGLES3 });
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.WebGL, ScriptingImplementation.IL2CPP);
            PlayerSettings.SetIl2CppCompilerConfiguration(NamedBuildTarget.WebGL, Il2CppCompilerConfiguration.Release);
            PlayerSettings.runInBackground = true;
            AssetDatabase.SaveAssets();
        }
    }
}
