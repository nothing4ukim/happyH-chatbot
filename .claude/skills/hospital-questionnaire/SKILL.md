---
name: hospital-questionnaire
description: Build a branded pre-visit medical questionnaire (사전문진) web page for a hospital or clinic from the proven 행복한H병원 template — a single static HTML file with consent gate, touch body-map, clinic-specific question branches, summary/EMR copy, and Google Sheets collection. Use when creating a questionnaire for a new hospital, rebranding this one, or adding/changing clinic branches.
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

1. 이 저장소의 `index.html` 을 새 저장소의 `index.html` 로 복사.
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
· `text`(자유입력, short/optional/skipLabel) · `vas`/`vas2`(0-10 슬라이더 1/2개) · `sliders`(BFI형 다중)
· `scale03`(0~3 빈도, COMPASS형) · `date3`(연/월/일 선택) · `onset2`(대략 N전/정확 날짜 토글)
· `freqmulti`(기간별 횟수+항상) · `posture`(앉기🪑/서기🧍/운전🚗 시간+기타) · `meds`(약 이름+기간+종류)
· `wordchips`(자유입력+단어칩 다중선택) · `bodymap`(인체도 터치 마킹) · `freetalk`(마무리)
스텝 공통 옵션: `sec`(섹션 제목) `img`/`imgFn`(질문 위 그림, 클릭 확대) `imgCap` `note`
`detail`(자세히보기 그림) `widget:"coinpalm"`(동전·손바닥 비교, 파일 불필요)
`fu:{...}, fuIf:"트리거문구"`(조건부 후속질문).

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

## 검증 (배포 전 필수)

Playwright 헤드리스로 각 분기를 끝까지 자동 완주시켜 확인한다:
- 요약(.copy-btn) 도달 / JS 에러 0건(이미지 404는 무시)
- 동의 게이트: 체크 전 버튼 비활성, 재접속 시 동의 생략(이어쓰기), 새로시작=동의부터
- 조건부 후속질문(악화상황·수술상세·기타암 등) 트리거
- SHEET_URL 더미로 라우트 가로채 POST payload 필드 확인
스텝 자동 진행 패턴: 화면에 존재하는 컨트롤(#date3/#opts/#multi/#bmStage/
#wchips/#freqm/#posture/#meds/input[type=range]/#txt)을 감지해 채우고 다음 클릭.

## 배포·운영 팁 (비개발자 고객 안내용)

- GitHub 웹 업로드 주소: `https://github.com/<계정>/<저장소>/upload/main` (덮어쓰기=같은 파일명).
- 갱신 확인은 **반드시 시크릿 창 또는 `?v=숫자`** — 캐시로 "반영 안 됐다" 오인 빈발.
- Pages URL이 환자 발송 링크. 커스텀 도메인 연결 가능.
- 시트 알림: 도구→알림 설정으로 새 응답 이메일 통지.
