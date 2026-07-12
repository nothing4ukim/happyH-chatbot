---
name: hospital-questionnaire
description: Build a branded pre-visit medical questionnaire (사전문진) web page for a hospital or clinic from the proven 행복한H병원 template — a single static HTML file with consent gate, touch body-map, clinic-specific question branches, dual short/full questionnaire modes with anytime conversion, summary/EMR copy, and Google Sheets collection. Use when creating a questionnaire for a new hospital, rebranding this one, adding/changing clinic branches, or adding an abbreviated (간편) flow.
---

# 병원 사전문진 웹페이지 스킬 (행복한H병원 검증본 기반)

이 저장소 루트의 `index.html` 이 실제 환자 대상으로 운영 검증된 완성본이며,
이 스킬의 기준 템플릿이다(별도 사본 없음 — 항상 최신 운영본을 참조).
새 병원 적용 = **그 파일을 새 저장소에 복사한 뒤 아래 커스터마이징 지점만 교체**한다.
엔진(스텝 렌더러·저장·요약·전송)은 손대지 않는 것이 원칙이다.

## 아키텍처 원칙 (변경 금지)

- **단일 정적 HTML 1파일.** 외부 CDN·폰트·라이브러리 0. 서버 0.
  → GitHub Pages 등 정적 호스팅에서 동시 접속 사실상 무제한.
- 이미지도 같은 저장소(같은 폴더)에서만 로드. 모든 이미지에 onerror 폴백
  (없으면 그 자리 자동 숨김) — 이미지가 없어도 페이지는 절대 깨지지 않는다.
- 진행 내용은 localStorage 자동 저장(이어쓰기 지원).
  **완료 시에만** Apps Script(SHEET_URL)로 전송. 전송 실패해도 환자 화면은 정상.
- 동의 화면이 최초 관문(체크 전 시작 버튼 비활성). 동의 없이는 문진 불가.

## 새 병원 적용 절차 (Quick start)

1. 이 저장소 루트의 `index.html` 을 새 저장소의 `index.html` 로 복사.
2. 아래 "커스터마이징 지점" A~F를 순서대로 교체.
3. Playwright 헤드리스로 3개(또는 커스텀) 분기 완주 테스트 (아래 "검증" 참고).
4. GitHub 저장소 → Settings → Pages → main / root 로 배포.
5. 구글시트 + `template/apps-script.gs` 배포(웹앱, 액세스=모든 사용자) → /exec URL을 SHEET_URL에.
6. 시크릿 창에서 문진 1회 완주 → 시트 "문진" 탭에 행 추가 확인.

## 커스터마이징 지점

### A. BRAND 객체 (파일 상단 `const BRAND`)
로고/원장사진/캐릭터 파일명, 원장 성함·직함·경력 문구, 슬로건, 대표번호,
신뢰 링크(press/youtube/broadcast/home)와 기사 제목. 전 화면이 이 객체만 참조한다.
- 슬로건 예: "정밀한 진단, 다정한 치료" — 긍정형·대구형 권장. 부정형("~하지 않는") 금지.
- 완료 화면 신뢰 링크는 **제3자 매체(신문·방송) 먼저**, 그 다음 유튜브·홈페이지·전화 순.

### B. 브랜드 컬러 (CSS 전역 치환)
행복한H = 이화그린 계열. 다른 병원은 아래 토큰을 병원색으로 일괄 치환(sed 권장):
`#215D4C`(메인) `#163F31`(진한) `#E9F1EC`(연한 배경) `#7FAE9C`(호버)
`#17453A`(버튼진한) `#0D2C24`(버튼호버) `#4F8F76`(보조) `#EDF4F0` `#CFE2D8`(점수카드)
+ `<meta name="theme-color">` 도 함께.

