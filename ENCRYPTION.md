# cokacenc v2 암호화 포맷 설계

## 배경

v1은 원본 파일명을 암호화된 파일의 이름에 그대로 노출하는 구조였다.
v2는 원본 정보를 전부 암호화된 페이로드 내부의 메타데이터에 넣고,
파일명은 불투명(opaque)하게 만든다.

v1과의 하위 호환은 고려하지 않는다.

---

## 암호화된 파일명 규칙

```
<group_id 16hex>_<seq 4letter>.cokacenc
```

- `group_id`: pack 시점에 랜덤 생성 (16자 hex = 8바이트)
  - 같은 원본 파일에서 나온 청크끼리 묶는 식별자
  - 원본 파일 정보와 무관한 순수 랜덤값
- `seq`: aaaa ~ zzzz (26^4 = 456,976개, 0-based)
- 단일 파일도 `_aaaa` 시퀀스를 가짐 (항상 동일 포맷)

예시:
```
단일:  a3f8e1b2c7d04590_aaaa.cokacenc
분할:  a3f8e1b2c7d04590_aaaa.cokacenc
       a3f8e1b2c7d04590_aaab.cokacenc
       a3f8e1b2c7d04590_aaac.cokacenc
```

복호화 전에도 파일명의 group_id로 청크 그룹핑이 가능하다.

---

## 청크 바이너리 레이아웃

모든 청크가 동일한 구조를 갖는다 (자기완결적).

```
┌──────────────────────────────────────┐
│ Header (44 bytes)                    │
│   magic: "COKACENC" (8B)            │
│   version: 2 (u32 LE, 4B)           │
│   salt: (16B)                        │
│   iv: (16B)                          │
├──────────────────────────────────────┤
│ Encrypted payload (AES-256-CBC):     │
│   metadata_len (u32 LE, 4B)         │
│   metadata (JSON UTF-8, 가변)        │
│   file data (원본 파일의 해당 구간)     │
│   PKCS7 padding                      │
└──────────────────────────────────────┘
```

- header의 version 필드가 `2`이면 v2 포맷
- salt, iv는 청크마다 독립 생성 (기존과 동일)
- 키 유도: PBKDF2-HMAC-SHA512, 100,000회, salt당 독립 AES-256 키
- encrypted payload 안에서 먼저 4바이트로 metadata 길이를 읽고, 그만큼 JSON을 읽고, 나머지가 원본 파일 데이터

---

## 메타데이터 JSON 스키마

```json
{
  "v": 2,
  "group": "a3f8e1b2c7d04590",
  "name": "vacation_photo.jpg",
  "size": 15728640,
  "md5": "d41d8cd98f00b204e9800998ecf8427e",
  "mtime": 1708070400,
  "perm": 644,
  "chunks": 3,
  "idx": 0,
  "offset": 0,
  "len": 5242880
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `v` | u32 | 메타데이터 포맷 버전 (2) |
| `group` | string | 그룹 ID (파일명과 동일, 16hex) |
| `name` | string | 원본 파일명 |
| `size` | u64 | 원본 전체 크기 (bytes) |
| `md5` | string | 원본 전체 MD5 (32hex) |
| `mtime` | i64 | 원본 수정 시각 (unix timestamp, seconds) |
| `perm` | u32 | 원본 파일 퍼미션 (unix mode, 예: 644) |
| `chunks` | u32 | 전체 청크 수 |
| `idx` | u32 | 이 청크의 인덱스 (0-based) |
| `offset` | u64 | 원본 파일에서의 바이트 오프셋 |
| `len` | u64 | 이 청크에 포함된 원본 데이터 크기 |

필드명은 모든 청크에 반복되므로 짧은 이름을 사용한다.
청크당 메타데이터 오버헤드는 약 200~300바이트로, 분할 크기(1800MB)에 비해 무시 가능하다.

---

## 모든 청크에 메타데이터를 넣는 이유

- **자기완결적**: 각 청크만으로 원본 파일 정보 확인 가능
- **손실 감지**: `chunks` 필드와 실제 모인 청크 수 비교로 누락 즉시 감지
- **순서 무관 조립**: `offset` 필드로 정확한 위치에 write 가능
- **독립 검증**: 어떤 청크든 복호화하면 원본 파일의 전체 정보를 알 수 있음

---

## Pack 흐름 (암호화)

```
입력: 디렉토리, 키 파일
대상: 숨김 파일 제외, .cokacenc 제외, 일반 파일만

