import { useState } from "react";

const screens = [
  "login",
  "home",
  "library",
  "filters",
  "program",
  "workout",
  "progress",
  "social",
];

const screenLabels = {
  login: "Login",
  home: "Home",
  library: "Exercise Library",
  filters: "Filter Exercises",
  program: "My Program",
  workout: "Active Workout",
  progress: "Progress Charts",
  social: "Social Feed",
};

// Phone frame component
const PhoneFrame = ({ children, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
    <div
      style={{
        width: 280,
        height: 560,
        borderRadius: 32,
        background: "#0a0a0a",
        padding: "8px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
        position: "relative",
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 90,
          height: 22,
          background: "#0a0a0a",
          borderRadius: "0 0 16px 16px",
          zIndex: 20,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 24,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: 2,
      }}
    >
      {label}
    </span>
  </div>
);

// Status bar
const StatusBar = ({ light = false }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 20px 4px",
      fontSize: 10,
      fontWeight: 600,
      color: light ? "#fff" : "#000",
      position: "relative",
      zIndex: 10,
    }}
  >
    <span>9:41</span>
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <svg width="14" height="10" viewBox="0 0 14 10" fill={light ? "#fff" : "#000"}>
        <rect x="0" y="6" width="2.5" height="4" rx="0.5" />
        <rect x="3.5" y="4" width="2.5" height="6" rx="0.5" />
        <rect x="7" y="2" width="2.5" height="8" rx="0.5" />
        <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" />
      </svg>
      <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke={light ? "#fff" : "#000"} strokeWidth="1">
        <rect x="0.5" y="1" width="15" height="8" rx="2" />
        <rect x="16" y="3.5" width="1.5" height="3" rx="0.5" fill={light ? "#fff" : "#000"} />
        <rect x="2" y="2.5" width="10" height="5" rx="1" fill={light ? "#fff" : "#000"} />
      </svg>
    </div>
  </div>
);

// ---- SCREENS ----

const LoginScreen = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: "linear-gradient(160deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Outfit', sans-serif",
    }}
  >
    <StatusBar light />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px" }}>
      {/* Logo area */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            background: "linear-gradient(135deg, #e8ff47, #7fff00)",
            borderRadius: 14,
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 900,
            color: "#0a0a0a",
            boxShadow: "0 8px 32px rgba(232,255,71,0.3)",
          }}
        >
          ⚡
        </div>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>IRONLOG</h1>
        <p style={{ color: "#666", fontSize: 12, margin: "6px 0 0", letterSpacing: 1 }}>TRACK. LIFT. GROW.</p>
      </div>

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "13px 16px",
            color: "#555",
            fontSize: 13,
          }}
        >
          📧 &nbsp;email@example.com
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "13px 16px",
            color: "#555",
            fontSize: 13,
          }}
        >
          🔒 &nbsp;••••••••
        </div>
        <button
          style={{
            background: "linear-gradient(135deg, #e8ff47, #a8e000)",
            border: "none",
            borderRadius: 12,
            padding: "14px",
            fontSize: 14,
            fontWeight: 700,
            color: "#0a0a0a",
            cursor: "pointer",
            marginTop: 4,
            letterSpacing: 1,
          }}
        >
          SIGN IN
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
        <span style={{ color: "#555", fontSize: 10, letterSpacing: 1 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
      </div>

      {/* Social logins */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px", textAlign: "center", color: "#fff", fontSize: 18 }}>G</div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px", textAlign: "center", color: "#fff", fontSize: 18 }}></div>
      </div>

      <p style={{ textAlign: "center", color: "#555", fontSize: 11, marginTop: 20 }}>
        New here? <span style={{ color: "#e8ff47", fontWeight: 600 }}>Create account</span>
      </p>
    </div>
  </div>
);

const HomeScreen = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: "#0f0f0f",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Outfit', sans-serif",
    }}
  >
    <StatusBar light />
    <div style={{ padding: "8px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <p style={{ color: "#666", fontSize: 11, margin: 0, letterSpacing: 1 }}>TUESDAY, FEB 11</p>
        <h2 style={{ color: "#fff", fontSize: 20, margin: "2px 0 0", fontWeight: 700 }}>Hey, Alex 👋</h2>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #e8ff47, #7fff00)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#0a0a0a" }}>A</div>
    </div>

    {/* Weekly streak */}
    <div style={{ padding: "0 20px", marginBottom: 14 }}>
      <div style={{ background: "rgba(232,255,71,0.06)", border: "1px solid rgba(232,255,71,0.15)", borderRadius: 14, padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ color: "#e8ff47", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>🔥 4 WEEK STREAK</span>
          <span style={{ color: "#555", fontSize: 10 }}>3/5 this week</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: i < 3 ? "linear-gradient(135deg, #e8ff47, #a8e000)" : i === 3 ? "rgba(232,255,71,0.2)" : "rgba(255,255,255,0.05)",
                  margin: "0 auto 3px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: i < 3 ? "#0a0a0a" : "#555",
                  fontWeight: 700,
                  border: i === 3 ? "1px dashed rgba(232,255,71,0.4)" : "none",
                }}
              >
                {i < 3 ? "✓" : ""}
              </div>
              <span style={{ fontSize: 8, color: "#555" }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Quick start */}
    <div style={{ padding: "0 20px", marginBottom: 14 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #e8ff47, #7fff00)",
          borderRadius: 16,
          padding: "16px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 10, color: "#0a0a0a80", fontWeight: 600, letterSpacing: 1 }}>TODAY'S WORKOUT</p>
          <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 800, color: "#0a0a0a" }}>Push Day A</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#0a0a0a80" }}>5 exercises · ~45 min</p>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>▶</div>
      </div>
    </div>

    {/* Recent workouts */}
    <div style={{ padding: "0 20px", flex: 1 }}>
      <p style={{ color: "#666", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, margin: "0 0 8px" }}>RECENT</p>
      {[
        { name: "Pull Day B", date: "Yesterday", vol: "12,450 lbs" },
        { name: "Leg Day", date: "Mon", vol: "18,200 lbs" },
        { name: "Push Day A", date: "Sat", vol: "10,800 lbs" },
      ].map((w, i) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 12,
            padding: "11px 14px",
            marginBottom: 6,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ margin: 0, color: "#fff", fontSize: 13, fontWeight: 600 }}>{w.name}</p>
            <p style={{ margin: "2px 0 0", color: "#555", fontSize: 10 }}>{w.date}</p>
          </div>
          <span style={{ color: "#e8ff47", fontSize: 11, fontWeight: 600 }}>{w.vol}</span>
        </div>
      ))}
    </div>

    {/* Bottom nav */}
    <BottomNav active="home" />
  </div>
);