### C. 이미지 파일 (`const IMG` + BRAND 이미지)
| 용도 | 기본 파일명 |
|---|---|
| 로고 / 원장 실물 / 안내 캐릭터 | logo.* / doctor.* / character.* |
| 인체도 남/여 (앞·뒤 나란히 한 장) | body_m.* / body_f.* |
| VAS 통증척도 그림 / 깊이 단면도 | 그림1.png / 그림2.png |

**중요:** 파일명은 실제 업로드된 이름에 코드를 맞춘다(반대가 아니라).
비개발자 고객은 `body_m.jpg.png` 같은 이중 확장자로 올리기 일쑤 — 그대로 동작하니
rename 시키지 말고 IMG/BRAND 문자열을 고쳐라. 한글 파일명도 정상 동작.

### D. 문진 분기 (`BRANCHES` + 각 flow 배열)
행복한H = 통증(PAIN) / 자율신경실조증(AUTO: COMPASS-31 + BFI) / 암재활(CANCER).
새 병원은 클리닉 특성대로 분기 배열을 만들고 BRANCHES에 등록만 하면 된다.
공통 꼬리(과거력·생활 / 치료선호 / 회복목표)는 빌더 재사용:
`...commonHistory(records목록, 아이콘목록[, 첫섹션명]), ...txPrefSteps(), ...goalSteps(placeholder)`

**사용 가능한 스텝 type** (렌더러 구현 완료, 그대로 조합):
`single`(버튼, tiles/cols:2/chIcons/fu 후속질문) · `multi`(체크, chIcons/other 기타입력/optional/skipLabel)
· `text`(자유입력, short/optional/skipLabel) · `vas`/`vas2`(0-10 슬라이더 1/2개, vas는 `subKey`로 저장 하위키 지정 가능) · `sliders`(BFI형 다중)
· `scale03`(0~3 빈도, COMPASS형) · `date3`(연/월/일 선택) · `onset2`(대략 N전/정확 날짜 토글)
· `freqmulti`(기간별 횟수+항상) · `posture`(앉기🪑/서기🧍/운전🚗 시간+기타) · `meds`(약 이름+기간+종류)
· `wordchips`(자유입력+단어칩 다중선택) · `bodymap`(인체도 터치 마킹) · `freetalk`(마무리)

**간편(축약) 문진 전용 복합 type** (여러 원본 질문을 한 화면에 병합 — 아래 D-2 참고):
`onsettrauma`(발병시점 onset2 + 외상 single, `traumaKey`/`traumaAsk`)
· `redflag`(체크리스트형 — items:[{label,key,onVal,offVal}], 체크=onVal 저장, 미체크=offVal 저장,
  **offVal 없는 항목은 미체크 시 미답변으로 남겨** 정식판 전환 때 상세 재질문됨)
· `twotext`(자유입력 2개 — fields:[{key,label,ph,optional}])
· `comorbidmeds`(동반질환 multi + 복용약 text + 알레르기 text → comorbid/meds/allergy 3개 key에 저장)
· `txstatuslast`(치료상황 multi + 마지막치료 single → tx_status/last_tx)
· `multivas`(슬라이더 여러 개가 **서로 다른 top-level key의 하위키**에 저장 — fields:[{label,key,subKey}])

스텝 공통 옵션: `sec`(섹션 제목) `img`/`imgFn`(질문 위 그림, 클릭 확대) `imgCap` `note`
`detail`(자세히보기 그림) `widget:"coinpalm"`(동전·손바닥 비교, 파일 불필요)
`fu:{...}, fuIf:"트리거문구"`(조건부 후속질문).

### D-2. 간편(축약) 문진 모드 — 이중 버전 구조

고령·중증 통증 환자용. 분기당 전체 ~35문항 → 기본정보 4 + 분기별 9~11문항으로 축약.
같은 index.html 한 파일이 두 버전을 모두 담는다(별도 페이지 없음).

