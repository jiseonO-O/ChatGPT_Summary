import torch
from transformers import PreTrainedTokenizerFast
from transformers.models.bart import BartForConditionalGeneration 


# 모델 바이너리 파일 경로
model_binary_path = 'C:\\Users\\knara\\CYPR\\kobart_summary'

# KoBART 모델 및 토크나이저 로드
tokenizer = PreTrainedTokenizerFast.from_pretrained('gogamza/kobart-base-v1')
model = BartForConditionalGeneration.from_pretrained(model_binary_path)



# 입력 텍스트
input_text =  """
데이터베이스 관리 시스템(DBMS, Database Management System)은 데이터를 정의, 저장, 검색, 업데이트 및 관리하는 소프트웨어 시스템입니다.
DBMS는 데이터베이스와 사용자 간의 인터페이스 역할을 하며 데이터의 무결성과 보안을 유지하면서 데이터를 효율적으로 관리합니다.
데이터베이스는 조직의 중요한 자산으로, 효과적인 데이터 관리는 기업의 성공에 핵심적인 역할을 합니다.
DBMS의 주요 기능은 데이터 정의, 데이터 조작, 데이터 보안, 데이터 무결성, 데이터 회복, 데이터 동시성 제어 및 데이터베이스 언어 지원으로 나눌 수 있습니다.
데이터 정의 기능은 데이터베이스 구조를 정의하는 데 사용되며, 데이터 조작 기능은 데이터베이스에 데이터를 추가, 삭제, 수정, 검색하는 기능을 제공합니다.
데이터 보안 기능은 데이터에 대한 접근을 제어하고 보호하며, 데이터 무결성 기능은 데이터의 정확성과 일관성을 보장합니다.
데이터 회복 기능은 시스템 장애 시 데이터를 복구하며, 데이터 동시성 제어 기능은 여러 사용자가 동시에 데이터를 액세스할 때 일관성을 유지합니다.
마지막으로, 데이터베이스 언어 지원 기능은 데이터베이스와 상호 작용하기 위한 언어를 제공합니다.
DBMS는 여러 유형으로 나눌 수 있으며, 각각의 유형은 특정 용도와 요구에 맞게 설계되었습니다.
관계형 DBMS(RDBMS)는 가장 일반적인 유형으로, 데이터를 행과 열로 구성된 테이블 형식으로 저장합니다.
RDBMS는 SQL을 사용하여 데이터를 관리하며, 데이터 무결성을 보장하기 위해 ACID 특성을 준수합니다.
객체지향 DBMS(OODBMS)는 객체지향 프로그래밍 패러다임을 사용하여 데이터를 관리합니다.
DBMS의 성능은 여러 요소에 의해 좌우되며, 효율적인 인덱스 설계, 쿼리 최적화 및 정규화된 데이터 모델링이 필요합니다.
또한, 하드웨어 구성, 네트워크 속도 및 데이터베이스 서버의 자원 관리도 성능에 영향을 줍니다.
"""


input_ids = tokenizer.encode(input_text, return_tensors="pt", max_length=1024, truncation=True)

# 모델을 사용하여 요약 생성
summary_ids = model.generate(input_ids, max_length=150, min_length=80, length_penalty=2.0, num_beams=4, early_stopping=True)

# 요약 결과 디코딩
summary_text = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

# 요약 출력
print("요약 텍스트:", summary_text)