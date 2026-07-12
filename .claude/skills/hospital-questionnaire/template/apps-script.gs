/**
 * 병원 사전문진 → 구글시트 수집용 Apps Script
 *
 * 설치: 구글시트 → 확장 프로그램 → Apps Script → 이 코드 붙여넣기 → 저장
 * 배포: 배포 → 새 배포 → 유형: 웹 앱
 *       - 다음 사용자로 실행: 나
 *       - 액세스 권한: 모든 사용자   ← 반드시! (환자 폰에서 로그인 없이 전송)
 * 발급된 /exec URL을 index.html 의 SHEET_URL 에 넣는다.
 */
function doPost(e){
  try{
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName("문진") || ss.insertSheet("문진");
    if(sh.getLastRow()===0){
      sh.appendRow(["전송시각","동의","동의시각","분기","성함","요약","전체답변(JSON)"]);
    }
    sh.appendRow([d.submittedAt, d.consent, d.consentTime, d.branchLabel, d.name, d.summary, JSON.stringify(d.answers)]);
    return ContentService.createTextOutput("ok");
  }catch(err){ return ContentService.createTextOutput("error: "+err); }
}