const LibraryScreen = () => (
  <div style={{ width: "100%", height: "100%", background: "#0f0f0f", display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif" }}>
    <StatusBar light />
    <div style={{ padding: "8px 20px 12px" }}>
      <h2 style={{ color: "#fff", fontSize: 20, margin: 0, fontWeight: 700 }}>Exercise Library</h2>
      {/* Search */}
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px", marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#555" }}>🔍</span>
        <span style={{ color: "#444", fontSize: 13 }}>Search exercises...</span>
      </div>
    </div>

    {/* Categories */}
    <div style={{ padding: "0 20px", display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
      {["All", "Chest", "Back", "Legs", "Arms", "Shoulders"].map((c, i) => (
        <div
          key={i}
          style={{
            padding: "6px 12px",
            borderRadius: 20,
            background: i === 0 ? "#e8ff47" : "rgba(255,255,255,0.06)",
            color: i === 0 ? "#0a0a0a" : "#888",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {c}
        </div>
      ))}
    </div>

    {/* Exercise list */}
    <div style={{ flex: 1, padding: "0 20px", overflowY: "auto" }}>
      {[
        { name: "Bench Press", muscle: "Chest", icon: "🏋️" },
        { name: "Incline DB Press", muscle: "Upper Chest", icon: "💪" },
        { name: "Cable Flyes", muscle: "Chest", icon: "🔄" },
        { name: "Overhead Press", muscle: "Shoulders", icon: "⬆️" },
        { name: "Lateral Raises", muscle: "Side Delts", icon: "↔️" },
        { name: "Tricep Pushdown", muscle: "Triceps", icon: "⬇️" },
        { name: "Skull Crushers", muscle: "Triceps", icon: "💀" },
      ].map((e, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 0",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(232,255,71,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{e.icon}</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: "#fff", fontSize: 13, fontWeight: 600 }}>{e.name}</p>
            <p style={{ margin: "1px 0 0", color: "#555", fontSize: 10 }}>{e.muscle}</p>
          </div>
          <span style={{ color: "#333", fontSize: 16 }}>›</span>
        </div>
      ))}
    </div>
    <BottomNav active="library" />
  </div>
);

const FiltersScreen = () => (
  <div style={{ width: "100%", height: "100%", background: "#0f0f0f", display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif" }}>
    <StatusBar light />
    <div style={{ padding: "8px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2 style={{ color: "#fff", fontSize: 20, margin: 0, fontWeight: 700 }}>Filter Exercises</h2>
      <span style={{ color: "#e8ff47", fontSize: 12, fontWeight: 600 }}>Reset</span>
    </div>

    <div style={{ flex: 1, padding: "0 20px" }}>
      {/* Muscle groups */}
      <p style={{ color: "#666", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, margin: "8px 0 8px" }}>MUSCLE GROUP</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        {[
          { name: "Chest", sel: true },
          { name: "Back", sel: false },
          { name: "Legs", sel: false },
          { name: "Shoulders", sel: true },
          { name: "Arms", sel: false },
          { name: "Core", sel: false },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: m.sel ? "rgba(232,255,71,0.12)" : "rgba(255,255,255,0.04)",
              border: m.sel ? "1px solid rgba(232,255,71,0.4)" : "1px solid rgba(255,255,255,0.06)",
              color: m.sel ? "#e8ff47" : "#888",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {m.sel && <span style={{ fontSize: 10 }}>✓</span>}
            {m.name}
          </div>
        ))}
      </div>

      {/* Equipment */}
      <p style={{ color: "#666", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, margin: "0 0 8px" }}>EQUIPMENT</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        {[
          { name: "Barbell", sel: true },
          { name: "Dumbbell", sel: false },
          { name: "Cable", sel: true },
          { name: "Machine", sel: false },
          { name: "Bodyweight", sel: false },
          { name: "Bands", sel: false },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: m.sel ? "rgba(232,255,71,0.12)" : "rgba(255,255,255,0.04)",
              border: m.sel ? "1px solid rgba(232,255,71,0.4)" : "1px solid rgba(255,255,255,0.06)",
              color: m.sel ? "#e8ff47" : "#888",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {m.sel && <span style={{ fontSize: 10 }}>✓</span>}
            {m.name}
          </div>
        ))}
      </div>

      {/* Difficulty */}
      <p style={{ color: "#666", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, margin: "0 0 8px" }}>DIFFICULTY</p>
      <div style={{ display: "flex", gap: 6 }}>
        {["Beginner", "Intermediate", "Advanced"].map((d, i) => (
          <div key={i} style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRadius: 10, background: i === 1 ? "rgba(232,255,71,0.12)" : "rgba(255,255,255,0.04)", border: i === 1 ? "1px solid rgba(232,255,71,0.4)" : "1px solid rgba(255,255,255,0.06)", color: i === 1 ? "#e8ff47" : "#888", fontSize: 10, fontWeight: 600 }}>
            {d}
          </div>
        ))}
      </div>
    </div>

    {/* Apply button */}
    <div style={{ padding: "12px 20px 20px" }}>
      <div style={{ background: "linear-gradient(135deg, #e8ff47, #a8e000)", borderRadius: 12, padding: "14px", textAlign: "center", fontWeight: 700, fontSize: 13, color: "#0a0a0a", letterSpacing: 0.5 }}>
        Show 24 Exercises
      </div>
    </div>
  </div>
);

const ProgramScreen = () => (
  <div style={{ width: "100%", height: "100%", background: "#0f0f0f", display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif" }}>
    <StatusBar light />
    <div style={{ padding: "8px 20px 12px" }}>
      <p style={{ color: "#666", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, margin: 0 }}>MY PROGRAM</p>
      <h2 style={{ color: "#fff", fontSize: 20, margin: "2px 0 0", fontWeight: 700 }}>Push Pull Legs</h2>
      <p style={{ color: "#555", fontSize: 11, margin: "2px 0 0" }}>6 days/week · Week 4 of 8</p>
    </div>

    {/* Days tabs */}
    <div style={{ padding: "0 20px", display: "flex", gap: 4, marginBottom: 12, overflowX: "auto" }}>
      {["Push A", "Pull A", "Legs", "Push B", "Pull B", "Legs B"].map((d, i) => (
        <div key={i} style={{ padding: "7px 12px", borderRadius: 8, background: i === 0 ? "#e8ff47" : "rgba(255,255,255,0.06)", color: i === 0 ? "#0a0a0a" : "#666", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
          {d}
        </div>
      ))}
    </div>

    {/* Exercise list with sets */}
    <div style={{ flex: 1, padding: "0 20px", overflowY: "auto" }}>
      {[
        { name: "Bench Press", sets: [{ w: 185, r: 8 }, { w: 185, r: 8 }, { w: 195, r: 6 }, { w: 195, r: 6 }] },
        { name: "Incline DB Press", sets: [{ w: 65, r: 10 }, { w: 65, r: 10 }, { w: 70, r: 8 }] },
        { name: "Cable Flyes", sets: [{ w: 30, r: 12 }, { w: 30, r: 12 }, { w: 30, r: 12 }] },
        { name: "OHP", sets: [{ w: 115, r: 8 }, { w: 115, r: 8 }, { w: 120, r: 6 }] },
        { name: "Tricep Pushdown", sets: [{ w: 50, r: 12 }, { w: 55, r: 10 }, { w: 55, r: 10 }] },
      ].map((ex, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <p style={{ margin: 0, color: "#fff", fontSize: 13, fontWeight: 600 }}>{ex.name}</p>
            <span style={{ color: "#333", fontSize: 10 }}>✏️</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {ex.sets.map((s, j) => (
              <div key={j} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 0", textAlign: "center" }}>
                <p style={{ margin: 0, color: "#e8ff47", fontSize: 12, fontWeight: 700 }}>{s.w}</p>
                <p style={{ margin: 0, color: "#555", fontSize: 8 }}>{s.r} reps</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Add exercise */}
    <div style={{ padding: "8px 20px 4px" }}>
      <div style={{ border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px", textAlign: "center", color: "#555", fontSize: 12 }}>+ Add Exercise</div>
    </div>
    <BottomNav active="program" />
  </div>
);

const WorkoutScreen = () => (
  <div style={{ width: "100%", height: "100%", background: "#0f0f0f", display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif" }}>
    <StatusBar light />
    <div style={{ padding: "8px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "#e8ff47", fontSize: 12, fontWeight: 600 }}>← End</span>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, color: "#fff", fontSize: 14, fontWeight: 700 }}>Push Day A</p>
      </div>
      <span style={{ color: "#e8ff47", fontSize: 22, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>32:14</span>
    </div>

    {/* Current exercise */}
    <div style={{ padding: "12px 20px 0" }}>
      <div style={{ background: "rgba(232,255,71,0.06)", border: "1px solid rgba(232,255,71,0.15)", borderRadius: 16, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <p style={{ margin: 0, color: "#e8ff47", fontSize: 9, fontWeight: 700, letterSpacing: 1.5 }}>EXERCISE 2/5</p>
            <p style={{ margin: "2px 0 0", color: "#fff", fontSize: 16, fontWeight: 700 }}>Incline DB Press</p>
          </div>
          <span style={{ fontSize: 10, color: "#555" }}>Rest: 90s</span>
        </div>

        {/* Sets table */}
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <div style={{ width: 30, fontSize: 9, color: "#555", textAlign: "center" }}>SET</div>
          <div style={{ flex: 1, fontSize: 9, color: "#555", textAlign: "center" }}>PREV</div>
          <div style={{ flex: 1, fontSize: 9, color: "#555", textAlign: "center" }}>LBS</div>
          <div style={{ flex: 1, fontSize: 9, color: "#555", textAlign: "center" }}>REPS</div>
          <div style={{ width: 30, fontSize: 9, color: "#555", textAlign: "center" }}>✓</div>
        </div>
        {[
          { set: 1, prev: "65×10", lbs: "65", reps: "10", done: true },
          { set: 2, prev: "65×10", lbs: "70", reps: "8", done: true },
          { set: 3, prev: "70×8", lbs: "70", reps: "", done: false },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
            <div style={{ width: 30, textAlign: "center", color: "#888", fontSize: 12, fontWeight: 700 }}>{s.set}</div>
            <div style={{ flex: 1, textAlign: "center", color: "#444", fontSize: 11 }}>{s.prev}</div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ background: s.done ? "rgba(232,255,71,0.1)" : "rgba(255,255,255,0.06)", borderRadius: 6, padding: "5px 0", color: s.done ? "#e8ff47" : "#666", fontSize: 12, fontWeight: 600 }}>{s.lbs || "-"}</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ background: s.done ? "rgba(232,255,71,0.1)" : "rgba(255,255,255,0.06)", borderRadius: 6, padding: "5px 0", color: s.done ? "#e8ff47" : "#666", fontSize: 12, fontWeight: 600 }}>{s.reps || "-"}</div>
            </div>
            <div style={{ width: 30, textAlign: "center" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: s.done ? "#e8ff47" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: 10, color: "#0a0a0a" }}>
                {s.done ? "✓" : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Completed exercises */}
    <div style={{ flex: 1, padding: "12px 20px 0" }}>
      <p style={{ color: "#666", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, margin: "0 0 6px" }}>COMPLETED</p>
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, color: "#888", fontSize: 12, fontWeight: 600 }}>Bench Press</p>
          <p style={{ margin: 0, color: "#444", fontSize: 10 }}>4 sets · 185-195 lbs</p>
        </div>
        <span style={{ color: "#e8ff47", fontSize: 14 }}>✓</span>
      </div>

      <p style={{ color: "#666", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, margin: "12px 0 6px" }}>UP NEXT</p>
      {["Cable Flyes", "OHP", "Tricep Pushdown"].map((e, i) => (
        <div key={i} style={{ padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#555", fontSize: 12 }}>{e}</div>
      ))}
    </div>
    <div style={{ height: 16 }} />
  </div>
);

const ProgressScreen = () => {
  const chartData = [
    { w: "W1", v: 155 },
    { w: "W2", v: 160 },
    { w: "W3", v: 165 },
    { w: "W4", v: 165 },
    { w: "W5", v: 170 },
    { w: "W6", v: 175 },
    { w: "W7", v: 180 },
    { w: "W8", v: 185 },
  ];
  const max = 200;
  return (
    <div style={{ width: "100%", height: "100%", background: "#0f0f0f", display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif" }}>
      <StatusBar light />
      <div style={{ padding: "8px 20px 12px" }}>
        <h2 style={{ color: "#fff", fontSize: 20, margin: 0, fontWeight: 700 }}>Progress</h2>
      </div>

      {/* Exercise selector */}
      <div style={{ padding: "0 20px", marginBottom: 12 }}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Bench Press</span>
          <span style={{ color: "#555" }}>▼</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: "0 20px", marginBottom: 12 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#666", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>1RM ESTIMATE</span>
            <span style={{ color: "#e8ff47", fontSize: 14, fontWeight: 800 }}>185 lbs</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div
                  style={{
                    width: "100%",
                    height: `${(d.v / max) * 100}%`,
                    background: i === chartData.length - 1 ? "linear-gradient(180deg, #e8ff47, #a8e000)" : "rgba(232,255,71,0.2)",
                    borderRadius: 4,
                    minHeight: 8,
                  }}
                />
                <span style={{ fontSize: 7, color: "#555" }}>{d.w}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, gap: 4 }}>
            <span style={{ color: "#7fff00", fontSize: 11, fontWeight: 700 }}>↑ 19%</span>
            <span style={{ color: "#555", fontSize: 10 }}>in 8 weeks</span>
          </div>
        </div>
      </div>

      {/* Volume chart */}
      <div style={{ padding: "0 20px", marginBottom: 12 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#666", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>WEEKLY VOLUME</span>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>52,400 lbs</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
            {[60, 68, 72, 65, 78, 82, 88, 95].map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${v}%`, background: `rgba(71, 180, 255, ${0.2 + i * 0.08})`, borderRadius: 3 }} />
            ))}
          </div>
        </div>
      </div>

      {/* PRs */}
      <div style={{ padding: "0 20px" }}>
        <p style={{ color: "#666", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, margin: "0 0 6px" }}>PERSONAL RECORDS</p>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { lift: "Bench", pr: "205 lbs" },
            { lift: "Squat", pr: "285 lbs" },
            { lift: "Dead", pr: "335 lbs" },
          ].map((p, i) => (
            <div key={i} style={{ flex: 1, background: "rgba(232,255,71,0.06)", border: "1px solid rgba(232,255,71,0.12)", borderRadius: 10, padding: "10px 0", textAlign: "center" }}>
              <p style={{ margin: 0, color: "#e8ff47", fontSize: 14, fontWeight: 800 }}>{p.pr}</p>
              <p style={{ margin: "2px 0 0", color: "#555", fontSize: 9 }}>{p.lift}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <BottomNav active="progress" />
    </div>
  );
};

const SocialScreen = () => (
  <div style={{ width: "100%", height: "100%", background: "#0f0f0f", display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif" }}>
    <StatusBar light />
    <div style={{ padding: "8px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2 style={{ color: "#fff", fontSize: 20, margin: 0, fontWeight: 700 }}>Feed</h2>
      <span style={{ color: "#e8ff47", fontSize: 12, fontWeight: 600 }}>Share</span>
    </div>

    <div style={{ flex: 1, padding: "0 20px", overflowY: "auto" }}>
      {[
        {
          user: "Mike R.",
          avatar: "M",
          time: "2h ago",
          text: "New bench PR! 225 lbs 🎉",
          stats: "Bench Press · 225 × 1",
          likes: 12,
          color: "#ff6b6b",
        },
        {
          user: "Sarah K.",
          avatar: "S",
          time: "5h ago",
          text: "Leg day is done. 5 exercises, 90 min 🦵",
          stats: "Total Volume: 22,500 lbs",
          likes: 8,
          color: "#6bc5ff",
        },
        {
          user: "Alex (You)",
          avatar: "A",
          time: "1d ago",
          text: "Week 4 complete! Progressive overload hitting different",
          stats: "Push Day A · 12,450 lbs total",
          likes: 15,
          color: "#e8ff47",
        },
      ].map((post, i) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 14,
            padding: "14px",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: post.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#0a0a0a" }}>{post.avatar}</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: "#fff", fontSize: 12, fontWeight: 600 }}>{post.user}</p>
              <p style={{ margin: 0, color: "#555", fontSize: 9 }}>{post.time}</p>
            </div>
          </div>
          <p style={{ margin: "0 0 6px", color: "#ddd", fontSize: 12 }}>{post.text}</p>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
            <p style={{ margin: 0, color: "#e8ff47", fontSize: 11, fontWeight: 600 }}>{post.stats}</p>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ color: "#555", fontSize: 11 }}>❤️ {post.likes}</span>
            <span style={{ color: "#555", fontSize: 11 }}>💬 Comment</span>
            <span style={{ color: "#555", fontSize: 11 }}>🔥 Fire</span>
          </div>
        </div>
      ))}
    </div>
    <BottomNav active="social" />
  </div>
);

const BottomNav = ({ active }) => (
  <div style={{ display: "flex", padding: "8px 10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0f0f0f" }}>
    {[
      { id: "home", icon: "🏠", label: "Home" },
      { id: "library", icon: "📚", label: "Library" },
      { id: "program", icon: "📋", label: "Program" },
      { id: "progress", icon: "📈", label: "Progress" },
      { id: "social", icon: "👥", label: "Social" },
    ].map((n) => (
      <div key={n.id} style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 16, marginBottom: 1, opacity: active === n.id ? 1 : 0.4 }}>{n.icon}</div>
        <div style={{ fontSize: 8, color: active === n.id ? "#e8ff47" : "#555", fontWeight: active === n.id ? 700 : 400 }}>{n.label}</div>
      </div>
    ))}
  </div>
);

// ---- MAIN APP ----
const screenComponents = {
  login: LoginScreen,
  home: HomeScreen,
  library: LibraryScreen,
  filters: FiltersScreen,
  program: ProgramScreen,
  workout: WorkoutScreen,
  progress: ProgressScreen,
  social: SocialScreen,
};

export default function WorkoutAppMockups() {
  const [activeScreen, setActiveScreen] = useState(null);

  const ScreenComponent = activeScreen ? screenComponents[activeScreen] : null;

  return (
    <div style={{ minHeight: "100vh", background: "#111", padding: "32px 16px", fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #e8ff47, #7fff00)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
            <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: -1 }}>IRONLOG</h1>
          </div>
          <p style={{ color: "#555", fontSize: 13, margin: 0, letterSpacing: 2 }}>WORKOUT TRACKER · APP MOCKUPS</p>
          <p style={{ color: "#444", fontSize: 11, margin: "8px 0 0" }}>Click any screen to view full size · 8 screens total</p>
        </div>

        {/* Fullscreen overlay */}
        {ScreenComponent && (
          <div
            onClick={() => setActiveScreen(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(12px)",
            }}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <PhoneFrame label={screenLabels[activeScreen]}>
                <ScreenComponent />
              </PhoneFrame>
            </div>
          </div>
        )}

        {/* Grid of screens */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            justifyItems: "center",
          }}
        >
          {screens.map((s) => {
            const Comp = screenComponents[s];
            return (
              <div
                key={s}
                onClick={() => setActiveScreen(s)}
                style={{ cursor: "pointer", transition: "transform 0.2s", transform: "scale(1)" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <PhoneFrame label={screenLabels[s]}>
                  <Comp />
                </PhoneFrame>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
