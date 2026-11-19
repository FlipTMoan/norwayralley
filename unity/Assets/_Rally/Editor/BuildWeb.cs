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
    /// <see cref="BuildWebGL2Only"/> is the diagnostic variant: OpenGLES3 as the only API into <c>Build/WebGL2</c>,
    /// so the build log lists every shader that does not compile for GLES 3.0 (what Chrome uses when WebGPU is off).
    /// </summary>
    public static class BuildWeb
    {
        public const string OutputDir = "Build/Web";
        static readonly GraphicsDeviceType[] WebApis = { GraphicsDeviceType.WebGPU, GraphicsDeviceType.OpenGLES3 };

        [MenuItem("Rally/Build Web (Brotli, WebGPU)")]
        public static void BuildFromMenu()
        {
            var report = Build();
            if (report.summary.result != BuildResult.Succeeded) throw new Exception($"Web build failed: {report.summary.result}");
        }

        [MenuItem("Rally/Build Web (WebGL 2 only, diagnostic)")]
        public static void BuildWebGL2Only()
        {
            BuildReport report;
            try { report = Build("Build/WebGL2", new[] { GraphicsDeviceType.OpenGLES3 }); }
            finally { PlayerSettings.SetGraphicsAPIs(BuildTarget.WebGL, WebApis); AssetDatabase.SaveAssets(); }   // leave the project as the normal build wants it
            if (report.summary.result != BuildResult.Succeeded) throw new Exception($"WebGL 2 build failed: {report.summary.result}");
        }

        public static BuildReport Build() => Build(OutputDir, WebApis);

        /// <summary>
        /// Work-in-progress builds go to <c>Build/WebDev</c> (the user plays from Build/Web, which only gets a build that
        /// booted and drove in Chrome), with the function names embedded so a wasm stack trace is readable.
        /// </summary>
        [MenuItem("Rally/Build Web (dev, Build/WebDev, symbols)")]
        public static void BuildDevFromMenu()
        {
            var old = PlayerSettings.WebGL.debugSymbolMode;
            BuildReport report;
            try { PlayerSettings.WebGL.debugSymbolMode = WebGLDebugSymbolMode.Embedded; report = Build("Build/WebDev", WebApis); }
            finally { PlayerSettings.WebGL.debugSymbolMode = old; AssetDatabase.SaveAssets(); }
            if (report.summary.result != BuildResult.Succeeded) throw new Exception($"Web dev build failed: {report.summary.result}");
        }

        static BuildReport Build(string outputDir, GraphicsDeviceType[] apis)
        {
            ApplyPlayerSettings();
            PlayerSettings.SetGraphicsAPIs(BuildTarget.WebGL, apis);
            var scenes = EditorBuildSettings.scenes.Where(s => s.enabled).Select(s => s.path).ToArray();
            if (scenes.Length == 0) throw new Exception("No scenes are enabled in Build Settings.");
            Directory.CreateDirectory(outputDir);
            var options = new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = outputDir,
                target = BuildTarget.WebGL,
                options = BuildOptions.None,
            };
            var report = BuildPipeline.BuildPlayer(options);
            Debug.Log($"Web build: {report.summary.result}, {report.summary.totalSize / 1048576} MB in {report.summary.totalTime.TotalSeconds:F0} s → {outputDir}");
            return report;
        }

        /// <summary>What README.md tells you to click in Player Settings, applied by code so CI and the editor agree.</summary>
        public static void ApplyPlayerSettings()
        {
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Brotli;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.template = "PROJECT:Rally";
            PlayerSettings.WebGL.dataCaching = true;
            // Content-hashed file names: a browser (python http.server sends no cache headers) can never pair a cached
            // framework/loader of an older build with a new wasm, the likely cause of a stack overflow on 2026-11-19.
            PlayerSettings.WebGL.nameFilesAsHashes = true;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly;
            PlayerSettings.WebGL.linkerTarget = WebGLLinkerTarget.Wasm;
            // Heap: start at 256 MB, grow geometrically up to 2 GB (tiles, scatter and height copies are large).
            PlayerSettings.WebGL.initialMemorySize = 256;
            PlayerSettings.WebGL.maximumMemorySize = 2048;
            PlayerSettings.WebGL.memoryGrowthMode = WebGLMemoryGrowthMode.Geometric;
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.WebGL, false);
            PlayerSettings.SetGraphicsAPIs(BuildTarget.WebGL, WebApis);
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.WebGL, ScriptingImplementation.IL2CPP);
            PlayerSettings.SetIl2CppCompilerConfiguration(NamedBuildTarget.WebGL, Il2CppCompilerConfiguration.Release);
            PlayerSettings.runInBackground = true;
            AssetDatabase.SaveAssets();
        }
    }
}
