// ============================================================
//  設定・共通変数
// ============================================================
const MAIL_TO = 'ns.morizo@gmail.com';
let startTime = null;

const NAME_NG_WORDS = ['匿名', '無記名', 'anonymous', 'anon', '名無し', 'なし', 'ない', 'none', 'no name'];

const FORM_UI_IDS = ['stepper', 'progressWrap', 'navigator', 'ideaForm'];

function hideFormUI() {
  FORM_UI_IDS.forEach(id => { document.getElementById(id).style.display = 'none'; });
}
function showFormUI() {
  FORM_UI_IDS.forEach(id => { document.getElementById(id).style.display = ''; });
}

// ============================================================
//  ステップナビゲーション
// ============================================================
let currentStep = 0;
const TOTAL_STEPS = 5;

const NAV_MESSAGES = [
  'こんにちは！現場のアイデアやお困りごとを教えてください。<br>まず、<strong>あなたの基本情報</strong>から始めましょう。気軽に入力してください😊',
  'ありがとうございます！✨<br>次は<strong>現場で困っていること</strong>を教えてください。「誰が」「どんな頻度で」困っているかを、思いつくまま教えてもらえると助かります。',
  'よく伝わってきます！👍<br>次は<strong>今どのように対応しているか</strong>を教えてください。「とりあえずこうしている」という工夫も、立派な情報です。',
  'ここからが一番の見どころです！💡<br><strong>あなたが思い描くアイデア</strong>を聞かせてください。どんな小さなひらめきでも大歓迎。完成していなくて大丈夫です！',
  'アイデア、ありがとうございます！🎉<br>最後に<strong>どんな効果が期待できそうか</strong>を教えてください。数値で書けるとより伝わりやすいですが、感覚的な表現でも問題ありません。'
];

function showStep(step) {
  document.querySelectorAll('.block').forEach((b, i) => {
    b.classList.toggle('active', i === step);
  });
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const sc = document.getElementById(`sc${i}`);
    const sl = document.getElementById(`sl${i}`);
    sc.className = 'step-circle';
    sl.className = 'step-label';
    if (i < step) {
      sc.classList.add('done');
      sc.innerHTML = '<span class="check-anim">✓</span>';
    } else if (i === step) {
      sc.classList.add('active');
      sc.textContent = i + 1;
      sl.classList.add('active');
    } else {
      sc.textContent = i + 1;
    }
    if (i < TOTAL_STEPS - 1) {
      document.getElementById(`line${i}`).className = 'step-line' + (i < step ? ' done' : '');
    }
  }
  document.getElementById('navBubble').innerHTML = NAV_MESSAGES[step];
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentStep = step;
}

// ============================================================
//  入力値取得ヘルパー
// ============================================================
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function getRadio(nm) {
  const el = document.querySelector(`input[name="${nm}"]:checked`);
  return el ? el.value : '';
}
function getChecks(nm) {
  return Array.from(document.querySelectorAll(`input[name="${nm}"]:checked`)).map(e => e.value);
}

// Q6 / Q12 の「その他」展開
function getQ6Values() {
  return getChecks('q6').map(v => {
    if (v === 'その他') {
      const other = getVal('q6-other-text');
      return other ? `その他（${other}）` : 'その他';
    }
    return v;
  });
}
function getQ12Values() {
  return getChecks('q12').map(v => {
    if (v === 'その他') {
      const other = getVal('q12-other-text');
      return other ? `その他（${other}）` : 'その他';
    }
    return v;
  });
}

// ============================================================
//  バリデーション
// ============================================================
function isNGName(val) {
  return NAME_NG_WORDS.some(w => val.toLowerCase() === w.toLowerCase());
}

