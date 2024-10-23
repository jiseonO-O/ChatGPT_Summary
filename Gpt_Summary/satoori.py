import torch
from transformers import PreTrainedTokenizerFast
from transformers.models.bart import BartForConditionalGeneration 


# 모델 바이너리 파일 경로
model_binary_path = 'C:\\Users\\knara\\CYPR\\kobart_summary'

# KoBART 모델 및 토크나이저 로드
tokenizer = PreTrainedTokenizerFast.from_pretrained('gogamza/kobart-base-v1')
model = BartForConditionalGeneration.from_pretrained(model_binary_path)



# 입력 텍스트

satoori_input_text = "근데 막 디게 마이 파는데 디게 괘안고"

input_ids = tokenizer.encode(satoori_input_text, return_tensors="pt", max_length=1800, truncation=True)

output_ids = model.generate(input_ids, max_length=1800, min_length=0, length_penalty=2.0, num_beams=4, early_stopping=True)

output_text = tokenizer.decode(output_ids[0], skip_special_tokens=True)

print("TEXT:", output_text)