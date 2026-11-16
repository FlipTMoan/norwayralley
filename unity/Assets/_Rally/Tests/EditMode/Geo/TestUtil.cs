using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;

namespace Rally.Tests.Geo
{
    /// <summary>The Geo tests use synchronous fakes, so every task is already complete; this just unwraps it.</summary>
    static class TestUtil
    {
        public static T Sync<T>(this Task<T> t) => t.GetAwaiter().GetResult();
        public static void Sync(this Task t) => t.GetAwaiter().GetResult();
    }

    /// <summary>
    /// Unity installs a main-thread SynchronizationContext that only pumps between editor updates; a
    /// test that blocks on a task whose continuation was posted there would deadlock. Running the
    /// tests with no context makes continuations run inline, as they do on completion in the fakes.
    /// </summary>
    public abstract class NoSyncContext
    {
        SynchronizationContext saved;
        [SetUp] public void ClearContext() { saved = SynchronizationContext.Current; SynchronizationContext.SetSynchronizationContext(null); }
        [TearDown] public void RestoreContext() { SynchronizationContext.SetSynchronizationContext(saved); }
    }
}
