# 스테일메이트 랩 — Android 학습 앱

불리한 흰색으로 자신의 스테일메이트를 만드는 오프라인 체스 학습 앱입니다.
Java Activity + 앱 내부에 포함된 WebView 화면으로 구성하며 네트워크 권한이 없습니다.
Android 8.0(API 26) 이상, compile/target SDK 35, Java 17, Gradle 8.12, AGP 8.8.0.

## 현재 문제의 범위

**50개 모두 상대 응수가 고정된 원리 학습 퍼즐입니다.** 상대가 최선으로 방어해도
스테일메이트를 강제한다는 뜻이 아닙니다. 왕만 남은 상태에서는 상대의 실수가
필요한 경우가 많아, 이를 실전 강제 무승부와 구분해서 화면에 표시합니다.

| 단계 | 구성 | 개수 |
|---|---|---:|
| 1 | 왕만 남은 상황, 내 1수 | 10 |
| 2 | 왕만 남은 상황, 내 2수 | 10 |
| 3 | 왕만 남은 상황, 내 3수 | 10 |
| 4 | 왕 + 룩·비숍·나이트 중 하나, 내 1수 | 10 |
| 5 | 왕 + 룩·비숍·나이트 중 하나, 내 2수 | 10 |

내 1수 뒤에 상대 응수가 자동으로 이어집니다. 시작 위치는 모두 흰색 차례이고
기물 가치가 상대보다 낮습니다. 문제마다 실제 스테일메이트에서 합법적인 수를
역으로 찾아 생성했으며, 시작 배치의 회전·반사 중복도 제거했습니다.

- 기물을 선택하면 합법적인 이동 칸 표시
- 힌트, 한 수 되돌리기, 처음부터 다시 연습
- 해법 수순과 한 수씩 재생하기
- 주어진 상대 응수에서 최단 수순 하나 제공; 같은 조건의 다른 정답도 허용
- 완료 기록을 기기에 저장; 힌트·해법 참고 여부 구분
- 최종 상태는 실제 체스 규칙으로 판정, 체크메이트 및 다른 무승부는 성공 제외

기물이 남는 단계는 현재 마지막 기물을 희생하는 유형입니다. 폰을 막거나 핀으로
움직이지 못하게 하는 유형, 실전 엔진 상대, 강제 무승부 검증은 후속 확장 범위입니다.

## 실행

Android Studio에서 이 폴더를 열거나 SDK 경로를 설정한 뒤 실행합니다.

```sh
export ANDROID_HOME=/path/to/Android/sdk
./gradlew assembleDebug
```

출력: `app/build/outputs/apk/debug/app-debug.apk`
설치용 사본: `deliverables/stalemate-lab-debug.apk`

이번 결과는 개발용 debug 서명 APK이며 스토어 게시용 서명/배포는 포함하지 않습니다.

화면 미리보기:

```sh
python3 -m http.server 4186 --directory app/src/main/assets
```

브라우저에서 http://localhost:4186 을 엽니다. Android 앱도 같은 화면/규칙 코드를
APK 내부에서 로드합니다. 미리보기와 설치 앱의 완료 기록은 별개입니다.

## 검증

```sh
node --test tests/*.test.js
./gradlew lintDebug assembleDebug
```

54개 Node 테스트: 50개 전체 해법의 합법성·최단 길이·기보 일치·최종 스테일메이트,
불리한 시작 배치, 단계별 개수, 잘못된 수 거부, 대체 정답 수용 등을 검사합니다.
기보 생성에는 python-chess, 앱 판정에는 chess.js를 사용해 독립적으로 검증합니다.
실기기 설치/실행 검증은 아직 하지 않았습니다.

재생성(선택):

```sh
python3 -m venv .venv
.venv/bin/pip install python-chess==1.999
.venv/bin/python scripts/generate_puzzles.py
```

## 파일

- `app/src/main/assets/app.js`: 화면과 연습 흐름
- `app/src/main/assets/engine.js`: 주어진 응수에 대한 최단 해법 탐색
- `app/src/main/assets/puzzles.js`: 50개 FEN, 응수, 해법, 해설
- `scripts/generate_puzzles.py`: 고정 시드 문제 생성기
- `app/src/main/java/com/stalematelab/app/MainActivity.java`: 오프라인 Android 셸

## 출처 및 라이선스

판정 규칙: [FIDE Laws of Chess, 5.2.1](https://handbook.fide.com/chapter/e012023).
chess.js 1.4.0: https://github.com/jhlywa/chess.js, BSD-2-Clause.
라이선스 전문은 `app/src/main/assets/vendor/chess.LICENSE`에 포함되어 있습니다.
체스 기물 SVG와 문제 데이터는 이 프로젝트를 위해 생성했습니다.