**구조:**
- `BRANCHES[b] = {label, flow: FULL배열, shortFlow: SHORT배열}` — 분기마다 두 배열 등록.
- 분기 선택 후 `renderModeSelect()` 가 "간편 ⏱️ / 자세한 📋" 선택 화면을 보여줌.
  상단 배너 문구(법·심리 모두 중요): *"간편 문진입니다. 자세한 문진을 하시면 진단의
  정확도가 더 높아집니다. 중간에 언제든 자세한 문진으로 전환할 수 있습니다."*
- `startMode(short)` → `buildSteps(branch, short)` → `shortMode` 전역에 기록,
  localStorage 저장에도 포함(이어쓰기 시 모드 유지).

**핵심 설계 원칙 — key 재사용에 의한 자동 건너뛰기:**
- 축약 스텝은 **의미가 같으면 정식판과 같은 answers key에 저장**한다
  (pain_area·vas·onset·trauma·night·radiation·quality·aggravate·relieve·past_tx·
  comorbid·meds·allergy·surgery·goal·tx_status·last_tx·bfi_level·pain_vas 등).
- "자세한 문진으로 전환" = `convertToFull()`: 정식판 전체 스텝에서
  `hasAnswer(key)` 인 것만 걸러낸 나머지를 이어서 진행. 별도 매핑 테이블 불필요.
- **의도적 예외(새 key 사용)**: 축약판이 정식판보다 정보가 얕은 항목은 새 key를 써서
  전환 시 상세 재질문되게 한다. 행복한H 예: `core_sx`(핵심증상 9개),
  `compass_short`(COMPASS 대표 6문항) — 정식판의 sx_* 4문항·COMPASS-31 6도메인과 별개.
- **모호하면 저장하지 않는다**: redflag에서 "가만히 있어도 아프다" 미체크는
  '움직일 때만 아픈지' '둘 다인지' 알 수 없으므로 rest_pain을 비워 두고 전환 시 재질문.

**전환 진입점 2곳(둘 다 필수):**
1. 문진 진행 중 매 화면 하단 `.switch-full` 링크("🔎 자세한 문진으로 전환하기").
2. 완료(요약) 화면의 버튼("🔎 진단 정확도를 더 높이려면 자세히 답변하기").

**요약/전송 처리:** 축약 전용 key(core_sx·compass_short 등)는 summary·plainSummary에
표시 블록을 추가해야 한다(generic fmt()는 scale03형 객체를 못 그린다 — items 배열과
함께 전용 렌더 필요). 같은 key를 쓰는 항목들은 기존 요약 코드가 그대로 처리한다.

### E. 동의 화면 (`renderConsent`)
병원명·연락처는 BRAND에서 자동. 수집항목/목적/보유/제3자미제공/전송시점/거부권 표.
**인트로 하단 문구는 실제 전송 여부와 일치해야 한다**(법적) — 전송한다면
"완료 시에만 병원 서버로 전송" 유지, 수집 안 하면 "외부로 전송되지 않습니다"로.
실배포 전 병원 개인정보 담당 검토 권고(민감정보/구글시트 위탁).

### F. 데이터 수집 (`const SHEET_URL`)
비우면 로컬 전용. `template/apps-script.gs` 를 병원 계정 구글시트에 배포하고
/exec URL을 넣는다. payload: {consent, consentTime, submittedAt, branch,
branchLabel, name, answers(원본), summary(요약텍스트)}.
Apps Script 한도(동시 ~30)는 사전문진 규모에 충분. 대량이면 별도 백엔드.

## 검증된 UX 규칙 (새 분기 설계 시에도 지킬 것)

- **인체도 마킹이 있으면 좌/우 질문 넣지 않는다**(중복).
  마킹 안내: "가장 아프거나 빨리 낫고 싶은 곳부터 순서대로"(번호=우선순위).
- **요약의 인체도는 canvas로 사진+번호를 합성**해야 EMR 복사/저장에 번호가 따라간다.
  (HTML 오버레이 점은 이미지 복사 시 유실 — 이미 구현됨, 건드리지 말 것.)
- **빈도 선택지는 드문 것→잦은 것 순, "항상 통증"은 맨 아래.**
  "항상"이 맨 위면 과대 체크 경향 → 통증 평가 왜곡.