const STEP_REQUIRED = [
  // step0 基本情報
  () => {
    const errs = [];
    if (!getVal('q1')) errs.push('Q1 所属部署');
    const nameVal = getVal('q2');
    if (!nameVal) {
      errs.push('Q2 氏名');
    } else if (isNGName(nameVal)) {
      errs.push('Q2 氏名（匿名での受付はできません。お名前をご記入ください）');
    }
    const emailVal = getVal('q2b');
    if (!emailVal) {
      errs.push('Q2-b 返信用メールアドレス');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      errs.push('Q2-b メールアドレスの形式が正しくありません');
    }
    if (!getRadio('q3')) errs.push('Q3 職種');
    return errs;
  },
  // step1 困りごと
  () => {
    const errs = [];
    if (!getRadio('q4'))              errs.push('Q4 困っている対象');
    if (!getRadio('q5'))              errs.push('Q5 発生頻度');
    if (getChecks('q6').length === 0) errs.push('Q6 困りごと・影響');
    // Q7 は任意（自由記述）なので必須チェックはしない
    return errs;
  },
  // step2 今の対応（必須なし）
  () => [],
  // step3 アイデア
  () => {
    const errs = [];
    if (!getVal('q10'))   errs.push('Q10 アイデア');
    if (!getRadio('q11')) errs.push('Q11 カテゴリー');
    return errs;
  },
  // step4 期待される効果
  () => {
    const errs = [];
    if (getChecks('q12').length === 0) errs.push('Q12 期待できる効果');
    return errs;
  }
];

function goNext(step) {
  const errs = STEP_REQUIRED[step]();
  if (errs.length > 0) {
    alert('⚠️ 以下の必須項目を確認してください：\n\n' + errs.join('\n'));
    return;
  }
  sendLog('step_moved', step + 2);
  showStep(step + 1);
}
function goPrev(step) {
  showStep(step - 1);
}

// ============================================================
//  フィードバック表示
// ============================================================
function showFeedback(id, msg, type) {
  const el = document.getElementById(`fb-${id}`);
  if (!el) return;
  el.textContent = msg;
  el.className = `feedback-box feedback-${type} show`;
}
function hideFeedback(id) {
  const el = document.getElementById(`fb-${id}`);
  if (el) {
    el.className = 'feedback-box';
    el.textContent = '';
  }
}
function highlightSelected(groupId) {
  document.querySelectorAll(`#${groupId} label`).forEach(lbl => {
    lbl.classList.toggle('selected', lbl.querySelector('input').checked);
  });
}
function highlightChecked(groupId) {
  document.querySelectorAll(`#${groupId} label`).forEach(lbl => {
    lbl.classList.toggle('selected', lbl.querySelector('input').checked);
  });
}
function toggleOtherInput(checkId, wrapId) {
  const checked = document.getElementById(checkId).checked;
  const wrap = document.getElementById(wrapId);
  wrap.classList.toggle('show', checked);
  if (!checked) {
    const ta = wrap.querySelector('textarea');
    if (ta) ta.value = '';
  }
}

// ============================================================
//  入力イベント
// ============================================================
function onSelectChange(id) {
  const v = getVal(id);
  if (v) showFeedback(id, v, 'good');
  else   hideFeedback(id);
}
function onTextInput(id) {
  const v = getVal(id);
  if (!v) { hideFeedback(id); return; }
  if (id === 'q2' && isNGName(v)) {
    showFeedback(id, '匿名では受付できません。お名前をご記入ください。', 'neutral');
    return;
  }
  if (v.length < 2) {
    showFeedback(id, 'もう少し具体的にお願いできますか？', 'neutral');
    return;
  }
  showFeedback(id, v, 'good');
}
function onEmailInput(id) {
  const v = getVal(id);
  if (!v) { hideFeedback(id); return; }
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if (isEmail) showFeedback(id, v, 'good');
  else         showFeedback(id, 'yamada.taro@example.com のような形式で入力してください', 'neutral');
}
function onRadioChange(groupId) {
  highlightSelected(groupId);
  updateProgress();
  const v = getRadio(groupId);
  if (v) showFeedback(groupId, v, 'good');
}
function onCheckChange(groupId) {
  highlightChecked(groupId);
  updateProgress();
  const vals = getChecks(groupId);
  if (vals.length > 0) showFeedback(groupId, `${vals.length}件選択中`, 'good');
  else                 hideFeedback(groupId);
}
function onTextareaInput(id) {
  updateProgress();
  const v = getVal(id);
  if (v.length >= 10) showFeedback(id, '十分なボリュームで書かれています。ありがとうございます！', 'tip');
  else                hideFeedback(id);
}
function onIdeaInput() {
  updateProgress();
  const v = getVal('q10');
  if (v.length >= 20)      showFeedback('q10', 'とても具体的でイメージしやすい内容です！', 'tip');
  else if (v.length >= 5)  showFeedback('q10', '短くても大丈夫です。思いつく範囲でご記入ください。', 'neutral');
  else                     hideFeedback('q10');
}

