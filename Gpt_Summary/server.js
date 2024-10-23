// server.js
const express = require('express');
const OpenAI = require('openai');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');
let selectedChatRoom = '0';
const { exec } = require('child_process');

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OpenAI_API_KEY
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
// MySQL 연결 설정
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'CH'
});

// MySQL 연결
connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});
function sendMessageToClient() {
    // 모든 클라이언트에게 메시지 전송
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send('executeUpdateChatMessages');
            console.log('메시지 보냄');
        }
    });
}

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
});

app.post('/getResponse', async (req, res) => {
    try {
        const userMessage = req.body.userPrompt;
        const chatRoomNo = selectedChatRoom;

        const insertSql = 'INSERT INTO CHAT_MESSAGE (CHAT_ROOM_NO, userMessage) VALUES (?, ?)';
        connection.query(insertSql, [chatRoomNo, userMessage], (err, result) => {
            if (err) {
                console.error('Error executing SQL query:', err);
                res.status(500).json({ success: false, message: 'Failed to save user message' });
                return;
            }
            console.log('User message saved successfully');
        });

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ "role": "user", "content": userMessage}],
            max_tokens: 900
        });
        const gpt = response.choices[0].message.content;
        console.log(gpt);
        
        const insertSql2 = 'INSERT INTO CHAT_MESSAGE (CHAT_ROOM_NO, GPTMessage) VALUES (?, ?)';
        connection.query(insertSql2, [chatRoomNo, gpt], (err, result) => {
            if (err) {
                console.error('Error executing SQL query:', err);
                res.status(500).json({ success: false, message: 'Failed to save user message' });
                return;
            }
            console.log('GPT message saved successfully');
            sendMessageToClient(); // 작업 완료 후 클라이언트에게 메시지 전송
        });

    } catch (error) {
        console.error(error);
    }
});

app.post('/runPythonScript', (req, res) => {
    console.log("파이썬 실행");
    exec(`python script.py ${selectedChatRoom}`, (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing Python script:', error);
            res.status(500).send('Failed to execute Python script');
            return;
        }
        console.log('Python script executed successfully');
        console.log('Python script output:', stdout); // 파이썬 스크립트의 표준 출력을 출력
        res.send(stdout); // 클라이언트에게 파이썬 스크립트의 출력 전송
    });
});





// /getChatRooms 엔드포인트
app.get('/getChatRooms', (req, res) => {
    const sql = 'SELECT * FROM CHAT_ROOM';

    console.log(sql);
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).json({ success: false, message: 'Failed to get chat rooms' });
            return;
        }
        
        // 결과가 있을 때만 처리
        if (results.length > 0) {
            // 마지막 채팅방의 번호를 selectedChatRoom에 저장
            const lastChatRoomNo = results[results.length - 1].NO;
            selectedChatRoom = lastChatRoomNo;
        }

        console.log("1"+selectedChatRoom);
        res.status(200).json({ success: true, data: results });
    });
});

// /getChatMessages 엔드포인트
app.get('/getChatMessages', (req, res) => {
    const chatRoomNo = selectedChatRoom;

    // 데이터베이스에서 해당 채팅방의 대화 내용을 가져옵니다.
    const sql = 'SELECT userMessage,GPTMessage FROM chat_message WHERE CHAT_ROOM_NO = ?';

    console.log(sql + selectedChatRoom);
    connection.query(sql, [selectedChatRoom], (err, results) => {
        if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).json({ success: false, message: 'Failed to get chat messages' });
            return;
        }
        
        // userMessage 및 GPTMessage 필드만 선택하여 응답합니다.
        const messages = results.map(row => ({
            userMessage: row.userMessage,
            GPTMessage: row.GPTMessage
        }));
        
        console.log(messages);
        res.status(200).json(messages);
    });
});

// 빈 conversation 배열을 초기화합니다.
let conversation = [];

app.get('/', (req, res) => {
    res.render('index', { response: '', conversation: conversation });
});


app.post('/createChatRoom', (req, res) => {
    // 채팅방 생성 쿼리 실행
    const insertSql = 'INSERT INTO CHAT_ROOM VALUES (NULL)';
    connection.query(insertSql, (err, result) => {
        if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).json({ success: false, message: 'Failed to create chat room' });
            return;
        }

        // 삽입된 가장 최근 채팅방의 번호를 가져오는 쿼리 실행
        const selectSql = 'SELECT * FROM CHAT_ROOM ORDER BY NO DESC LIMIT 1';
        connection.query(selectSql, (err, result) => {
            if (err) {
                console.error('Error executing SQL query:', err);
                res.status(500).json({ success: false, message: 'Failed to get last chat room' });
                return;
            }

            // 삽입된 채팅방의 번호를 selectedChatRoom에 저장
            const selectedChatRoom = result[0].NO;

            console.log(selectedChatRoom);
            console.log('Chat room created successfully');
            res.status(200).json({ success: true, message: 'Chat room created successfully', roomNo: selectedChatRoom });
        });
    });
});






app.post('/selectChatRoom/:roomNo', (req, res) => {
    const roomNo = req.params.roomNo;
    console.log("3"+roomNo); // 서버 콘솔에 Chat Room 번호 출력

    // 서버의 전역 변수에 선택된 Chat Room 번호 저장
    console.log("전"+selectedChatRoom); 
    selectedChatRoom = roomNo;
    console.log("후"+selectedChatRoom); 
    // 클라이언트에게 응답 보내기 (원하는 형태로 응답 처리)
    res.json({ success: true, message: `Chat Room ${roomNo} selected successfully` });
});






app.listen(3000, () => {
    console.log('Server started on port 3000');
});
