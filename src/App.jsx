import { useEffect, useState } from "react";
import "./App.css";

const DEFAULT_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

function App() {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("focusflow-settings");

    return savedSettings
      ? JSON.parse(savedSettings)
      : DEFAULT_SETTINGS;
  });

  const [mode, setMode] = useState("pomodoro");

  const [time, setTime] = useState(() => {
    const savedTime = localStorage.getItem("focusflow-time");

    return savedTime
      ? Number(savedTime)
      : DEFAULT_SETTINGS.focusMinutes * 60;
  });

  const [isRunning, setIsRunning] = useState(false);

  const [sessions, setSessions] = useState(() => {
    const savedSessions = localStorage.getItem("focusflow-sessions");

    return savedSessions ? Number(savedSessions) : 0;
  });

  const [sessionHistory, setSessionHistory] = useState(() => {
    const savedHistory = localStorage.getItem(
      "focusflow-session-history"
    );

    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);

  const [focusMinutes, setFocusMinutes] = useState(
    settings.focusMinutes
  );

  const [shortBreakMinutes, setShortBreakMinutes] = useState(
    settings.shortBreakMinutes
  );

  const [longBreakMinutes, setLongBreakMinutes] = useState(
    settings.longBreakMinutes
  );

  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] =
    useState(settings.sessionsBeforeLongBreak);

  const getDuration = (selectedMode) => {
    if (selectedMode === "pomodoro") {
      return settings.focusMinutes * 60;
    }

    if (selectedMode === "shortBreak") {
      return settings.shortBreakMinutes * 60;
    }

    return settings.longBreakMinutes * 60;
  };

  /* SAVE SETTINGS */

  useEffect(() => {
    localStorage.setItem(
      "focusflow-settings",
      JSON.stringify(settings)
    );
  }, [settings]);

  /* SAVE SESSIONS */

  useEffect(() => {
    localStorage.setItem(
      "focusflow-sessions",
      sessions.toString()
    );
  }, [sessions]);

  /* SAVE TIMER */

  useEffect(() => {
    localStorage.setItem(
      "focusflow-time",
      time.toString()
    );
  }, [time]);

  /* SAVE SESSION HISTORY */

  useEffect(() => {
    localStorage.setItem(
      "focusflow-session-history",
      JSON.stringify(sessionHistory)
    );
  }, [sessionHistory]);

  /* NOTIFICATION */

  const sendNotification = (title, message) => {
    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(title, {
        body: message,
      });
    }
  };

  /* SOUND */

  const playNotificationSound = () => {
    try {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      const audioContext = new AudioContext();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(
        0.2,
        audioContext.currentTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime + 0.5
      );
    } catch (error) {
      console.log("Sound could not be played.");
    }
  };

  /* AUTOMATIC MODE SWITCHING */

  const switchModeAutomatically = () => {
    if (mode === "pomodoro") {
      const completedSessions = sessions + 1;

      setSessions(completedSessions);

      /* RECORD COMPLETED SESSION */

      const newSession = {
        id: Date.now(),
        completedAt: new Date().toISOString(),
        duration: settings.focusMinutes,
      };

      setSessionHistory((currentHistory) => [
        newSession,
        ...currentHistory,
      ]);

      /* DECIDE BREAK TYPE */

      if (
        completedSessions %
          settings.sessionsBeforeLongBreak ===
        0
      ) {
        setMode("longBreak");

        setTime(
          settings.longBreakMinutes * 60
        );

        sendNotification(
          "Focus session complete",
          "Time for a long break."
        );
      } else {
        setMode("shortBreak");

        setTime(
          settings.shortBreakMinutes * 60
        );

        sendNotification(
          "Focus session complete",
          "Time for a short break."
        );
      }
    } else {
      setMode("pomodoro");

      setTime(
        settings.focusMinutes * 60
      );

      sendNotification(
        "Break complete",
        "Time to focus again."
      );
    }

    playNotificationSound();

    setIsRunning(false);
  };

  /* TIMER */

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTime((currentTime) => {
        if (currentTime <= 1) {
          clearInterval(timer);

          switchModeAutomatically();

          return 0;
        }

        return currentTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isRunning,
    mode,
    sessions,
    settings,
  ]);

  /* NOTIFICATION PERMISSION */

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  };

  /* START / PAUSE */

  const toggleTimer = async () => {
    if (!isRunning) {
      await requestNotificationPermission();
    }

    setIsRunning((current) => !current);
  };

  /* CHANGE MODE */

  const changeMode = (newMode) => {
    setMode(newMode);

    setTime(
      getDuration(newMode)
    );

    setIsRunning(false);
  };

  /* RESET */

  const resetTimer = () => {
    setTime(
      getDuration(mode)
    );

    setIsRunning(false);
  };

  /* APPLY SETTINGS */

  const applySettings = () => {
    const newSettings = {
      focusMinutes: Math.max(
        1,
        Number(focusMinutes)
      ),

      shortBreakMinutes: Math.max(
        1,
        Number(shortBreakMinutes)
      ),

      longBreakMinutes: Math.max(
        1,
        Number(longBreakMinutes)
      ),

      sessionsBeforeLongBreak: Math.max(
        1,
        Number(sessionsBeforeLongBreak)
      ),
    };

    setSettings(newSettings);

    setFocusMinutes(
      newSettings.focusMinutes
    );

    setShortBreakMinutes(
      newSettings.shortBreakMinutes
    );

    setLongBreakMinutes(
      newSettings.longBreakMinutes
    );

    setSessionsBeforeLongBreak(
      newSettings.sessionsBeforeLongBreak
    );

    if (mode === "pomodoro") {
      setTime(
        newSettings.focusMinutes * 60
      );
    } else if (mode === "shortBreak") {
      setTime(
        newSettings.shortBreakMinutes * 60
      );
    } else {
      setTime(
        newSettings.longBreakMinutes * 60
      );
    }

    setIsRunning(false);

    setSettingsOpen(false);
  };

  /* CLEAR HISTORY */

  const clearHistory = () => {
    setSessionHistory([]);
    setSessions(0);
  };

  /* TIME DISPLAY */

  const minutes = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (time % 60)
    .toString()
    .padStart(2, "0");

  /* PROGRESS */

  const duration = getDuration(mode);

  const progress =
    duration > 0
      ? ((duration - time) / duration) * 100
      : 0;

  /* CURRENT MODE */

  const currentModeName =
    mode === "pomodoro"
      ? "Focus"
      : mode === "shortBreak"
      ? "Short Break"
      : "Long Break";

  /* TOTAL FOCUS TIME */

  const totalFocusMinutes =
    sessionHistory.reduce(
      (total, session) =>
        total + Number(session.duration),
      0
    );

  /* TODAY'S SESSIONS */

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const todaySessions =
    sessionHistory.filter((session) =>
      session.completedAt.startsWith(today)
    ).length;

  return (
    <main className="app">

      {/* HEADER */}

      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            P
          </div>

          <span>
            FocusFlow
          </span>
        </div>

        <div className="session-badge">
          <span className="status-dot"></span>

          Session {sessions + 1}
        </div>
      </header>

      {/* HERO */}

      <section className="hero">

        <p className="eyebrow">
          FOCUS TIMER
        </p>

        <h1>
          Stay focused.
          <br />

          <span>
            Get things done.
          </span>
        </h1>

        <p className="subtitle">
          Work with intention, take meaningful
          breaks, and build better focus habits.
        </p>

      </section>

      {/* TIMER */}

      <section className="timer-card">

        <div className="mode-selector">

          <button
            className={
              mode === "pomodoro"
                ? "active"
                : ""
            }
            onClick={() =>
              changeMode("pomodoro")
            }
          >
            Focus
          </button>

          <button
            className={
              mode === "shortBreak"
                ? "active"
                : ""
            }
            onClick={() =>
              changeMode("shortBreak")
            }
          >
            Short Break
          </button>

          <button
            className={
              mode === "longBreak"
                ? "active"
                : ""
            }
            onClick={() =>
              changeMode("longBreak")
            }
          >
            Long Break
          </button>

        </div>

        <div className="timer">

          <span>
            {minutes}
          </span>

          <span className="colon">
            :
          </span>

          <span>
            {seconds}
          </span>

        </div>

        <div className="progress-container">

          <div
            className="progress-bar"
            style={{
              width: `${progress}%`,
            }}
          ></div>

        </div>

        <div className="timer-controls">

          <button
            className="reset-button"
            onClick={resetTimer}
          >
            Reset
          </button>

          <button
            className="start-button"
            onClick={toggleTimer}
          >
            {isRunning
              ? "Pause"
              : "Start Focus"}
          </button>

        </div>

      </section>

      {/* STATISTICS */}

      <section className="stats">

        <div className="stat-card">

          <span className="stat-label">
            Completed sessions
          </span>

          <strong>
            {sessions}
          </strong>

        </div>

        <div className="stat-card">

          <span className="stat-label">
            Focus duration
          </span>

          <strong>
            {settings.focusMinutes} min
          </strong>

        </div>

        <div className="stat-card">

          <span className="stat-label">
            Current mode
          </span>

          <strong>
            {currentModeName}
          </strong>

        </div>

      </section>

      {/* SETTINGS */}

      <section className="settings-section">

        <button
          className="reset-button"
          onClick={() =>
            setSettingsOpen(
              (current) => !current
            )
          }
        >
          {settingsOpen
            ? "Close Settings"
            : "Settings"}
        </button>

        {settingsOpen && (

          <div className="settings-panel">

            <h2>
              Timer Settings
            </h2>

            <div className="setting-row">

              <label htmlFor="focusMinutes">
                Focus duration
              </label>

              <input
                id="focusMinutes"
                type="number"
                min="1"
                value={focusMinutes}
                onChange={(event) =>
                  setFocusMinutes(
                    event.target.value
                  )
                }
              />

            </div>

            <div className="setting-row">

              <label htmlFor="shortBreakMinutes">
                Short break
              </label>

              <input
                id="shortBreakMinutes"
                type="number"
                min="1"
                value={shortBreakMinutes}
                onChange={(event) =>
                  setShortBreakMinutes(
                    event.target.value
                  )
                }
              />

            </div>

            <div className="setting-row">

              <label htmlFor="longBreakMinutes">
                Long break
              </label>

              <input
                id="longBreakMinutes"
                type="number"
                min="1"
                value={longBreakMinutes}
                onChange={(event) =>
                  setLongBreakMinutes(
                    event.target.value
                  )
                }
              />

            </div>

            <div className="setting-row">

              <label htmlFor="sessionsBeforeLongBreak">
                Sessions before long break
              </label>

              <input
                id="sessionsBeforeLongBreak"
                type="number"
                min="1"
                value={
                  sessionsBeforeLongBreak
                }
                onChange={(event) =>
                  setSessionsBeforeLongBreak(
                    event.target.value
                  )
                }
              />

            </div>

            <button
              className="start-button"
              onClick={applySettings}
            >
              Apply Settings
            </button>

          </div>

        )}

      </section>

      {/* PRODUCTIVITY */}

      <section className="settings-section">

        <button
          className="reset-button"
          onClick={() =>
            setHistoryOpen(
              (current) => !current
            )
          }
        >
          {historyOpen
            ? "Close Statistics"
            : "Productivity Statistics"}
        </button>

        {historyOpen && (

          <div className="settings-panel">

            <h2>
              Productivity
            </h2>

            <div className="setting-row">
              <label>
                Total sessions
              </label>

              <strong>
                {sessions}
              </strong>
            </div>

            <div className="setting-row">
              <label>
                Today's sessions
              </label>

              <strong>
                {todaySessions}
              </strong>
            </div>

            <div className="setting-row">
              <label>
                Total focus time
              </label>

              <strong>
                {totalFocusMinutes} min
              </strong>
            </div>

            <div className="setting-row">
              <label>
                Session history
              </label>

              <strong>
                {sessionHistory.length}
              </strong>
            </div>

            <button
              className="reset-button"
              onClick={clearHistory}
            >
              Clear Statistics
            </button>

          </div>

        )}

      </section>

      {/* SESSION HISTORY */}

      {sessionHistory.length > 0 && (

        <section className="settings-section">

          <div className="settings-panel">

            <h2>
              Recent Sessions
            </h2>

            {sessionHistory
              .slice(0, 10)
              .map((session, index) => {

                const date =
                  new Date(
                    session.completedAt
                  );

                return (
                  <div
                    className="setting-row"
                    key={session.id}
                  >
                    <label>
                      Session{" "}
                      {sessionHistory.length -
                        index}
                    </label>

                    <strong>
                      {session.duration} min
                      {" · "}
                      {date.toLocaleDateString()}
                      {" "}
                      {date.toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </strong>
                  </div>
                );
              })}

          </div>

        </section>

      )}

      {/* FOOTER */}

      <footer>

        <p>
          FocusFlow · Built with React
        </p>

      </footer>

    </main>
  );
}

export default App;