// ============================================================
//  プログレスバー（14項目）
// ============================================================
function updateProgress() {
  if (!startTime) startTime = new Date();
  const items = [
    getVal('q1'), getVal('q2'), getVal('q2b'),
    getRadio('q3'), getRadio('q4'),
    getRadio('q5'), getChecks('q6').length > 0 ? '1' : '',
    getVal('q7'),
    getVal('q8'), getChecks('q9').length > 0 ? '1' : '',
    getVal('q10'), getRadio('q11'),
    getChecks('q12').length > 0 ? '1' : '', getVal('q13')
  ];
  const filled = items.filter(v => v !== '').length;
  const total  = 14;
  document.getElementById('progress-label').textContent = `${filled} / ${total} 項目入力済み`;
  document.getElementById('progressFill').style.width = `${Math.round(filled / total * 100)}%`;
}
document.addEventListener('change', updateProgress);
document.addEventListener('input',  updateProgress);

// ============================================================
//  人が読むテキスト（メール本文）
// ============================================================
function buildText() {
  const q6v  = getQ6Values();
  const q9v  = getChecks('q9');
  const q12v = getQ12Values();

  const endTime = new Date();
  const diffMs  = startTime ? endTime - startTime : 0;
  const mins    = Math.floor(diffMs / 60000);
  const secs    = Math.floor((diffMs % 60000) / 1000);
  const elapsed = startTime ? `${mins}分${secs}秒` : '';

  const lines = [
    '=== MIT: 医療をよくするアイデア＆お困りごと 提案内容 ===',
    '',
    `お名前: ${getVal('q2')}`,
    `所属部署: ${getVal('q1')}`,
    `メールアドレス: ${getVal('q2b')}`,
    `職種: ${getRadio('q3')}`,
    '',
    '--- P（対象と状況） ---',
    `困っている対象: ${getRadio('q4')}`,
    `発生頻度: ${getRadio('q5')}`,
    `困りごと・影響: ${q6v.join(' / ')}`,
    `主なシーン・タイミング: ${getVal('q7')}`,
    '',
    '--- C（現在の対応・比較） ---',
    `現在の対応・工夫: ${getVal('q8')}`,
    `現状の限界・課題: ${q9v.length ? q9v.join(' / ') : ''}`,
    '',
    '--- I（アイデアの内容） ---',
    `アイデアの概要: ${getVal('q10')}`,
    `想定されるカテゴリー: ${getRadio('q11')}`,
    '',
    '--- O（期待される効果） ---',
    `期待できる効果: ${q12v.join(' / ')}`,
    `どのくらい良くなりそうか: ${getVal('q13')}`,
    '',
    `送信日時: ${endTime.toLocaleString('ja-JP')}`,
    `入力にかかった時間: ${elapsed}`,
    ''
  ];

  const sq1v = getSurveyRadio('sq1');
  if (sq1v !== '（未回答）') {
    lines.push(
      '',
      '--- 利用後アンケート ---',
      `SQ0 ITレベル: ${getItLevelLabel() || '（判定不可）'}`,
      `SQ1 使いやすさ全体評価: ${getSurveyRadio('sq1')}`,
      `SQ2 構造化への役立ち度: ${getSurveyRadio('sq2')}`,
      `SQ3 特に役立った点: ${getSurveyChecks('sq3')}`,
      `SQ4 入力の負担感: ${getSurveyRadio('sq4')}`,
      `SQ5 もう一度使いたいと思うか: ${getSurveyRadio('sq5')}`,
      `SQ6 自分のPICO作成への自信: ${getSurveyRadio('sq6_scale')}`,
      `SQ6 自由記述: ${getVal('sq6')}`,
      '',
      '--- SUS（System Usability Scale） ---'
    );
    for (let i = 1; i <= 10; i++) {
      lines.push(`SUS${i}: ${getSurveyRadio('sus' + i)}`);
    }
    const susScore = calculateSusScore();
    lines.push(`SUSスコア: ${getSusLabel(susScore)}`);
  }

  return lines.join('\n');
}