각 파일에 대해:
  1단계 — 원본 정보 수집 (1st pass)
    - 파일 전체 읽기 → MD5 해시 계산
    - 파일 크기, 수정시각, 퍼미션 수집
    - total_chunks = ceil(file_size / split_size)
    - group_id = 랜덤 8바이트 → 16hex 문자열

  2단계 — 암호화 및 청크 생성 (2nd pass)
    각 청크(i = 0 .. total_chunks-1)에 대해:
      a. 메타데이터 JSON 생성
         - chunk_offset = i * split_size
         - chunk_data_size = min(split_size, file_size - chunk_offset)
      b. salt, iv 랜덤 생성 → AES 키 유도
      c. 헤더 44바이트 write
      d. encrypt 시작:
         - metadata_len (4B LE) + metadata JSON bytes 를 encryptor에 feed
         - 원본 파일에서 chunk_offset부터 chunk_data_size만큼 읽으며 encryptor에 feed
         - finalize (PKCS7 padding)
      e. 파일명: <group_id>_<seq>.cokacenc

  3단계 — 원본 파일 삭제
```

2-pass 읽기를 허용한다. 1st pass에서 MD5와 메타데이터를 확정하고,
2nd pass에서 스트리밍 암호화를 수행한다.

---

## Unpack 흐름 (복호화)

```
입력: 디렉토리, 키 파일
대상: *.cokacenc 파일

  1단계 — 파일명으로 그룹핑
    - <group_id>_<seq>.cokacenc 패턴 파싱
    - group_id 기준으로 그룹화, seq 기준으로 정렬

  2단계 — 각 그룹 복호화
    a. 첫 번째 청크 복호화:
       - 헤더 읽기 → version == 2 확인
       - 복호화 시작
       - metadata_len 4바이트 읽기
       - metadata JSON 파싱 → 원본 파일명, 전체 크기, total_chunks, MD5 확인
       - 나머지 = 파일 데이터 → 임시 파일에 write
    b. 나머지 청크들도 동일하게 복호화:
       - 각 청크의 메타데이터에서 offset 확인
       - 해당 offset 위치에 파일 데이터 write
    c. 모든 청크 완료 후:
       - 누락 청크 검사 (total_chunks vs 실제 청크 수)
       - 전체 파일 MD5 검증 (메타데이터의 md5 vs 실제 계산값)
       - 검증 성공 → 임시 파일을 원본 파일명으로 rename
       - 수정시각, 퍼미션 복원
       - .cokacenc 파일 삭제

  3단계 — 실패 처리
    - MD5 불일치 → 임시 파일 삭제, 에러 보고
    - 청크 누락 → 에러 보고 (부분 복호화 시도하지 않음)
```

---

## 분할 크기

기본값: 1800 MB (기존과 동일)

---

## 수정 대상 파일

### 변경
- `src/enc/mod.rs` — pack/unpack 로직을 v2 방식으로 전면 재작성
- `src/enc/naming.rs` — 파일명 규칙 변경 (group_id + seq 방식)

### 유지
- `src/enc/error.rs` — 그대로 사용
- `src/enc/crypto.rs` — 그대로 사용 (헤더의 version 값만 2로 변경)
- `src/ui/app.rs` — 변경 없음
- `src/ui/dialogs.rs` — 변경 없음
- `src/main.rs` — 변경 없음
- `src/keybindings.rs` — 변경 없음
- `src/services/file_ops.rs` — 변경 없음
- `Cargo.toml` — 변경 없음
