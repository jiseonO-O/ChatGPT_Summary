import mysql.connector
import sys
import json
import torch
from transformers import PreTrainedTokenizerFast
from transformers.models.bart import BartForConditionalGeneration 

sys.stdout.reconfigure(encoding='utf-8')

def get_chat_messages(chat_room_no):
    mydb = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="CH",
    )

    mycursor = mydb.cursor()

    query = "SELECT GPTMessage FROM chat_message WHERE CHAT_ROOM_NO = %s"
    mycursor.execute(query, (chat_room_no,))

    result = mycursor.fetchall()

    mydb.close()
    chat_messages = ' '.join([row[0].replace('\n', '').replace('\\n', '').strip() for row in result if row[0] is not None and row[0] != "" and row[0] != '\n' and row[0] != '\\n'])
    return chat_messages

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python script.py <CHAT_ROOM_NO>")
        sys.exit(1)

    chat_room_no = sys.argv[1]
    
    chat_messages = get_chat_messages(chat_room_no)
    model_binary_path = 'C:\\Users\\knara\\CYPR\\kobart_summary'
    chat_length = len(chat_messages)
    tokenizer = PreTrainedTokenizerFast.from_pretrained('gogamza/kobart-base-v1')
    model = BartForConditionalGeneration.from_pretrained(model_binary_path)
    input_ids = tokenizer.encode(chat_messages, return_tensors="pt", max_length=10240, truncation=True)
    num5 = int(chat_length * 0.05)
    num20 = int(chat_length * 0.20)

    summary_ids = model.generate(input_ids, max_length=num20, min_length=num5, length_penalty=2.0, num_beams=4, early_stopping=True)

    summary_text = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    print(summary_text)