// ============================================================
//  CSVテキスト
// ============================================================
function escapeCSV(v) {
  if (v == null) v = '';
  v = String(v);
  if (v.includes('"') || v.includes(',') || v.includes('\n') || v.includes('\r')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

function buildCsvText() {
  const now          = new Date();
  const submissionId = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 15);
  const submittedAt  = now.toLocaleString('ja-JP');

  const q6v  = getQ6Values();
  const q9v  = getChecks('q9');
  const q12v = getQ12Values();

  const diffMs = startTime ? now - startTime : 0;
  const mins   = Math.floor(diffMs / 60000);
  const secs   = Math.floor((diffMs % 60000) / 1000);
  const elapsed = startTime ? `${mins}分${secs}秒` : '';

  const rows = [
    ['submission_id','submitted_at','field_name','value'].map(escapeCSV).join(',')
  ];

  function addRow(fieldName, value) {
    rows.push([
      escapeCSV(submissionId),
      escapeCSV(submittedAt),
      escapeCSV(fieldName),
      escapeCSV(value)
    ].join(','));
  }

  addRow('q1_department', getVal('q1'));
  addRow('q2_name',       getVal('q2'));
  addRow('q2b_email',     getVal('q2b'));
  addRow('q3_occupation', getRadio('q3'));

  addRow('q4_who_suffers',  getRadio('q4'));
  addRow('q5_frequency',    getRadio('q5'));

  if (q6v.length > 0) {
    q6v.forEach((v, idx) => addRow(`q6_problem_${idx+1}`, v));
  } else {
    addRow('q6_problem_1', '');
  }

  addRow('q7_scene', getVal('q7'));

  addRow('q8_current_workaround', getVal('q8'));

  if (q9v.length > 0) {
    q9v.forEach((v, idx) => addRow(`q9_limitation_${idx+1}`, v));
  } else {
    addRow('q9_limitation_1', '');
  }

  addRow('q10_idea',     getVal('q10'));
  addRow('q11_category', getRadio('q11'));

  if (q12v.length > 0) {
    q12v.forEach((v, idx) => addRow(`q12_outcome_${idx+1}`, v));
  } else {
    addRow('q12_outcome_1', '');
  }

  addRow('q13_expected_improvement', getVal('q13'));
  addRow('report_creation_time',     elapsed);

  // アンケート
  addRow('sq1_usability',     getSurveyRadio('sq1'));
  addRow('sq2_structuring',   getSurveyRadio('sq2'));
  addRow('sq3_helpful',       getSurveyChecks('sq3'));
  addRow('sq4_effort',        getSurveyRadio('sq4'));
  addRow('sq5_motivation',    getSurveyRadio('sq5'));
  addRow('sq6_self_efficacy', getSurveyRadio('sq6_scale'));
  addRow('sq6_improvement',   getVal('sq6'));

  for (let i = 1; i <= 10; i++) {
    addRow(`sus${i}`, getSurveyRadio('sus' + i));
  }
  const susScore = calculateSusScore();
  addRow('sus_score', susScore != null ? susScore : '');

  return rows.join('\n');
}

// ============================================================
//  メール送信
// ============================================================
function sendMail() {
  const humanText = buildText();
  const csvText   = buildCsvText();
  const fullBody  = humanText + '\n--- CSV ---\n' + csvText;

  const subject = encodeURIComponent(`${getVal('q2')}さんのアイデア（${getVal('q1')}）`);
  const body    = encodeURIComponent(fullBody);

  formCompleted = true;
  window.location.href = `mailto:${MAIL_TO}?subject=${subject}&body=${body}`;
}

// ============================================================
//  プレビュー
// ============================================================
function showPreview() {
  const errs = STEP_REQUIRED[4]();
  if (errs.length > 0) {
    alert('⚠️ 以下の必須項目を確認してください：\n\n' + errs.join('\n'));
    return;
  }
  document.getElementById('previewText').textContent = buildText();

  const idea     = getVal('q10');
  const who      = getRadio('q4');
  const freq     = getRadio('q5');
  const category = getRadio('q11');
  const outcomes = getQ12Values();

  if (idea && who && category && outcomes.length > 0) {
    const picoText =
      `<b>P</b>: ${who}（頻度: ${freq}）<br>` +
      `<b>Scene</b>: ${getVal('q7')}<br>` +
      `<b>I</b>: ${idea.slice(0,120)}${idea.length>120?'...':''}<br>` +
      `<b>C</b>: ${getVal('q8') || '（明確な比較対象なし）'}<br>` +
      `<b>O</b>: ${outcomes.join(' / ')}`;

    document.getElementById('picoContent').innerHTML = picoText;
    document.getElementById('picoBox').style.display = 'block';
  } else {
    document.getElementById('picoBox').style.display = 'none';
  }

  document.getElementById('previewModal').classList.add('active');
}

function closePreviewModal() {
  document.getElementById('previewModal').classList.remove('active');
}

function closePreviewAndThank() {
  closePreviewModal();
  showThankModal();
}

// ============================================================
//  新規アイデア・リセット
// ============================================================
function startNewIdea() {
  closeThankModal();
  resetForm();
}

function resetForm() {
  document.getElementById('ideaForm').reset();
  document.querySelectorAll('.feedback-box').forEach(el => {
    el.className = 'feedback-box';
    el.textContent = '';
  });
  document.querySelectorAll('.radio-group label, .check-group label').forEach(lbl => {
    lbl.classList.remove('selected');
  });
  document.querySelectorAll('.other-input-wrap').forEach(w => {
    w.classList.remove('show');
    const ta = w.querySelector('textarea');
    if (ta) ta.value = '';
  });
  ['sq1','sq2','sq4','sq5','sq6_scale'].forEach(n =>
    document.querySelectorAll(`input[name="${n}"]`).forEach(r => r.checked = false)
  );
  document.querySelectorAll('input[name="sq3"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="sq0_it"]').forEach(r => r.checked = false);
  for (let i = 1; i <= 10; i++) {
    document.querySelectorAll(`input[name="sus${i}"]`).forEach(r => r.checked = false);
  }
  const sq6el = document.getElementById('sq6');
  if (sq6el) sq6el.value = '';
  document.querySelectorAll('#surveyModal .radio-group label, #surveyModal .check-group label')
    .forEach(l => l.classList.remove('selected'));
  startTime = null;
  showFormUI();
  document.getElementById('endScreen').classList.remove('active');
  showStep(0);
  updateProgress();
}

// ============================================================
//  終了画面
// ============================================================
function showEndScreen() {
  if (!formCompleted) sendLog('abandoned_end_btn', currentStep + 1);
  hideFormUI();
  document.getElementById('endScreen').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function restartFromEnd() {
  document.getElementById('endScreen').classList.remove('active');
  resetForm();
}

// ============================================================
//  GAS トラッキング
// ============================================================
const GAS_URL = 'https://script.google.com/macros/s/AKfycbx5Cf97A3SUGcfb8F3l87unhhSgjoo7TGZ1ozyRdk2JFGlxmJF9SxQN06QtjtJbJ5RV/exec';

const _urlParams  = new URLSearchParams(window.location.search);
const SESSION_ID  = _urlParams.get('sid') || 'direct_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
const FORM_TYPE   = _urlParams.get('ft')  || 'A';

let formCompleted = false;

function sendLog(status, step) {
  const payload = {
    timestamp:  new Date().toISOString(),
    form_type:  FORM_TYPE,
    last_step:  step,
    status:     status,
    session_id: SESSION_ID
  };
  fetch(GAS_URL, {
    method:    'POST',
    body:      JSON.stringify(payload),
    keepalive: true
  }).catch(function() {});
}

sendLog('form_opened', 1);

document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden' && !formCompleted) {
    sendLog('abandoned', currentStep + 1);
  }
});