- **'없음'류 배타 옵션은 정확 일치 목록(NONE_OPTIONS)으로만** 판정.
  부분 문자열 매칭 금지 — "전신적으로 힘이 없음" 같은 증상 문구가 오인된다.
- 통증 묘사 단어 칩은 **전부 검은색 단일 톤으로 환자에게 노출**.
  구조물별 색·점수 매핑은 내부 분석용이며 화면에 공개하지 않는다(내부 정보).
- 의학 색 관례: 근육=빨강, 힘줄=흰색(윤곽선), 신경=노랑/앰버, 동맥=빨강, 정맥=파랑.
- (선택) 항목은 건너뛰기 버튼 필수, 문맥 맞는 라벨("악화 요인 없음" 등 skipLabel).
- 고령 환자 배려: 글자 축소 금지, 큰 터치 타깃, 한 화면 한 질문.
- 완료 화면: "원장이 직접 확인합니다"(실물 사진) + 요약 복사 + 인쇄/PDF + 신뢰 링크.
- **축약판 설계 규칙**: 문항을 빼기보다 **한 화면에 병합**(복합 type)하는 쪽이
  정보 손실이 적다. 병합 화면도 질문은 위→아래 1개씩 시각적으로 구분(sub-질문에
  q-ask 재사용). 축약 단어칩은 원장이 확정한 핵심 단어만(행복한H=8개), 빈도 순서
  규칙("항상"류 맨 아래)은 축약판에도 동일 적용.
- 축약판에서도 인체도·VAS 등 **진단 핵심 항목은 절대 빼지 않는다** — 빠져도 되는
  건 생활·선호·가족력 같은 보조 항목이다.

## 검증 (배포 전 필수)

Playwright 헤드리스로 각 분기를 끝까지 자동 완주시켜 확인한다:
- 요약(.copy-btn) 도달 / JS 에러 0건(이미지 404는 무시)
- 동의 게이트: 체크 전 버튼 비활성, 재접속 시 동의 생략(이어쓰기), 새로시작=동의부터
- 조건부 후속질문(악화상황·수술상세·기타암 등) 트리거
- SHEET_URL 더미로 라우트 가로채 POST payload 필드 확인
- **간편 모드 추가 검증**: ① 3분기 모두 간편 완주 → 요약 도달
  ② 문진 도중 convertToFull() → 이미 답한 key 전부 스킵 + 모호 항목(rest_pain 등)은
  재질문 목록에 남아 있는지 ③ 완료 화면의 전환 버튼 존재·동작 ④ 새로고침 후
  이어쓰기 시 shortMode 유지(steps.length로 확인) ⑤ multivas가 두 key에
  교차 오염 없이 저장되는지(bfi_level.avg vs pain_vas.v)
스텝 자동 진행 패턴: 화면에 존재하는 컨트롤(#date3/#opts/#multi/#bmStage/
#wchips/#freqm/#posture/#meds/#redflag/#tslStatus/#multivas/#twotext/#cmMeds/
#onsetTabs/input[type=range]/#txt)을 감지해 채우고 다음 클릭.
주의: single형은 클릭 즉시 자동 진행되므로 "채우기 후 무조건 다음 클릭" 패턴은
새 화면의 버튼을 잘못 누른다 — idx 변화를 확인하고 안 변했을 때만 다음을 클릭.

## 배포·운영 팁 (비개발자 고객 안내용)

- GitHub 웹 업로드 주소: `https://github.com/<계정>/<저장소>/upload/main` (덮어쓰기=같은 파일명).
- 갱신 확인은 **반드시 시크릿 창 또는 `?v=숫자`** — 캐시로 "반영 안 됐다" 오인 빈발.
- Pages URL이 환자 발송 링크. 커스텀 도메인 연결 가능.
- 시트 알림: 도구→알림 설정으로 새 응답 이메일 통지.
