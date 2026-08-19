import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, User, Check, Clock, MapPin, Backpack, RotateCcw, Loader2, FileDown } from "lucide-react";

const CLUBS = [
  { no: 1, dept: "문학필사반", teacher: "정은숙", grade: "1" },
  { no: 2, dept: "스크린영어탐험대", teacher: "최경진", grade: "1" },
  { no: 3, dept: "매체탐구반1", teacher: "김현실", grade: "1" },
  { no: 4, dept: "미디어 속 과학", teacher: "김연빈", grade: "1" },
  { no: 5, dept: "탁구반", teacher: "김형민", grade: "2" },
  { no: 6, dept: "창의공작반", teacher: "이채현", grade: "2" },
  { no: 7, dept: "매체탐구반2", teacher: "김여운", grade: "2" },
  { no: 8, dept: "역사탐구반", teacher: "이준호", grade: "2" },
  { no: 9, dept: "수학전도사", teacher: "옥수정", grade: "2" },
  { no: 10, dept: "영화토론반", teacher: "이현주", grade: "3" },
  { no: 11, dept: "역사랑반", teacher: "조희정", grade: "3" },
  { no: 12, dept: "예술체험반", teacher: "김예원", grade: "3" },
  { no: 13, dept: "수학진로체험반", teacher: "김미성", grade: "3" },
  { no: 14, dept: "진로탐색반", teacher: "김정효", grade: "3" },
  { no: 15, dept: "영어문화탐험반", teacher: "이영례", grade: "3" },
  { no: 16, dept: "인문독서토론반", teacher: "이정혜", grade: "전학년" },
  { no: 17, dept: "과학탐구반", teacher: "유동선", grade: "전학년" },
  { no: 18, dept: "생활과학반", teacher: "정재경", grade: "전학년" },
  { no: 19, dept: "대중문화비평반", teacher: "김상윤", grade: "전학년" },
  { no: 20, dept: "문화체험반", teacher: "정지혜", grade: "전학년" },
  { no: 21, dept: "솔리언 또래상담반", teacher: "김희정", grade: "전학년" },
  { no: 22, dept: "치어리딩반", teacher: "도영채", grade: "전학년" },
  { no: 23, dept: "뉴스포츠반", teacher: "박건문", grade: "전학년" },
  { no: 24, dept: "스파이크반", teacher: "이석훈", grade: "전학년" },
  { no: 25, dept: "밴드반", teacher: "정숙래", grade: "전학년" },
  { no: 26, dept: "보드게임반", teacher: "이선자", grade: "전학년" },
  { no: 27, dept: "AI코딩반", teacher: "정이영", grade: "전학년" },
];

const blankEntry = () => ({
  meetPlace: "",
  actPlace: "",
  supplies: "",
  meetTime: "13:20",
  submitted: false,
  submittedAt: null,
});

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}
function prevMonths(d, n) {
  const arr = [];
  for (let i = 1; i <= n; i++) {
    arr.push(new Date(d.getFullYear(), d.getMonth() - i, 1));
  }
  return arr;
}

const AVAILABLE_MONTHS = [
  new Date(2026, 8, 1), // 2026년 9월
  // 10월이 열리면 여기에 new Date(2026, 9, 1) 을 추가하면 됩니다.
];