// ============================================================
//  SUS スコア計算
// ============================================================
function getSusRadio(nm) {
  const el = document.querySelector(`input[name="${nm}"]:checked`);
  return el ? parseInt(el.value, 10) : null;
}
function calculateSusScore() {
  const scores = [];
  for (let i = 1; i <= 10; i++) {
    const v = getSusRadio('sus' + i);
    if (v === null) return null;
    scores.push(v);
  }
  let total = 0;
  for (let i = 0; i < 10; i++) {
    total += (i % 2 === 0) ? scores[i] - 1 : 5 - scores[i];
  }
  return total * 2.5;
}
function getSusLabel(score) {
  if (score === null) return '（未回答）';
  if (score >= 85) return `${score}点（A：卓越した使いやすさ）`;
  if (score >= 80) return `${score}点（B：優れた使いやすさ）`;
  if (score >= 68) return `${score}点（C：平均的・合格水準）`;
  if (score >= 51) return `${score}点（D：改善が必要）`;
  return `${score}点（F：使いにくい）`;
}

// ============================================================
//  アンケート用ヘルパー
// ============================================================
function getSurveyRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '（未回答）';
}
function getSurveyChecks(name) {
  const els = document.querySelectorAll(`input[name="${name}"]:checked`);
  return els.length > 0 ? Array.from(els).map(e => e.value).join(' / ') : '（未選択）';
}

function getItExperienceChecks() {
  return Array.from(document.querySelectorAll('input[name="sq0_it"]:checked'))
    .map(e => e.value);
}

function getItLevelLabel() {
  const vals = getItExperienceChecks();
  if (vals.length === 0) return null;

  const hasMail   = vals.some(v => v.includes('メール・インターネット'));
  const hasEmr    = vals.some(v => v.includes('電子カルテ'));
  const hasApp    = vals.some(v => v.includes('スマートフォンアプリ'));
  const hasExcel  = vals.some(v => v.includes('表計算ソフト'));
  const hasProg   = vals.some(v => v.includes('プログラムやスクリプト'));

  if (hasProg) return '上級';
  if (hasExcel || hasApp || hasEmr) return '中級';
  if (hasMail && vals.length === 1) return '初級';
  if (hasMail && vals.length >= 2)  return '中級';
  return '中級';
}

function showSurveyFromPreview() {
  closePreviewModal();
  sendLog('completed', 5);
  formCompleted = true;
  document.getElementById('surveyModal').classList.add('active');
}

// ============================================================
//  サンクスモーダル・カウントダウン
// ============================================================
function showThankModal() {
  const name  = getVal('q2');
  const email = getVal('q2b');
  document.getElementById('thank-name-label').textContent  = name;
  document.getElementById('thank-reply-email').textContent = email;
  document.getElementById('thankModal').classList.add('active');
}

function closeThankModal() {
  document.getElementById('thankModal').classList.remove('active');
}

function startCloseCountdown(seconds) {
  let remaining = seconds;
  const countdownEl = document.getElementById('close-countdown');
  if (countdownEl) countdownEl.textContent = remaining;
  const timer = setInterval(() => {
    remaining--;
    if (countdownEl) countdownEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(timer);
      window.close();
      setTimeout(() => {
        const thankModal = document.getElementById('thankModal');
        if (thankModal && thankModal.classList.contains('active')) {
          thankModal.classList.remove('active');
          closeThankModal();
          showEndScreen();
        }
      }, 300);
    }
  }, 1000);
}

function submitAll() {
  const missing = [];
  ['sq1','sq2','sq4','sq5','sq6_scale'].forEach(name => {
    if (!document.querySelector(`input[name="${name}"]:checked`)) {
      missing.push(name === 'sq6_scale' ? 'SQ6' : name.toUpperCase());
    }
  });
  if (document.querySelectorAll('input[name="sq3"]:checked').length === 0) {
    missing.push('SQ3');
  }
  if (missing.length > 0) {
    alert('⚠️ 以下のアンケート項目に未回答があります：\n\n' + missing.join(', '));
    return;
  }

  document.getElementById('surveyModal').classList.remove('active');
  sendMail();
  showThankModal();
  startCloseCountdown(30);
}