export default function DonariJangsoApp() {
  const [screen, setScreen] = useState("intro"); // 'intro' | 'main'
  const [cursor, setCursor] = useState(() => AVAILABLE_MONTHS[0]);
  const [roster, setRoster] = useState(null); // { [no]: entry }
  const [loading, setLoading] = useState(true);
  const [carriedOver, setCarriedOver] = useState(false);
  const [role, setRole] = useState("select"); // 'select' | teacher name | 'admin'
  const [openNo, setOpenNo] = useState(null);
  const [draft, setDraft] = useState(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("table"); // 'table' | 'list'

  const mKey = monthKey(cursor);

  const loadMonth = useCallback(async (targetDate) => {
    setLoading(true);
    setCarriedOver(false);
    const key = `roster:${monthKey(targetDate)}`;
    try {
      const result = await window.storage.get(key, true);
      if (result && result.value) {
        setRoster(JSON.parse(result.value));
        setLoading(false);
        return;
      }
    } catch (e) {
      // key not found — fall through to lookback
    }
    // no data for this month yet — try to carry forward the most recent prior month
    let base = null;
    for (const d of prevMonths(targetDate, 6)) {
      try {
        const r = await window.storage.get(`roster:${monthKey(d)}`, true);
        if (r && r.value) {
          base = JSON.parse(r.value);
          break;
        }
      } catch (e) {
        // continue looking back
      }
    }
    const fresh = {};
    CLUBS.forEach((c) => {
      if (base && base[c.no]) {
        fresh[c.no] = { ...base[c.no], submitted: false, submittedAt: null };
      } else {
        fresh[c.no] = blankEntry();
      }
    });
    setRoster(fresh);
    setCarriedOver(!!base);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMonth(cursor);
  }, [cursor, loadMonth]);

  const saveRoster = useCallback(
    async (next) => {
      setRoster(next);
      setSaving(true);
      try {
        const res = await window.storage.set(`roster:${mKey}`, JSON.stringify(next), true);
        if (!res) throw new Error("save failed");
      } catch (e) {
        setToast("저장에 실패했어요. 다시 시도해주세요.");
      } finally {
        setSaving(false);
      }
    },
    [mKey]
  );

  const stats = useMemo(() => {
    if (!roster) return { done: 0, total: CLUBS.length };
    const done = CLUBS.filter((c) => roster[c.no]?.submitted).length;
    return { done, total: CLUBS.length };
  }, [roster]);

  const canEdit = (club) => role === "admin" || role === club.teacher;

  const openRow = (club) => {
    if (!canEdit(club)) return;
    setOpenNo(club.no);
    setDraft({ ...roster[club.no] });
  };

  const closeRow = () => {
    setOpenNo(null);
    setDraft(null);
  };

  const submitRow = async (club) => {
    if (!draft) return;
    const entry = { ...draft, submitted: true, submittedAt: new Date().toISOString() };
    const next = { ...roster, [club.no]: entry };
    await saveRoster(next);
    setToast(`🫧 제출 완료! 감사합니다!`);
    closeRow();
  };

  const saveWithoutSubmit = async (club) => {
    if (!draft) return;
    const next = { ...roster, [club.no]: { ...draft } };
    await saveRoster(next);
    closeRow();
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const shift = (delta) => {
    const idx = AVAILABLE_MONTHS.findIndex((d) => monthKey(d) === mKey);
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= AVAILABLE_MONTHS.length) return;
    setCursor(AVAILABLE_MONTHS[nextIdx]);
  };
  const monthIdx = AVAILABLE_MONTHS.findIndex((d) => monthKey(d) === mKey);
  const hasPrev = monthIdx > 0;
  const hasNext = monthIdx < AVAILABLE_MONTHS.length - 1;

  const exportToWord = () => {
    if (!roster) return;
    const rowsHtml = CLUBS.map((c) => {
      const e = roster[c.no] || blankEntry();
      return `<tr>
        <td style="text-align:center;">${c.no}</td>
        <td>${c.dept}</td>
        <td style="text-align:center;">${c.teacher}</td>
        <td style="text-align:center;">${c.grade}</td>
        <td>${e.meetPlace || ""}</td>
        <td>${e.actPlace || ""}</td>
        <td>${e.supplies || ""}</td>
        <td style="text-align:center;">${e.meetTime || ""}</td>
        <td style="text-align:center;">${e.submitted ? "제출완료" : "미제출"}</td>
      </tr>`;
    }).join("");

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${monthLabel(cursor)} 동아리 활동 장소 취합</title></head>
      <body style="font-family:'맑은 고딕', sans-serif;">
        <h2>${monthLabel(cursor)} 동아리 활동 장소 취합</h2>
        <p>제출 현황: ${stats.done} / ${stats.total}개 완료</p>
        <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse; width:100%; font-size:11pt;">
          <thead>
            <tr style="background:#DBF2FA;">
              <th>연번</th><th>부서명</th><th>담당교사</th><th>학년</th>
              <th>집합장소</th><th>활동장소</th><th>준비물</th><th>집합시간</th><th>제출상태</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>`;

    try {
      const blob = new Blob(["\ufeff", html], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `동아리_활동장소_취합_${mKey}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast("워드 파일로 내보냈어요");
    } catch (e) {
      setToast("내보내기에 실패했어요. 다시 시도해주세요.");
    }
  };

  return (
    <div style={styles.page}>
      <style>{fontImport}</style>
      <BubbleField />

      {screen === "intro" ? (
        <IntroScreen onNext={() => setScreen("main")} />
      ) : (
      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SpongeMascot />
            <div>
              <p style={styles.eyebrow}>덕천중학교 · 동아리 활동</p>
              <h1 style={styles.title}>동아리 장소 취합소</h1>
            </div>
          </div>
          <RoleSwitcher role={role} setRole={setRole} attention={role === "select"} />
        </header>

        <div style={styles.controlCard}>
          <div style={styles.monthBar}>
            <button
              style={{ ...styles.iconBtn, opacity: hasPrev ? 1 : 0.35, cursor: hasPrev ? "pointer" : "default" }}
              onClick={() => shift(-1)}
              disabled={!hasPrev}
              aria-label="이전 달"
            >
              <ChevronLeft size={18} />
            </button>
            <span style={styles.monthLabel}>{monthLabel(cursor)}</span>
            <button
              style={{ ...styles.iconBtn, opacity: hasNext ? 1 : 0.35, cursor: hasNext ? "pointer" : "default" }}
              onClick={() => shift(1)}
              disabled={!hasNext}
              aria-label="다음 달"
            >
              <ChevronRight size={18} />
            </button>
            {carriedOver && (
              <span style={styles.carriedTag}>
                <RotateCcw size={12} style={{ marginRight: 4 }} />
                지난달 내용 불러옴
              </span>
            )}
          </div>

          <div style={styles.progressWrap}>
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${(stats.done / stats.total) * 100}%`,
                }}
              />
            </div>
            <span style={styles.progressText}>
              {stats.total}개 동아리 중 <b>{stats.done}개</b> 제출 완료
              {saving && <Loader2 size={13} style={{ marginLeft: 6, animation: "spin 0.9s linear infinite" }} />}
            </span>
          </div>

          {view === "list" && role === "select" && (
            <div style={styles.hintStrong}>
              <span style={styles.hintIcon}>👆</span>
              <span>
                <b>먼저 위에서 본인 이름을 선택해주세요!</b>
                <br />
                이름을 선택해야 정보를 입력할 수 있어요.
              </span>
            </div>
          )}

          {role === "admin" && (
            <button style={styles.exportBtn} onClick={exportToWord}>
              <FileDown size={15} style={{ marginRight: 6 }} />
              이번 달 전체 워드 파일로 내보내기
            </button>
          )}
        </div>

        <div style={styles.viewTabs}>
          <button
            style={view === "table" ? styles.viewTabActive : styles.viewTab}
            onClick={() => setView("table")}
          >
            📋 전체 한눈에 보기
          </button>
          <button
            style={view === "list" ? styles.viewTabActive : styles.viewTab}
            onClick={() => setView("list")}
          >
            ✏️ 내 동아리 입력하기
          </button>
        </div>

        {loading || !roster ? (
          <div style={styles.loadingBox}>불러오는 중…</div>
        ) : view === "table" ? (
          <OverviewTable roster={roster} />
        ) : (
          <ul style={styles.list}>
            {CLUBS.map((club) => {
              const entry = roster[club.no];
              const editable = canEdit(club);
              const isOpen = openNo === club.no;
              return (
                <li key={club.no} style={styles.row}>
                  <div
                    style={{
                      ...styles.rowMain,
                      cursor: editable ? "pointer" : "default",
                      opacity: editable || role === "select" ? 1 : 0.55,
                    }}
                    onClick={() => (isOpen ? closeRow() : openRow(club))}
                  >
                    <span style={styles.rowNo}>{String(club.no).padStart(2, "0")}</span>
                    <div style={styles.rowText}>
                      <div style={styles.rowTop}>
                        <span style={styles.deptName}>{club.dept}</span>
                        <span style={styles.gradeTag}>{club.grade}학년 · {club.teacher}</span>
                      </div>
                      <div style={styles.rowMeta}>
                        {entry.actPlace ? (
                          <span style={styles.metaItem}>
                            <MapPin size={12} /> {entry.actPlace}
                          </span>
                        ) : (
                          <span style={{ ...styles.metaItem, color: "var(--ink-faint)" }}>장소 미입력</span>
                        )}
                        <span style={styles.metaItem}>
                          <Clock size={12} /> {entry.meetTime}
                        </span>
                      </div>
                    </div>
                    <Stamp submitted={entry.submitted} />
                  </div>

                  {isOpen && draft && (
                    <EditPanel
                      club={club}
                      draft={draft}
                      setDraft={setDraft}
                      onSubmit={() => submitRow(club)}
                      onSaveDraft={() => saveWithoutSubmit(club)}
                      onCancel={closeRow}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

function OverviewTable({ roster }) {
  return (
    <div style={styles.tableCard}>
      <div style={styles.tableScroll}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>동아리</th>
              <th style={styles.th}>담당</th>
              <th style={styles.th}>학년</th>
              <th style={styles.th}>집합장소</th>
              <th style={styles.th}>활동장소</th>
              <th style={styles.th}>준비물</th>
              <th style={styles.th}>시간</th>
              <th style={styles.th}>상태</th>
            </tr>
          </thead>
          <tbody>
            {CLUBS.map((club) => {
              const e = roster[club.no] || blankEntry();
              return (
                <tr key={club.no} style={styles.tr}>
                  <td style={styles.tdNo}>{club.no}</td>
                  <td style={styles.tdDept}>{club.dept}</td>
                  <td style={styles.td}>{club.teacher}</td>
                  <td style={styles.td}>{club.grade}</td>
                  <td style={e.meetPlace ? styles.td : styles.tdEmpty}>{e.meetPlace || "—"}</td>
                  <td style={e.actPlace ? styles.tdStrong : styles.tdEmpty}>{e.actPlace || "—"}</td>
                  <td style={e.supplies ? styles.td : styles.tdEmpty}>{e.supplies || "—"}</td>
                  <td style={styles.td}>{e.meetTime}</td>
                  <td style={styles.td}>
                    {e.submitted ? (
                      <span style={styles.tagDone}>완료</span>
                    ) : (
                      <span style={styles.tagPending}>미제출</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={styles.tableFootnote}>가로로 스크롤하면 전체 항목을 볼 수 있어요.</p>
    </div>
  );
}

function RoleSwitcher({ role, setRole, attention }) {
  return (
    <div style={attention ? styles.roleSelectPulse : undefined}>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{
          ...styles.roleSelect,
          ...(attention ? styles.roleSelectAttentionInner : null),
        }}
      >
        <option value="select">본인 확인 →</option>
        <option value="admin">🛡 관리자 (이채현)</option>
        {CLUBS.map((c) => (
          <option key={c.no} value={c.teacher}>
            {c.teacher} 선생님
          </option>
        ))}
      </select>
    </div>
  );
}

function Stamp({ submitted }) {
  if (submitted) {
    return (
      <div style={styles.stampDone} aria-label="제출 완료">
        <span style={{ fontSize: 18, animation: "wiggle 1.6s ease-in-out infinite" }}>⭐</span>
        <span style={styles.stampText}>완료</span>
      </div>
    );
  }
  return <div style={styles.stampEmpty} aria-label="미제출">🫧</div>;
}

function EditPanel({ club, draft, setDraft, onSubmit, onSaveDraft, onCancel }) {
  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));
  return (
    <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
      <div style={styles.panelGrid}>
        <label style={styles.field}>
          <span style={styles.fieldLabel}>집합 장소</span>
          <input style={styles.input} value={draft.meetPlace} onChange={set("meetPlace")} placeholder="예: 기술실 앞" />
        </label>
        <label style={styles.field}>
          <span style={styles.fieldLabel}>활동 장소</span>
          <input style={styles.input} value={draft.actPlace} onChange={set("actPlace")} placeholder="예: 목공실" />
        </label>
        <label style={styles.field}>
          <span style={styles.fieldLabel}>집합 시간</span>
          <input style={styles.input} type="time" value={draft.meetTime} onChange={set("meetTime")} />
        </label>
        <label style={{ ...styles.field, gridColumn: "1 / -1" }}>
          <span style={styles.fieldLabel}>
            <Backpack size={12} style={{ marginRight: 4, verticalAlign: -2 }} />
            준비물
          </span>
          <input style={styles.input} value={draft.supplies} onChange={set("supplies")} placeholder="예: 없음 / 실내화" />
        </label>
      </div>
      <div style={styles.panelActions}>
        <button style={styles.ghostBtn} onClick={onCancel}>닫기</button>
        <button style={styles.secondaryBtn} onClick={onSaveDraft}>임시 저장</button>
        <button style={styles.primaryBtn} onClick={onSubmit}>
          <Check size={14} style={{ marginRight: 4 }} />
          제출 확정
        </button>
      </div>
    </div>
  );
}

const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Noto+Sans+KR:wght@400;500;600;700&display=swap');
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes floaty {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-14px) translateX(4px); }
}
@keyframes bubbleUp {
  0% { transform: translateY(0) scale(1); opacity: 0.55; }
  100% { transform: translateY(-620px) scale(1.15); opacity: 0; }
}
@keyframes wiggle {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}
@keyframes robotBob {
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-10px) rotate(3deg); }
}
@keyframes armSwingLeft {
  0%, 100% { transform: rotate(-25deg); }
  50% { transform: rotate(35deg); }
}
@keyframes armSwingRight {
  0%, 100% { transform: rotate(25deg); }
  50% { transform: rotate(-35deg); }
}
@keyframes legSwingLeft {
  0%, 100% { transform: rotate(15deg); }
  50% { transform: rotate(-15deg); }
}
@keyframes legSwingRight {
  0%, 100% { transform: rotate(-15deg); }
  50% { transform: rotate(15deg); }
}
@keyframes shadowPulse {
  0%, 100% { transform: scaleX(1); opacity: 0.35; }
  50% { transform: scaleX(0.7); opacity: 0.2; }
}
@keyframes popIn {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes attentionPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
`;

const BUBBLES = Array.from({ length: 14 }).map((_, i) => ({
  left: (i * 7.3) % 100,
  size: 8 + ((i * 13) % 26),
  delay: (i * 1.7) % 12,
  duration: 10 + ((i * 5) % 10),
}));

function BubbleField() {
  return (
    <div style={styles.bubbleField} aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${b.left}%`,
            bottom: -40,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.15))",
            border: "1px solid rgba(255,255,255,0.5)",
            animation: `bubbleUp ${b.duration}s ease-in infinite`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function IntroScreen({ onNext }) {
  return (
    <div style={styles.introWrap}>
      <DancingRobot />
      <h2 style={styles.introTitle}>동아리 활동 입력하러 오셨나요?</h2>
      <p style={styles.introSub}>장소랑 준비물만 콕콕 입력하면 끝!</p>
      <button style={styles.introBtn} onClick={onNext}>
        다음
      </button>
    </div>
  );
}

function DancingRobot() {
  return (
    <div style={styles.robotStage}>
      <svg viewBox="0 0 140 160" width="130" height="150" style={{ animation: "robotBob 0.9s ease-in-out infinite" }}>
        {/* antenna */}
        <line x1="70" y1="8" x2="70" y2="20" stroke="#5B7A8C" strokeWidth="4" strokeLinecap="round" />
        <circle cx="70" cy="6" r="5" fill="#FF7A45" />
        {/* head */}
        <rect x="42" y="18" width="56" height="42" rx="12" fill="#DCE7EC" stroke="#8FA9B6" strokeWidth="3" />
        <rect x="54" y="32" width="14" height="14" rx="3" fill="#0E86B0" />
        <rect x="74" y="32" width="14" height="14" rx="3" fill="#0E86B0" />
        <rect x="58" y="50" width="24" height="4" rx="2" fill="#5B7A8C" />
        {/* body */}
        <rect x="38" y="62" width="64" height="54" rx="14" fill="#F2F6F8" stroke="#8FA9B6" strokeWidth="3" />
        <circle cx="70" cy="89" r="12" fill="#FFE3D6" stroke="#FF7A45" strokeWidth="3" />
        <circle cx="70" cy="89" r="4" fill="#FF7A45" />
        {/* left arm — swings */}
        <g style={{ transformOrigin: "40px 68px", animation: "armSwingLeft 0.9s ease-in-out infinite" }}>
          <rect x="20" y="64" width="20" height="12" rx="6" fill="#DCE7EC" stroke="#8FA9B6" strokeWidth="3" />
        </g>
        {/* right arm — swings opposite */}
        <g style={{ transformOrigin: "100px 68px", animation: "armSwingRight 0.9s ease-in-out infinite" }}>
          <rect x="100" y="64" width="20" height="12" rx="6" fill="#DCE7EC" stroke="#8FA9B6" strokeWidth="3" />
        </g>
        {/* legs — alternate */}
        <g style={{ transformOrigin: "52px 116px", animation: "legSwingLeft 0.9s ease-in-out infinite" }}>
          <rect x="46" y="116" width="14" height="26" rx="6" fill="#DCE7EC" stroke="#8FA9B6" strokeWidth="3" />
        </g>
        <g style={{ transformOrigin: "88px 116px", animation: "legSwingRight 0.9s ease-in-out infinite" }}>
          <rect x="80" y="116" width="14" height="26" rx="6" fill="#DCE7EC" stroke="#8FA9B6" strokeWidth="3" />
        </g>
      </svg>
      <div style={styles.robotShadow} />
    </div>
  );
}

function SpongeMascot({ style }) {
  // Original friendly sponge character (not a licensed likeness)
  return (
    <svg viewBox="0 0 100 100" width="56" height="56" style={{ animation: "floaty 4.5s ease-in-out infinite", ...style }}>
      <rect x="10" y="16" width="80" height="68" rx="14" fill="#F4D93E" stroke="#C9A62A" strokeWidth="3" />
      <circle cx="24" cy="30" r="4" fill="#E8C93A" opacity="0.7" />
      <circle cx="46" cy="24" r="3" fill="#E8C93A" opacity="0.7" />
      <circle cx="68" cy="32" r="4.5" fill="#E8C93A" opacity="0.7" />
      <circle cx="78" cy="55" r="3.5" fill="#E8C93A" opacity="0.7" />
      <circle cx="20" cy="60" r="3" fill="#E8C93A" opacity="0.7" />
      <circle cx="55" cy="66" r="4" fill="#E8C93A" opacity="0.7" />
      <circle cx="36" cy="46" r="9" fill="#fff" />
      <circle cx="64" cy="46" r="9" fill="#fff" />
      <circle cx="38" cy="47" r="4" fill="#2A2A2A" />
      <circle cx="66" cy="47" r="4" fill="#2A2A2A" />
      <path d="M32 66 Q50 78 68 66" stroke="#2A2A2A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="26" cy="60" r="5" fill="#FF9EB0" opacity="0.6" />
      <circle cx="74" cy="60" r="5" fill="#FF9EB0" opacity="0.6" />
    </svg>
  );
}

const styles = {
  page: {
    "--bg-top": "#BDEBFA",
    "--bg-bottom": "#0E6BA8",
    "--surface": "rgba(255,255,255,0.92)",
    "--surface-alt": "#EAF7FB",
    "--ink": "#0B3654",
    "--ink-soft": "#2C5B78",
    "--ink-faint": "#7FA9C2",
    "--primary": "#0E86B0",
    "--primary-soft": "#DBF2FA",
    "--stamp": "#FF7A45",
    "--stamp-soft": "#FFE3D6",
    "--line": "#CFEBF5",
    background: "linear-gradient(180deg, var(--bg-top) 0%, #3FA6D6 45%, var(--bg-bottom) 100%)",
    minHeight: "100%",
    padding: "28px 16px 60px",
    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
    color: "var(--ink)",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  bubbleField: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
  shell: { maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 },
  introWrap: {
    position: "relative",
    zIndex: 1,
    minHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "20px 24px",
    animation: "popIn 0.5s ease",
  },
  robotStage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 8,
  },
  robotShadow: {
    width: 70,
    height: 12,
    borderRadius: "50%",
    background: "rgba(11,54,84,0.35)",
    marginTop: -6,
    animation: "shadowPulse 0.9s ease-in-out infinite",
  },
  introTitle: {
    margin: "10px 0 4px",
    fontFamily: "'Noto Sans KR', sans-serif",
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    textShadow: "0 1px 3px rgba(11,54,84,0.45)",
    maxWidth: 320,
  },
  introSub: {
    margin: "0 0 26px",
    fontSize: 14,
    fontWeight: 500,
    color: "rgba(255,255,255,0.9)",
  },
  introBtn: {
    border: "none",
    background: "#fff",
    color: "var(--primary)",
    fontSize: 15,
    fontWeight: 700,
    borderRadius: 999,
    padding: "12px 38px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(11,54,84,0.25)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  eyebrow: {
    margin: 0,
    fontSize: 12.5,
    letterSpacing: "0.04em",
    color: "#fff",
    fontWeight: 700,
    textShadow: "0 1px 3px rgba(11,54,84,0.4)",
  },
  title: {
    margin: "2px 0 0",
    fontFamily: "'Noto Sans KR', sans-serif",
    fontSize: 25,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.01em",
    textShadow: "0 1px 3px rgba(11,54,84,0.45)",
  },
  roleSelect: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    color: "var(--ink)",
    fontFamily: "inherit",
    boxShadow: "0 3px 10px rgba(11,54,84,0.15)",
  },
  roleSelectPulse: {
    animation: "attentionPulse 1.1s ease-in-out infinite",
    borderRadius: 999,
  },
  roleSelectAttentionInner: {
    border: "2px solid #FF7A45",
    boxShadow: "0 0 0 4px rgba(255,122,69,0.25), 0 6px 16px rgba(11,54,84,0.25)",
    fontWeight: 700,
  },
  controlCard: {
    background: "var(--surface)",
    borderRadius: 18,
    padding: "14px 16px",
    marginBottom: 14,
    boxShadow: "0 8px 22px rgba(11,54,84,0.15)",
  },
  monthBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid var(--line)",
    background: "var(--surface)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--primary)",
  },
  monthLabel: {
    fontFamily: "'Noto Serif KR', serif",
    fontWeight: 700,
    fontSize: 17,
  },
  carriedTag: {
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    fontSize: 11,
    color: "var(--primary)",
    background: "var(--primary-soft)",
    borderRadius: 999,
    padding: "4px 9px",
    fontWeight: 600,
  },
  progressWrap: { marginBottom: 18 },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    background: "var(--surface-alt)",
    border: "1px solid var(--line)",
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    background: "var(--primary)",
    borderRadius: 999,
    transition: "width 0.4s ease",
  },
  progressText: {
    fontSize: 12.5,
    color: "var(--ink-soft)",
    display: "flex",
    alignItems: "center",
  },
  hint: {
    fontSize: 12.5,
    color: "var(--ink-soft)",
    background: "var(--surface-alt)",
    border: "1px dashed var(--line)",
    borderRadius: 10,
    padding: "8px 12px",
    marginBottom: 14,
  },
  hintStrong: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13.5,
    lineHeight: 1.5,
    color: "#7A2E0E",
    background: "#FFE3D6",
    border: "2px solid #FF7A45",
    borderRadius: 12,
    padding: "10px 14px",
    boxShadow: "0 4px 12px rgba(255,122,69,0.3)",
  },
  hintIcon: {
    fontSize: 22,
    animation: "wiggle 1s ease-in-out infinite",
    flexShrink: 0,
  },
  exportBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    border: "none",
    background: "var(--primary)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    marginTop: 4,
  },
  viewTabs: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
  },
  viewTab: {
    flex: 1,
    border: "1px solid rgba(255,255,255,0.6)",
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 999,
    padding: "9px 10px",
    cursor: "pointer",
  },
  viewTabActive: {
    flex: 1,
    border: "1px solid #fff",
    background: "#fff",
    color: "var(--primary)",
    fontSize: 13,
    fontWeight: 800,
    borderRadius: 999,
    padding: "9px 10px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(11,54,84,0.2)",
  },
  tableCard: {
    background: "var(--surface)",
    borderRadius: 16,
    padding: 12,
    boxShadow: "0 8px 22px rgba(11,54,84,0.15)",
  },
  tableScroll: {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
    minWidth: 620,
  },
  th: {
    textAlign: "left",
    fontSize: 11.5,
    fontWeight: 700,
    color: "var(--ink-soft)",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    padding: "6px 8px",
    borderBottom: "2px solid var(--line)",
    position: "sticky",
    top: 0,
    background: "var(--surface)",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid var(--line)",
  },
  td: {
    fontSize: 13,
    color: "var(--ink)",
    padding: "8px",
    whiteSpace: "nowrap",
  },
  tdNo: {
    fontSize: 12,
    color: "var(--ink-faint)",
    padding: "8px",
    fontVariantNumeric: "tabular-nums",
  },
  tdDept: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--ink)",
    padding: "8px",
    whiteSpace: "nowrap",
  },
  tdStrong: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--primary)",
    padding: "8px",
    whiteSpace: "nowrap",
  },
  tdEmpty: {
    fontSize: 13,
    color: "var(--ink-faint)",
    padding: "8px",
    whiteSpace: "nowrap",
  },
  tagDone: {
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    background: "var(--stamp)",
    borderRadius: 999,
    padding: "3px 9px",
  },
  tagPending: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--ink-soft)",
    background: "var(--surface-alt)",
    border: "1px solid var(--line)",
    borderRadius: 999,
    padding: "3px 9px",
  },
  tableFootnote: {
    fontSize: 11,
    color: "var(--ink-faint)",
    margin: "8px 2px 0",
  },
  loadingBox: {
    padding: "40px 0",
    textAlign: "center",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
  },
  list: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 },
  row: {
    background: "var(--surface)",
    borderRadius: 16,
    boxShadow: "0 6px 18px rgba(11,54,84,0.12)",
    backdropFilter: "blur(2px)",
  },
  rowMain: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 12px",
  },
  rowNo: {
    fontFamily: "'Noto Serif KR', serif",
    fontSize: 13,
    color: "var(--ink-faint)",
    width: 20,
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTop: { display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  deptName: { fontWeight: 700, fontSize: 15.5, color: "var(--ink)" },
  gradeTag: { fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 500 },
  rowMeta: { display: "flex", gap: 14, marginTop: 4 },
  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12.5,
    color: "var(--ink-soft)",
    fontWeight: 500,
  },
  stampDone: {
    flexShrink: 0,
    width: 52,
    height: 52,
    borderRadius: "50%",
    border: "2.5px solid var(--stamp)",
    color: "var(--stamp)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transform: "rotate(-8deg)",
    background: "var(--stamp-soft)",
  },
  stampText: { fontSize: 9, fontWeight: 700, marginTop: 1, letterSpacing: "0.05em" },
  stampEmpty: {
    flexShrink: 0,
    width: 52,
    height: 52,
    borderRadius: "50%",
    border: "2px dashed var(--ink-faint)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    opacity: 0.7,
  },
  panel: {
    background: "var(--surface-alt)",
    borderRadius: 12,
    padding: 14,
    margin: "0 12px 14px",
    border: "1px solid var(--line)",
  },
  panelGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  fieldLabel: { fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 700 },
  input: {
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 14,
    fontFamily: "inherit",
    background: "var(--surface)",
    color: "var(--ink)",
    fontWeight: 500,
  },
  panelActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  ghostBtn: {
    border: "none",
    background: "none",
    color: "var(--ink-soft)",
    fontSize: 12.5,
    padding: "8px 10px",
    cursor: "pointer",
  },
  secondaryBtn: {
    border: "1px solid var(--line)",
    background: "var(--surface)",
    color: "var(--ink)",
    fontSize: 12.5,
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
  },
  primaryBtn: {
    border: "none",
    background: "var(--primary)",
    color: "#fff",
    fontSize: 12.5,
    fontWeight: 600,
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    background: "var(--ink)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 999,
    fontSize: 13,
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  },
};
